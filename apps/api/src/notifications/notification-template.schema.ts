import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type NotificationTemplateDocument = HydratedDocument<NotificationTemplate>;

@Schema({ timestamps: true, collection: "notification_templates" })
export class NotificationTemplate {
  @Prop({ type: String, required: true, unique: true, index: true })
  key!: string;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({ type: String, required: true })
  subject!: string;

  @Prop({ type: String, required: true })
  html!: string;

  @Prop({ type: String, default: "" })
  text!: string;

  @Prop({ type: [String], default: [] })
  variables!: string[];
}

export const NotificationTemplateSchema = SchemaFactory.createForClass(
  NotificationTemplate,
);
