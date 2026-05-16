import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MatchProposalStatus } from "@lf/shared";
import {
  MatchProposal,
  MatchProposalDocument,
} from "./match-proposal.schema";

@Injectable()
export class MatchProposalsService {
  constructor(
    @InjectModel(MatchProposal.name)
    private readonly proposalModel: Model<MatchProposalDocument>,
  ) {}

  async findOne(id: string) {
    return this.proposalModel
      .findById(id)
      .populate("itemId", "itemNumber title category status photoUrls")
      .populate("claimId", "claimNumber description claimerEmail status")
      .lean();
  }

  async setStatus(id: string, status: MatchProposalStatus) {
    return this.proposalModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    );
  }

  async list(params: { page: number; pageSize: number; status?: string }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const filter: any = {};
    if (params.status) filter.status = params.status;

    const [data, total] = await Promise.all([
      this.proposalModel
        .find(filter)
        .sort({ createdAt: -1, score: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate("itemId", "itemNumber title category status photoUrls")
        .populate("claimId", "claimNumber description claimerEmail status")
        .lean(),
      this.proposalModel.countDocuments(filter),
    ]);

    return { data, total, page, pageSize };
  }
}
