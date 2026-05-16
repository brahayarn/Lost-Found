import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { ItemCategory } from "@lf/shared";

export type RetentionPolicyDocument = HydratedDocument<RetentionPolicy>;

@Schema({ timestamps: true, collection: "retention_policies" })
export class RetentionPolicy {
  @Prop({
    type: String,
    enum: Object.values(ItemCategory),
    required: true,
    unique: true,
    index: true,
  })
  category!: ItemCategory;

  @Prop({ type: Number, required: true, min: 1, max: 3650 })
  days!: number;
}

export const RetentionPolicySchema =
  SchemaFactory.createForClass(RetentionPolicy);
