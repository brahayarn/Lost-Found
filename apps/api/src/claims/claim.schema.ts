import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { ClaimStatus, ItemCategory } from "@lf/shared";

export type ClaimDocument = HydratedDocument<Claim>;

@Schema({ _id: false })
class LostLocation {
  @Prop({ type: String, required: true }) address!: string;
  @Prop({ type: Number }) lat?: number;
  @Prop({ type: Number }) lng?: number;
}

@Schema({ timestamps: true, collection: "claims" })
export class Claim {
  @Prop({ type: String, required: true, unique: true, index: true })
  claimNumber!: string;

  @Prop({
    type: String,
    enum: Object.values(ClaimStatus),
    default: ClaimStatus.NEW,
    index: true,
  })
  status!: ClaimStatus;

  @Prop({
    type: String,
    enum: Object.values(ItemCategory),
    required: true,
    index: true,
  })
  category!: ItemCategory;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({ type: Date, required: true, index: true })
  lostAt!: Date;

  @Prop({ type: LostLocation, required: true })
  lostLocation!: LostLocation;

  @Prop({ type: String, required: true })
  claimerEmail!: string;

  @Prop({ type: String })
  claimerPhone?: string;

  @Prop({ type: Boolean, default: false, index: true })
  identityConfirmed!: boolean;

  @Prop({ type: Date })
  identityConfirmedAt?: Date;

  @Prop({ type: String })
  idDocumentUrl?: string;
}

export const ClaimSchema = SchemaFactory.createForClass(Claim);
ClaimSchema.index({ description: "text" });
