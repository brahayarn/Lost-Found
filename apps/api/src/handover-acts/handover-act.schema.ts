import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type HandoverActDocument = HydratedDocument<HandoverAct>;

@Schema({ timestamps: true, collection: "handover_acts" })
export class HandoverAct {
  @Prop({ type: Types.ObjectId, ref: "Item", required: true, index: true })
  itemId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Claim", index: true })
  claimId?: Types.ObjectId;

  @Prop({ type: String, required: true, default: "Admin" })
  operatorName!: string;

  @Prop({ type: String, required: true })
  signature!: string;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: Date, default: () => new Date() })
  handoverDate!: Date;
}

export const HandoverActSchema = SchemaFactory.createForClass(HandoverAct);
