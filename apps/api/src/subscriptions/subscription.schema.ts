import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { ItemCategory } from "@lf/shared";

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ timestamps: true, collection: "subscriptions" })
export class Subscription {
  @Prop({ type: String, required: true, index: true, lowercase: true, trim: true })
  email!: string;

  @Prop({
    type: String,
    enum: Object.values(ItemCategory),
    required: true,
    index: true,
  })
  category!: ItemCategory;

  @Prop({ type: [String], default: [], index: true })
  keywords!: string[];

  @Prop({ type: Boolean, default: true, index: true })
  active!: boolean;

  @Prop({ type: Date })
  lastNotifiedAt?: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
SubscriptionSchema.index({ email: 1, category: 1 });
