import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

interface SendInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private from = "Lost & Found <onboarding@resend.dev>";

  constructor(private readonly cfg: ConfigService) {}

  onModuleInit() {
    const key = this.cfg.get<string>("RESEND_API_KEY");
    const from = this.cfg.get<string>("MAIL_FROM");
    if (from) this.from = from;
    if (key) {
      this.resend = new Resend(key);
      this.logger.log(`📧 Resend enabled (from: ${this.from})`);
    } else {
      this.logger.warn(
        "RESEND_API_KEY not set — emails are logged only (dev mode)",
      );
    }
  }

  async send({ to, subject, html, text }: SendInput): Promise<void> {
    if (!this.resend) {
      this.logger.log(`📧 [DEV] → ${to} | ${subject}`);
      return;
    }
    try {
      const result = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        text,
      });
      if (result.error) {
        this.logger.error(`Resend error: ${JSON.stringify(result.error)}`);
        return;
      }
      this.logger.log(`📧 sent ${result.data?.id} → ${to}`);
    } catch (err: any) {
      this.logger.error(`Email send failed: ${err?.message ?? err}`);
    }
  }
}
