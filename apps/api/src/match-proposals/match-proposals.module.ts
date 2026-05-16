import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MatchProposal, MatchProposalSchema } from "./match-proposal.schema";
import { MatchProposalsService } from "./match-proposals.service";
import { MatchProposalsController } from "./match-proposals.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MatchProposal.name, schema: MatchProposalSchema },
    ]),
  ],
  controllers: [MatchProposalsController],
  providers: [MatchProposalsService],
  exports: [MongooseModule, MatchProposalsService],
})
export class MatchProposalsModule {}
