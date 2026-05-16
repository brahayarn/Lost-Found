import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ItemsModule } from "../items/items.module";
import { ClaimsModule } from "../claims/claims.module";
import { MatchProposalsModule } from "../match-proposals/match-proposals.module";
import {
  QUEUE_MATCHING,
  QUEUE_NOTIFICATIONS,
} from "../queues/queue.constants";
import { MatchingService } from "./matching.service";
import { MatchingProcessor } from "./matching.processor";

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_MATCHING },
      { name: QUEUE_NOTIFICATIONS },
    ),
    ItemsModule,
    ClaimsModule,
    MatchProposalsModule,
  ],
  providers: [MatchingService, MatchingProcessor],
  exports: [MatchingService],
})
export class MatchingModule {}
