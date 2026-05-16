import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Model } from "mongoose";
import { ItemStatus } from "@lf/shared";
import { Item, ItemDocument } from "../items/item.schema";
import {
  QUEUE_NOTIFICATIONS,
  type RetentionExpiredJob,
  type RetentionWarningJob,
} from "../queues/queue.constants";

const WARNING_DAYS = [7, 3, 1];
const ACTIVE_STATUSES: ItemStatus[] = [
  ItemStatus.NEW,
  ItemStatus.PUBLISHED,
  ItemStatus.MATCHED,
];

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectQueue(QUEUE_NOTIFICATIONS)
    private readonly notificationsQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: "retention-sweep" })
  async sweep(): Promise<{
    warnings: number;
    expired: number;
  }> {
    return this.runSweep();
  }

  async runSweep(): Promise<{ warnings: number; expired: number }> {
    this.logger.log("Retention sweep started");

    const now = new Date();
    let warnings = 0;

    for (const days of WARNING_DAYS) {
      const start = startOfDay(addDays(now, days));
      const end = startOfDay(addDays(now, days + 1));

      const items = await this.itemModel
        .find(
          {
            status: { $in: ACTIVE_STATUSES },
            retentionDate: { $gte: start, $lt: end },
          },
          { itemNumber: 1 },
        )
        .lean();

      for (const it of items) {
        await this.notificationsQueue.add("retention-warning", {
          itemId: it._id.toString(),
          itemNumber: it.itemNumber,
          daysLeft: days,
        } satisfies RetentionWarningJob);
        warnings++;
      }
      if (items.length) {
        this.logger.log(`warn ${days}d: ${items.length} items`);
      }
    }

    const expiredItems = await this.itemModel.find(
      {
        status: { $in: ACTIVE_STATUSES },
        retentionDate: { $lte: now },
      },
      { itemNumber: 1 },
    );

    for (const it of expiredItems) {
      await this.itemModel.updateOne(
        { _id: it._id },
        { $set: { status: ItemStatus.TO_DISPOSE } },
      );
      await this.notificationsQueue.add("retention-expired", {
        itemId: it._id.toString(),
        itemNumber: it.itemNumber,
      } satisfies RetentionExpiredJob);
    }

    if (expiredItems.length) {
      this.logger.log(`${expiredItems.length} items → TO_DISPOSE`);
    }
    this.logger.log("Retention sweep done");
    return { warnings, expired: expiredItems.length };
  }
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
