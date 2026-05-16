import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import Handlebars from "handlebars";
import {
  NotificationTemplate,
  NotificationTemplateDocument,
} from "./notification-template.schema";

interface TemplateSeed {
  key: string;
  description: string;
  subject: string;
  html: string;
  text: string;
  variables: string[];
}

const DEFAULTS: TemplateSeed[] = [
  {
    key: "match-found",
    description: "Заявнику: знайдено можливий збіг із знахідкою",
    subject: "Можливо, ми знайшли вашу річ — {{itemNumber}}",
    html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;">
  <h2 style="margin:24px 0 8px;">Можливо, це ваша річ</h2>
  <p style="color:#57534e;">Ми знайшли потенційний збіг із вашою заявкою.</p>
  <div style="border:1px solid #e7e5e4;border-radius:8px;padding:16px;background:#fafaf9;">
    <p style="margin:0 0 4px;font-size:13px;color:#78716c;">Знахідка</p>
    <p style="margin:0;font-family:monospace;">{{itemNumber}}</p>
    <p style="margin:12px 0 4px;font-size:13px;color:#78716c;">Match score</p>
    <p style="margin:0;">{{score}}</p>
  </div>
  <p style="margin:24px 0;">
    <a href="{{itemUrl}}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;">
      Подивитись знахідку
    </a>
  </p>
  <p style="color:#78716c;font-size:13px;">Якщо це не ваша річ — проігноруйте лист.</p>
</div>`,
    text: "Ми знайшли можливий збіг ({{itemNumber}}, score {{score}}). Перегляньте: {{itemUrl}}",
    variables: ["itemNumber", "score", "itemUrl"],
  },
  {
    key: "retention-warning",
    description: "Персоналу: термін зберігання закінчується через N днів",
    subject: "Термін зберігання закінчується через {{daysLeft}} дн. — {{itemNumber}}",
    html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;">
  <h2 style="font-size:20px;margin:24px 0 8px;">Термін зберігання закінчується через {{daysLeft}} дн.</h2>
  <p style="color:#57534e;">Знахідка <strong>{{itemNumber}}</strong> наближається до автоматичної утилізації.</p>
  <p><a href="{{itemUrl}}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;">Відкрити в адмінці</a></p>
</div>`,
    text: "Знахідка {{itemNumber}} буде утилізована через {{daysLeft}} дн. {{itemUrl}}",
    variables: ["itemNumber", "daysLeft", "itemUrl"],
  },
  {
    key: "subscription-match",
    description: "Підписнику: з'явилася знахідка за параметрами підписки",
    subject: "Нова знахідка за вашою підпискою — {{itemTitle}}",
    html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;">
  <h2 style="margin:24px 0 8px;">Знайдено річ, що може вас зацікавити</h2>
  <p style="color:#57534e;">У категорії <strong>{{category}}</strong> з’явилась нова знахідка:</p>
  <div style="border:1px solid #e7e5e4;border-radius:8px;padding:16px;background:#fafaf9;">
    <p style="margin:0;font-family:monospace;font-size:13px;color:#78716c;">{{itemNumber}}</p>
    <p style="margin:8px 0 0;font-size:16px;font-weight:600;">{{itemTitle}}</p>
  </div>
  <p style="margin:24px 0;">
    <a href="{{itemUrl}}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;">Подивитись знахідку</a>
  </p>
  <p style="color:#78716c;font-size:13px;">Ви отримали цей лист бо підписалися на сповіщення про знахідки у категорії {{category}}.</p>
</div>`,
    text: "Нова знахідка {{itemNumber}} у категорії {{category}}: {{itemTitle}}. {{itemUrl}}",
    variables: ["itemNumber", "itemTitle", "category", "itemUrl"],
  },
  {
    key: "retention-expired",
    description: "Персоналу: термін зберігання вичерпано (TO_DISPOSE)",
    subject: "Термін зберігання вичерпано — {{itemNumber}}",
    html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;">
  <h2 style="font-size:20px;margin:24px 0 8px;">Термін зберігання вичерпано</h2>
  <p style="color:#57534e;">Знахідка <strong>{{itemNumber}}</strong> переведена у статус TO_DISPOSE.</p>
  <p><a href="{{itemUrl}}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;">Відкрити в адмінці</a></p>
</div>`,
    text: "Знахідка {{itemNumber}} переведена у TO_DISPOSE. {{itemUrl}}",
    variables: ["itemNumber", "itemUrl"],
  },
];

export interface RenderedTemplate {
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class NotificationTemplatesService implements OnModuleInit {
  private readonly logger = new Logger(NotificationTemplatesService.name);

  constructor(
    @InjectModel(NotificationTemplate.name)
    private readonly model: Model<NotificationTemplateDocument>,
  ) {}

  async onModuleInit() {
    for (const d of DEFAULTS) {
      await this.model.updateOne(
        { key: d.key },
        {
          $setOnInsert: d,
        },
        { upsert: true },
      );
    }
    this.logger.log(`Notification templates: ${DEFAULTS.length} seeded`);
  }

  async list() {
    return this.model.find().sort({ key: 1 }).lean();
  }

  async findByKey(key: string) {
    return this.model.findOne({ key }).lean();
  }

  async upsert(
    key: string,
    payload: { subject?: string; html?: string; text?: string },
  ) {
    return this.model.findOneAndUpdate(
      { key },
      { $set: payload },
      { new: true },
    );
  }

  async render(key: string, vars: Record<string, unknown>): Promise<RenderedTemplate> {
    const t = await this.findByKey(key);
    if (!t) {
      throw new Error(`Template "${key}" not found`);
    }
    return {
      subject: Handlebars.compile(t.subject)(vars),
      html: Handlebars.compile(t.html)(vars),
      text: Handlebars.compile(t.text)(vars),
    };
  }
}
