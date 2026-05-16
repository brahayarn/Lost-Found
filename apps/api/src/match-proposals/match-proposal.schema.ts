import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { MatchProposalStatus } from "@lf/shared";

export type MatchProposalDocument = HydratedDocument<MatchProposal>;

@Schema({ timestamps: true, collection: "match_proposals" })
export class MatchProposal {
  @Prop({ type: Types.ObjectId, ref: "Item", required: true, index: true })
  itemId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Claim", required: true, index: true })
  claimId!: Types.ObjectId;

  @Prop({ type: Number, required: true })
  score!: number;

  @Prop({
    type: String,
    enum: Object.values(MatchProposalStatus),
    default: MatchProposalStatus.PENDING,
    index: true,
  })
  status!: MatchProposalStatus;

  @Prop({ type: [String], default: [] })
  reasons!: string[];
}

export const MatchProposalSchema = SchemaFactory.createForClass(MatchProposal);

MatchProposalSchema.index({ itemId: 1, claimId: 1 }, { unique: true });
