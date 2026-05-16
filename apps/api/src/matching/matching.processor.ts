import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import {
  QUEUE_MATCHING,
  type MatchFromClaimJob,
  type MatchFromItemJob,
} from "../queues/queue.constants";
import { MatchingService } from "./matching.service";

@Processor(QUEUE_MATCHING)
export class MatchingProcessor extends WorkerHost {
  private readonly logger = new Logger(MatchingProcessor.name);

  constructor(private readonly matching: MatchingService) {
    super();
  }

  async process(
    job: Job<MatchFromItemJob | MatchFromClaimJob>,
  ): Promise<void> {
    this.logger.log(`Job ${job.name} #${job.id}`);

    if (job.name === "match-from-item") {
      await this.matching.matchFromItem((job.data as MatchFromItemJob).itemId);
      return;
    }
    if (job.name === "match-from-claim") {
      await this.matching.matchFromClaim(
        (job.data as MatchFromClaimJob).claimId,
      );
      return;
    }
    this.logger.warn(`Unknown job name: ${job.name}`);
  }
}
