import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ItemCategory } from "@lf/shared";
import {
  Subscription,
  SubscriptionDocument,
} from "./subscription.schema";

export interface CreateSubscriptionInput {
  email: string;
  category: ItemCategory;
  keywords?: string[];
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel(Subscription.name)
    private readonly model: Model<SubscriptionDocument>,
  ) {}

  async create(input: CreateSubscriptionInput): Promise<SubscriptionDocument> {
    const keywords = (input.keywords ?? [])
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10);

    const doc = await this.model.findOneAndUpdate(
      {
        email: input.email.toLowerCase().trim(),
        category: input.category,
      },
      {
        $set: { keywords, active: true },
        $setOnInsert: { email: input.email.toLowerCase().trim() },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return doc;
  }

  async list(params: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 50));
    const filter: Record<string, unknown> = {};
    if (params.search?.trim()) {
      const rx = new RegExp(
        params.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      filter.email = rx;
    }
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { data, total, page, pageSize };
  }

  async deactivate(id: string) {
    return this.model.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true },
    );
  }

  /**
   * Знаходить активні підписки, що матчать категорію/ключові слова items.
   * Якщо в підписки порожні keywords — матчиться будь-яка нова річ цієї категорії.
   */
  async findMatchingFor(item: {
    category: ItemCategory;
    title: string;
    description: string;
    tags?: string[];
  }): Promise<SubscriptionDocument[]> {
    const subs = await this.model.find({
      category: item.category,
      active: true,
    });

    if (subs.length === 0) return [];

    const haystack = [
      item.title.toLowerCase(),
      item.description.toLowerCase(),
      ...(item.tags ?? []).map((t) => t.toLowerCase()),
    ].join(" ");

    return subs.filter((s) => {
      if (!s.keywords?.length) return true;
      return s.keywords.some((k) => haystack.includes(k.toLowerCase()));
    });
  }
}
