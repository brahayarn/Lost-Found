import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Model, Types } from "mongoose";
import { ClaimStatus, ItemStatus, MatchProposalStatus } from "@lf/shared";
import { Item, ItemDocument } from "../items/item.schema";
import { Claim, ClaimDocument } from "../claims/claim.schema";
import {
  MatchProposal,
  MatchProposalDocument,
} from "../match-proposals/match-proposal.schema";
import {
  QUEUE_NOTIFICATIONS,
  type MatchFoundJob,
} from "../queues/queue.constants";

const SCORE_THRESHOLD = Number(process.env.MATCH_SCORE_THRESHOLD ?? "0.5");

interface CandidateItem {
  _id: Types.ObjectId;
  itemNumber: string;
  title: string;
  foundAt: Date;
  score?: number;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Claim.name) private readonly claimModel: Model<ClaimDocument>,
    @InjectModel(MatchProposal.name)
    private readonly proposalModel: Model<MatchProposalDocument>,
    @InjectQueue(QUEUE_NOTIFICATIONS)
    private readonly notificationsQueue: Queue,
  ) {}

  async matchFromClaim(claimId: string): Promise<void> {
    const claim = await this.claimModel.findById(claimId);
    if (!claim) {
      this.logger.warn(`Claim ${claimId} not found`);
      return;
    }

    const candidates = await this.itemModel
      .find(
        {
          category: claim.category,
          status: { $in: [ItemStatus.NEW, ItemStatus.PUBLISHED] },
          foundAt: { $gte: claim.lostAt },
          $text: { $search: claim.description },
        },
        { score: { $meta: "textScore" }, itemNumber: 1, title: 1, foundAt: 1 },
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(20)
      .lean<CandidateItem[]>();

    await this.persistProposals(
      candidates.map((c) => ({
        itemId: c._id,
        itemNumber: c.itemNumber,
        claimId: claim._id,
        claimEmail: claim.claimerEmail,
        score: c.score ?? 0,
        reasons: [
          `category=${claim.category}`,
          `foundAt>=lostAt`,
          `text-score=${(c.score ?? 0).toFixed(2)}`,
        ],
      })),
    );

    if (candidates.length > 0) {
      await this.claimModel.updateOne(
        { _id: claim._id, status: ClaimStatus.NEW },
        { $set: { status: ClaimStatus.MATCHED } },
      );
    }
  }

  async matchFromItem(itemId: string): Promise<void> {
    const item = await this.itemModel.findById(itemId);
    if (!item) {
      this.logger.warn(`Item ${itemId} not found`);
      return;
    }

    const claims = await this.claimModel
      .find(
        {
          category: item.category,
          status: { $in: [ClaimStatus.NEW, ClaimStatus.PROCESSING] },
          lostAt: { $lte: item.foundAt },
          $text: { $search: item.description },
        },
        {
          score: { $meta: "textScore" },
          claimNumber: 1,
          claimerEmail: 1,
        },
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(20)
      .lean<
        Array<{
          _id: Types.ObjectId;
          claimerEmail: string;
          score?: number;
        }>
      >();

    await this.persistProposals(
      claims.map((c) => ({
        itemId: item._id,
        itemNumber: item.itemNumber,
        claimId: c._id,
        claimEmail: c.claimerEmail,
        score: c.score ?? 0,
        reasons: [
          `category=${item.category}`,
          `lostAt<=foundAt`,
          `text-score=${(c.score ?? 0).toFixed(2)}`,
        ],
      })),
    );
  }

  private async persistProposals(
    candidates: Array<{
      itemId: Types.ObjectId;
      itemNumber: string;
      claimId: Types.ObjectId;
      claimEmail: string;
      score: number;
      reasons: string[];
    }>,
  ) {
    for (const c of candidates) {
      if (c.score < SCORE_THRESHOLD) continue;

      try {
        await this.proposalModel.create({
          itemId: c.itemId,
          claimId: c.claimId,
          score: c.score,
          status: MatchProposalStatus.PENDING,
          reasons: c.reasons,
        });
        this.logger.log(
          `Match proposal: item=${c.itemId} claim=${c.claimId} score=${c.score.toFixed(2)}`,
        );

        await this.notificationsQueue.add(
          "match-found",
          {
            to: c.claimEmail,
            claimId: c.claimId.toString(),
            itemId: c.itemId.toString(),
            itemNumber: c.itemNumber,
            score: c.score,
          } satisfies MatchFoundJob,
          { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
        );
      } catch (err: any) {
        if (err?.code === 11000) continue;
        throw err;
      }
    }
  }
}
