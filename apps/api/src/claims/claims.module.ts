import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BullModule } from "@nestjs/bullmq";
import { Claim, ClaimSchema } from "./claim.schema";
import { ClaimsService } from "./claims.service";
import { ClaimsController } from "./claims.controller";
import { CountersModule } from "../common/counters/counters.module";
import { QUEUE_MATCHING } from "../queues/queue.constants";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Claim.name, schema: ClaimSchema }]),
    BullModule.registerQueue({ name: QUEUE_MATCHING }),
    CountersModule,
  ],
  controllers: [ClaimsController],
  providers: [ClaimsService],
  exports: [ClaimsService, MongooseModule],
})
export class ClaimsModule {}
