import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ClaimStatus,
  HandoverDto,
  ItemStatus,
  MatchProposalStatus,
} from "@lf/shared";
import { Item, ItemDocument } from "../items/item.schema";
import { Claim, ClaimDocument } from "../claims/claim.schema";
import {
  MatchProposal,
  MatchProposalDocument,
} from "../match-proposals/match-proposal.schema";
import {
  HandoverAct,
  HandoverActDocument,
} from "./handover-act.schema";

@Injectable()
export class HandoverActsService {
  private readonly logger = new Logger(HandoverActsService.name);

  constructor(
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Claim.name) private readonly claimModel: Model<ClaimDocument>,
    @InjectModel(MatchProposal.name)
    private readonly proposalModel: Model<MatchProposalDocument>,
    @InjectModel(HandoverAct.name)
    private readonly actModel: Model<HandoverActDocument>,
  ) {}

  async list(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    from?: string;
    to?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const filter: Record<string, unknown> = {};
    if (params.from || params.to) {
      const range: Record<string, Date> = {};
      if (params.from) range.$gte = new Date(params.from);
      if (params.to) range.$lte = new Date(params.to);
      filter.handoverDate = range;
    }
    if (params.search?.trim()) {
      const rx = new RegExp(
        params.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      filter.$or = [{ operatorName: rx }, { notes: rx }];
    }
    const [data, total] = await Promise.all([
      this.actModel
        .find(filter)
        .populate("itemId", "itemNumber title category")
        .populate("claimId", "claimNumber claimerEmail")
        .sort({ handoverDate: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.actModel.countDocuments(filter),
    ]);
    return { data, total, page, pageSize };
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.actModel
      .findById(id)
      .populate("itemId", "itemNumber title category foundLocation foundAt")
      .populate("claimId", "claimNumber claimerEmail description")
      .lean();
  }

  async handover(itemId: string, dto: HandoverDto) {
    if (!Types.ObjectId.isValid(itemId)) {
      throw new NotFoundException("Item not found");
    }
    const item = await this.itemModel.findById(itemId);
    if (!item) throw new NotFoundException("Item not found");
    if (item.status === ItemStatus.RETURNED) {
      throw new ConflictException("Item already returned");
    }

    const act = await this.actModel.create({
      itemId: item._id,
      claimId: dto.claimId ? new Types.ObjectId(dto.claimId) : undefined,
      operatorName: dto.operatorName ?? "Admin",
      signature: dto.signature,
      notes: dto.notes,
      handoverDate: new Date(),
    });

    item.status = ItemStatus.RETURNED;
    await item.save();

    if (dto.claimId) {
      await this.claimModel.updateOne(
        { _id: dto.claimId },
        { $set: { status: ClaimStatus.CLOSED } },
      );
    }

    // Confirm matching proposal for item↔claim, archive the rest
    if (dto.claimId) {
      await this.proposalModel.updateOne(
        {
          itemId: item._id,
          claimId: new Types.ObjectId(dto.claimId),
          status: MatchProposalStatus.PENDING,
        },
        { $set: { status: MatchProposalStatus.CONFIRMED } },
      );
      await this.proposalModel.updateMany(
        {
          itemId: item._id,
          claimId: { $ne: new Types.ObjectId(dto.claimId) },
          status: MatchProposalStatus.PENDING,
        },
        { $set: { status: MatchProposalStatus.REJECTED } },
      );
    } else {
      await this.proposalModel.updateMany(
        { itemId: item._id, status: MatchProposalStatus.PENDING },
        { $set: { status: MatchProposalStatus.REJECTED } },
      );
    }

    this.logger.log(
      `Handover ${act._id.toString()} for item ${item.itemNumber}`,
    );

    return {
      id: act._id.toString(),
      itemId: item._id.toString(),
      itemNumber: item.itemNumber,
      claimId: dto.claimId,
      handoverDate: act.handoverDate,
    };
  }
}
