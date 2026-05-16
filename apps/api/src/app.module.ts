import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { BullModule } from "@nestjs/bullmq";
import { ScheduleModule } from "@nestjs/schedule";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import * as path from "path";
import { UploadsModule } from "./uploads/uploads.module";
import { HandoverActsModule } from "./handover-acts/handover-acts.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { EmailModule } from "./email/email.module";
import { ItemsModule } from "./items/items.module";
import { ClaimsModule } from "./claims/claims.module";
import { CountersModule } from "./common/counters/counters.module";
import { MatchProposalsModule } from "./match-proposals/match-proposals.module";
import { MatchingModule } from "./matching/matching.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { RetentionModule } from "./retention/retention.module";
import { RetentionPoliciesModule } from "./retention/retention-policies.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AuditModule } from "./audit/audit.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), ".env"),
        path.resolve(process.cwd(), "../../.env"),
      ],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        uri: cfg.getOrThrow<string>("MONGO_URI"),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        connection: {
          host: cfg.get<string>("REDIS_HOST", "localhost"),
          port: Number(cfg.get<string>("REDIS_PORT", "6379")),
        },
      }),
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 1000 },
      { name: "public", ttl: 60_000, limit: 100 },
    ]),
    ServeStaticModule.forRoot({
      rootPath: path.resolve(process.cwd(), "uploads"),
      serveRoot: "/uploads",
      serveStaticOptions: { index: false, fallthrough: true },
    }),
    CountersModule,
    MatchProposalsModule,
    ItemsModule,
    ClaimsModule,
    MatchingModule,
    NotificationsModule,
    RetentionPoliciesModule,
    RetentionModule,
    AnalyticsModule,
    AuditModule,
    SubscriptionsModule,
    UploadsModule,
    HandoverActsModule,
    UsersModule,
    AuthModule,
    EmailModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
