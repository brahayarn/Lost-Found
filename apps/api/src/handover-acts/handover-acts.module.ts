import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HandoverAct, HandoverActSchema } from "./handover-act.schema";
import { HandoverActsService } from "./handover-acts.service";
import { HandoverActsController } from "./handover-acts.controller";
import { Item, ItemSchema } from "../items/item.schema";
import { ClaimsModule } from "../claims/claims.module";
import { MatchProposalsModule } from "../match-proposals/match-proposals.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HandoverAct.name, schema: HandoverActSchema },
      { name: Item.name, schema: ItemSchema },
    ]),
    ClaimsModule,
    MatchProposalsModule,
  ],
  controllers: [HandoverActsController],
  providers: [HandoverActsService],
  exports: [HandoverActsService],
})
export class HandoverActsModule {}
