import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job } from "bullmq";
import {
  QUEUE_NOTIFICATIONS,
  type MatchFoundJob,
  type RetentionExpiredJob,
  type RetentionWarningJob,
  type SubscriptionMatchJob,
} from "../queues/queue.constants";
import { EmailService } from "../email/email.service";
import { NotificationTemplatesService } from "./notification-templates.service";

@Processor(QUEUE_NOTIFICATIONS)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly email: EmailService,
    private readonly cfg: ConfigService,
    private readonly templates: NotificationTemplatesService,
  ) {
    super();
  }

  private webOrigin() {
    return this.cfg.get<string>("WEB_ORIGIN", "http://localhost:3001");
  }

  private appendUnsubscribe<T extends { html: string; text: string; subject: string }>(
    rendered: T,
    token: string | undefined,
  ): T {
    if (!token) return rendered;
    const url = `${this.webOrigin()}/unsubscribe?token=${encodeURIComponent(token)}`;
    const htmlFooter = `<p style="margin-top:24px;padding-top:16px;border-top:1px solid #e7e5e4;color:#a8a29e;font-size:12px;text-align:center;">Не хочете отримувати такі листи? <a href="${url}" style="color:#78716c;text-decoration:underline;">Відписатись від сповіщень</a></p>`;
    const textFooter = `\n\n—\nЩоб відписатись від сповіщень: ${url}`;
    return {
      ...rendered,
      html: `${rendered.html}${htmlFooter}`,
      text: `${rendered.text}${textFooter}`,
    };
  }

  private staffRecipients(): string[] {
    const raw = this.cfg.get<string>("STAFF_EMAILS", "");
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async process(
    job: Job<
      | MatchFoundJob
      | RetentionWarningJob
      | RetentionExpiredJob
      | SubscriptionMatchJob
    >,
  ): Promise<void> {
    switch (job.name) {
      case "subscription-match": {
        const d = job.data as SubscriptionMatchJob;
        const itemUrl = `${this.webOrigin()}/items/${d.itemId}`;
        const rendered = await this.templates.render("subscription-match", {
          itemNumber: d.itemNumber,
          itemTitle: d.itemTitle,
          category: d.category,
          itemUrl,
        });
        const withUnsub = this.appendUnsubscribe(rendered, d.unsubscribeToken);
        await this.email.send({ to: d.to, ...withUnsub });
        return;
      }
      case "match-found": {
        const d = job.data as MatchFoundJob;
        const itemUrl = `${this.webOrigin()}/items/${d.itemId}`;
        const rendered = await this.templates.render("match-found", {
          itemNumber: d.itemNumber,
          score: d.score.toFixed(2),
          itemUrl,
        });
        await this.email.send({ to: d.to, ...rendered });
        return;
      }
      case "retention-warning": {
        const d = job.data as RetentionWarningJob;
        const recipients = this.staffRecipients();
        const itemUrl = `${this.webOrigin()}/admin/items/${d.itemId}`;
        const rendered = await this.templates.render("retention-warning", {
          itemNumber: d.itemNumber,
          daysLeft: d.daysLeft,
          itemUrl,
        });
        for (const to of recipients) {
          await this.email.send({ to, ...rendered });
        }
        if (!recipients.length) {
          this.logger.log(
            `📧 [retention-warning] item=${d.itemNumber} daysLeft=${d.daysLeft} (no STAFF_EMAILS set)`,
          );
        }
        return;
      }
      case "retention-expired": {
        const d = job.data as RetentionExpiredJob;
        const recipients = this.staffRecipients();
        const itemUrl = `${this.webOrigin()}/admin/items/${d.itemId}`;
        const rendered = await this.templates.render("retention-expired", {
          itemNumber: d.itemNumber,
          itemUrl,
        });
        for (const to of recipients) {
          await this.email.send({ to, ...rendered });
        }
        if (!recipients.length) {
          this.logger.log(
            `📧 [retention-expired] item=${d.itemNumber} (no STAFF_EMAILS set)`,
          );
        }
        return;
      }
      default:
        this.logger.warn(`Unknown notification: ${job.name}`);
    }
  }
}
