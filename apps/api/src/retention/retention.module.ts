import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ItemsModule } from "../items/items.module";
import { QUEUE_NOTIFICATIONS } from "../queues/queue.constants";
import { RetentionService } from "./retention.service";
import { RetentionController } from "./retention.controller";
import { RetentionPoliciesModule } from "./retention-policies.module";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [
    ItemsModule,
    RetentionPoliciesModule,
    EmailModule,
    BullModule.registerQueue({ name: QUEUE_NOTIFICATIONS }),
  ],
  controllers: [RetentionController],
  providers: [RetentionService],
})
export class RetentionModule {}
