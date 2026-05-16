import { Module } from "@nestjs/common";
import { ItemsModule } from "../items/items.module";
import { ClaimsModule } from "../claims/claims.module";
import { MatchProposalsModule } from "../match-proposals/match-proposals.module";
import { AnalyticsController } from "./analytics.controller";

@Module({
  imports: [ItemsModule, ClaimsModule, MatchProposalsModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
