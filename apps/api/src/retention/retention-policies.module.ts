import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  RetentionPolicy,
  RetentionPolicySchema,
} from "./retention-policy.schema";
import { RetentionPolicyService } from "./retention-policy.service";
import { RetentionPolicyController } from "./retention-policy.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RetentionPolicy.name, schema: RetentionPolicySchema },
    ]),
  ],
  controllers: [RetentionPolicyController],
  providers: [RetentionPolicyService],
  exports: [RetentionPolicyService],
})
export class RetentionPoliciesModule {}
