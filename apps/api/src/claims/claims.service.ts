import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Model } from "mongoose";
import { CreateClaimDto, ClaimStatus } from "@lf/shared";
import { Claim, ClaimDocument } from "./claim.schema";
import { CountersService } from "../common/counters/counters.service";
import {
  QUEUE_MATCHING,
  type MatchFromClaimJob,
} from "../queues/queue.constants";

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);

  constructor(
    @InjectModel(Claim.name) private readonly claimModel: Model<ClaimDocument>,
    private readonly counters: CountersService,
    @InjectQueue(QUEUE_MATCHING) private readonly matchingQueue: Queue,
  ) {}

  async create(dto: CreateClaimDto): Promise<ClaimDocument> {
    const year = new Date().getFullYear();
    const seq = await this.counters.nextSeq(`claims:${year}`);
    const claimNumber = `CL-${year}-${String(seq).padStart(5, "0")}`;

    const created = await this.claimModel.create({
      claimNumber,
      status: ClaimStatus.NEW,
      category: dto.category,
      description: dto.description,
      lostAt: new Date(dto.lostAt),
      lostLocation: dto.lostLocation,
      claimerEmail: dto.claimerEmail,
      claimerPhone: dto.claimerPhone,
    });

    await this.matchingQueue.add(
      "match-from-claim",
      { claimId: created._id.toString() } satisfies MatchFromClaimJob,
      { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
    );

    this.logger.log(`Claim ${claimNumber} created → matching queued`);
    return created;
  }

  async findById(id: string) {
    return this.claimModel.findById(id).lean();
  }

  async updateStatus(
    id: string,
    status: ClaimStatus,
  ): Promise<ClaimDocument | null> {
    return this.claimModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    );
  }

  async confirmIdentity(
    id: string,
    idDocumentUrl?: string,
  ): Promise<ClaimDocument | null> {
    return this.claimModel.findByIdAndUpdate(
      id,
      {
        $set: {
          identityConfirmed: true,
          identityConfirmedAt: new Date(),
          ...(idDocumentUrl ? { idDocumentUrl } : {}),
        },
      },
      { new: true },
    );
  }

  async revokeIdentity(id: string): Promise<ClaimDocument | null> {
    return this.claimModel.findByIdAndUpdate(
      id,
      {
        $set: { identityConfirmed: false },
        $unset: { identityConfirmedAt: "" },
      },
      { new: true },
    );
  }

  async list(params: {
    page: number;
    pageSize: number;
    search?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const filter: any = {};
    if (params.search?.trim()) {
      const rx = new RegExp(
        params.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      filter.$or = [{ description: rx }, { claimNumber: rx }];
    }
    const [data, total] = await Promise.all([
      this.claimModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.claimModel.countDocuments(filter),
    ]);
    return { data, total, page, pageSize };
  }
}
