import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { MongooseModule } from "@nestjs/mongoose";
import { QUEUE_NOTIFICATIONS } from "../queues/queue.constants";
import { NotificationsProcessor } from "./notifications.processor";
import {
  NotificationTemplate,
  NotificationTemplateSchema,
} from "./notification-template.schema";
import { NotificationTemplatesService } from "./notification-templates.service";
import { NotificationTemplatesController } from "./notification-templates.controller";

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NOTIFICATIONS }),
    MongooseModule.forFeature([
      { name: NotificationTemplate.name, schema: NotificationTemplateSchema },
    ]),
  ],
  controllers: [NotificationTemplatesController],
  providers: [NotificationsProcessor, NotificationTemplatesService],
  exports: [NotificationTemplatesService],
})
export class NotificationsModule {}
