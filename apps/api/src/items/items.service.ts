import { Injectable, ConflictException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { FilterQuery, Model, SortOrder } from "mongoose";
import { CreateItemDto, ItemStatus } from "@lf/shared";
import { Item, ItemDocument } from "./item.schema";
import { CountersService } from "../common/counters/counters.service";
import { RetentionPolicyService } from "../retention/retention-policy.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import {
  QUEUE_MATCHING,
  QUEUE_NOTIFICATIONS,
  type MatchFromItemJob,
  type SubscriptionMatchJob,
} from "../queues/queue.constants";

export interface ListItemsParams {
  page: number;
  pageSize: number;
  search?: string;
  sortField?: string;
  sortDesc?: boolean;
  status?: string;
}

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);

  constructor(
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    private readonly counters: CountersService,
    private readonly retentionPolicy: RetentionPolicyService,
    private readonly subscriptions: SubscriptionsService,
    @InjectQueue(QUEUE_MATCHING) private readonly matchingQueue: Queue,
    @InjectQueue(QUEUE_NOTIFICATIONS)
    private readonly notificationsQueue: Queue,
  ) {}

  private async notifySubscribers(item: ItemDocument) {
    try {
      const subs = await this.subscriptions.findMatchingFor({
        category: item.category,
        title: item.title,
        description: item.description,
        tags: item.tags,
      });
      for (const s of subs) {
        await this.notificationsQueue.add(
          "subscription-match",
          {
            to: s.email,
            itemId: item._id.toString(),
            itemNumber: item.itemNumber,
            itemTitle: item.title,
            category: item.category,
            unsubscribeToken: s.unsubscribeToken,
          } satisfies SubscriptionMatchJob,
          { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
        );
      }
      if (subs.length) {
        this.logger.log(
          `Queued ${subs.length} subscription notifications for ${item.itemNumber}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `notifySubscribers failed: ${(err as Error).message}`,
      );
    }
  }

  async create(dto: CreateItemDto): Promise<ItemDocument> {
    // trackingCode за ТЗ — формат LF-YYYY-NNNNN, який нам дає лічильник.
    // itemNumber лишаємо як алієс для зворотної сумісності UI.
    const itemNumber = await this.counters.nextItemNumber();

    const days = this.retentionPolicy.getDays(dto.category);
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() + days);

    for (let attempt = 0; attempt < 3; attempt++) {
      const trackingCode = itemNumber;
      try {
        const created = await this.itemModel.create({
          itemNumber,
          trackingCode,
          title: dto.title,
          description: dto.description,
          category: dto.category,
          status: dto.isValuable
            ? ItemStatus.VERIFICATION
            : ItemStatus.PUBLISHED,
          foundLocation: dto.foundLocation,
          foundAt: new Date(dto.foundAt),
          reporterEmail: dto.reporterEmail,
          reporterPhone: dto.reporterPhone,
          photoUrls: dto.photoUrls ?? [],
          blurredPhotoUrls: dto.blurredPhotoUrls ?? [],
          isValuable: dto.isValuable ?? false,
          serialNumber: dto.serialNumber,
          hiddenMarks: dto.hiddenMarks,
          color: dto.color,
          brand: dto.brand,
          tags: dto.tags ?? [],
          internalNotes: dto.internalNotes,
          retentionDate,
        });
        await this.matchingQueue.add(
          "match-from-item",
          { itemId: created._id.toString() } satisfies MatchFromItemJob,
          { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
        );
        // Сповіщаємо підписників — лише для опублікованих (VERIFICATION → потім, у verify())
        if (created.status === ItemStatus.PUBLISHED) {
          await this.notifySubscribers(created);
        }
        return created;
      } catch (err: any) {
        if (err?.code === 11000 && err?.keyPattern?.trackingCode) {
          this.logger.warn(`tracking code collision, retry #${attempt + 1}`);
          continue;
        }
        throw err;
      }
    }
    throw new ConflictException("Failed to generate unique tracking code");
  }

  async list(params: ListItemsParams) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const filter: FilterQuery<ItemDocument> = {};
    if (params.status) filter.status = params.status;
    if (params.search?.trim()) {
      const rx = new RegExp(
        params.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      filter.$or = [
        { title: rx },
        { description: rx },
        { itemNumber: rx },
        { trackingCode: rx },
      ];
    }

    const allowedSort = new Set([
      "itemNumber",
      "title",
      "category",
      "status",
      "foundAt",
      "createdAt",
    ]);
    const sortField = allowedSort.has(params.sortField ?? "")
      ? (params.sortField as string)
      : "createdAt";
    const sort: Record<string, SortOrder> = {
      [sortField]: params.sortDesc ? -1 : 1,
    };

    const [data, total] = await Promise.all([
      this.itemModel.find(filter).sort(sort).skip(skip).limit(pageSize).lean(),
      this.itemModel.countDocuments(filter),
    ]);

    return { data, total, page, pageSize };
  }

  async findById(id: string) {
    return this.itemModel.findById(id).lean();
  }

  async findByIdPublic(id: string) {
    const item = await this.itemModel.findById(id).lean();
    if (!item) return null;
    return this.toPublic(item);
  }

  async listPublic(params: ListItemsParams) {
    // публічний каталог показує лише PUBLISHED + MATCHED, NEW/VERIFICATION/CLAIMED/ARCHIVED — приховані
    const r = await this.list({
      ...params,
      status: params.status ?? "PUBLISHED",
    });
    return { ...r, data: r.data.map((i) => this.toPublic(i)) };
  }

  async verify(
    id: string,
    opts: { verificationNotes?: string; verifiedBy?: string } = {},
  ): Promise<ItemDocument | null> {
    const updated = await this.itemModel.findOneAndUpdate(
      { _id: id, status: ItemStatus.VERIFICATION },
      {
        $set: {
          status: ItemStatus.PUBLISHED,
          verificationNotes: opts.verificationNotes,
          verifiedBy: opts.verifiedBy,
          verifiedAt: new Date(),
        },
      },
      { new: true },
    );
    if (updated) {
      this.logger.log(
        `Item ${updated.itemNumber} verified by ${opts.verifiedBy ?? "?"} → PUBLISHED`,
      );
      await this.notifySubscribers(updated);
    }
    return updated;
  }

  async bulkDispose(ids: string[], action: "POLICE" | "CHARITY" | "DESTROY") {
    const result = await this.itemModel.updateMany(
      { _id: { $in: ids }, status: ItemStatus.TO_DISPOSE },
      { $set: { status: ItemStatus.ARCHIVED } },
    );
    this.logger.log(
      `Bulk dispose ${action}: ${result.modifiedCount}/${ids.length} archived`,
    );
    return { modified: result.modifiedCount, action };
  }

  private toPublic(item: any) {
    const {
      photoUrls,
      blurredPhotoUrls,
      serialNumber: _s,
      hiddenMarks: _h,
      reporterEmail: _e,
      reporterPhone: _p,
      internalNotes: _n,
      ...rest
    } = item;
    return {
      ...rest,
      photoUrls: blurredPhotoUrls?.length ? blurredPhotoUrls : [],
      blurredPhotoUrls: undefined,
    };
  }
}
