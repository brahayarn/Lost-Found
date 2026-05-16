import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BullModule } from "@nestjs/bullmq";
import { Item, ItemSchema } from "./item.schema";
import { ItemsService } from "./items.service";
import { ItemsController } from "./items.controller";
import { CountersModule } from "../common/counters/counters.module";
import { PdfModule } from "../pdf/pdf.module";
import { HandoverActsModule } from "../handover-acts/handover-acts.module";
import { RetentionPoliciesModule } from "../retention/retention-policies.module";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import {
  QUEUE_MATCHING,
  QUEUE_NOTIFICATIONS,
} from "../queues/queue.constants";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
    BullModule.registerQueue({ name: QUEUE_MATCHING }),
    BullModule.registerQueue({ name: QUEUE_NOTIFICATIONS }),
    CountersModule,
    PdfModule,
    HandoverActsModule,
    RetentionPoliciesModule,
    SubscriptionsModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService, MongooseModule],
})
export class ItemsModule {}
