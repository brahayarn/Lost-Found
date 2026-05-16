import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { ItemCategory, ItemStatus } from "@lf/shared";

export type ItemDocument = HydratedDocument<Item>;

@Schema({ _id: false })
class FoundLocation {
  @Prop({ type: String, required: true }) address!: string;
  @Prop({ type: Number }) lat?: number;
  @Prop({ type: Number }) lng?: number;
}

@Schema({ timestamps: true, collection: "items" })
export class Item {
  @Prop({ type: String, required: true, unique: true, index: true })
  itemNumber!: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  trackingCode!: string;

  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({
    type: String,
    enum: Object.values(ItemCategory),
    required: true,
  })
  category!: ItemCategory;

  @Prop({
    type: String,
    enum: Object.values(ItemStatus),
    default: ItemStatus.NEW,
    index: true,
  })
  status!: ItemStatus;

  @Prop({ type: FoundLocation, required: true })
  foundLocation!: FoundLocation;

  @Prop({ type: Date, required: true })
  foundAt!: Date;

  @Prop({ type: String }) reporterEmail?: string;
  @Prop({ type: String }) reporterPhone?: string;

  @Prop({ type: [String], default: [] })
  photoUrls!: string[];

  @Prop({ type: [String], default: [] })
  blurredPhotoUrls!: string[];

  @Prop({ type: Boolean, default: false })
  isValuable!: boolean;

  @Prop({ type: String })
  serialNumber?: string;

  @Prop({ type: String })
  hiddenMarks?: string;

  @Prop({ type: Date, index: true })
  retentionDate?: Date;

  @Prop({ type: String })
  color?: string;

  @Prop({ type: String })
  brand?: string;

  @Prop({ type: [String], default: [], index: true })
  tags!: string[];

  @Prop({ type: String })
  internalNotes?: string;

  @Prop({ type: String })
  verificationNotes?: string;

  @Prop({ type: String })
  verifiedBy?: string;

  @Prop({ type: Date })
  verifiedAt?: Date;
}

export const ItemSchema = SchemaFactory.createForClass(Item);

ItemSchema.index({ title: "text", description: "text", tags: "text", brand: "text", color: "text" });
