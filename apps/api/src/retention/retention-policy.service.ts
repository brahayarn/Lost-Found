import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ItemCategory } from "@lf/shared";
import {
  RetentionPolicy,
  RetentionPolicyDocument,
} from "./retention-policy.schema";

const DEFAULT_DAYS: Record<ItemCategory, number> = {
  [ItemCategory.DOCUMENTS]: 30,
  [ItemCategory.ELECTRONICS]: 120,
  [ItemCategory.KEYS]: 60,
  [ItemCategory.BAG]: 90,
  [ItemCategory.CLOTHING]: 60,
  [ItemCategory.JEWELRY]: 180,
  [ItemCategory.OTHER]: 90,
};

@Injectable()
export class RetentionPolicyService implements OnModuleInit {
  private readonly logger = new Logger(RetentionPolicyService.name);
  private cache = new Map<ItemCategory, number>();

  constructor(
    @InjectModel(RetentionPolicy.name)
    private readonly model: Model<RetentionPolicyDocument>,
  ) {}

  async onModuleInit() {
    for (const [category, days] of Object.entries(DEFAULT_DAYS) as Array<
      [ItemCategory, number]
    >) {
      await this.model.updateOne(
        { category },
        { $setOnInsert: { days } },
        { upsert: true },
      );
    }
    await this.refreshCache();
    this.logger.log(
      `Retention policies loaded: ${this.cache.size} categories`,
    );
  }

  private async refreshCache() {
    this.cache.clear();
    const rows = await this.model.find().lean();
    for (const r of rows) this.cache.set(r.category, r.days);
  }

  getDays(category: ItemCategory): number {
    return this.cache.get(category) ?? DEFAULT_DAYS[category] ?? 90;
  }

  async list() {
    return this.model.find().sort({ category: 1 }).lean();
  }

  async upsert(category: ItemCategory, days: number) {
    const doc = await this.model.findOneAndUpdate(
      { category },
      { $set: { days } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    this.cache.set(category, days);
    return doc;
  }
}
