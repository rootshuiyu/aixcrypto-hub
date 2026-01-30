import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MarketModule } from './market/market.module';
import { PlaygroundModule } from './playground/playground.module';
import { QuestModule } from './quest/quest.module';
import { TeamModule } from './team/team.module';
import { AuthModule } from './auth/auth.module';
import { VaultModule } from './vault/vault.module';
import { AIModule } from './ai/ai.module';
import { StrategyModule } from './strategy/strategy.module';
import { SettlementModule } from './settlement/settlement.module';
import { AdminModule } from './admin/admin.module';
import { SeasonModule } from './season/season.module';
import { RoundModule } from './round/round.module';
import { ContractModule } from './contract/contract.module';
import { AMMModule } from './amm/amm.module';
import { ReferralModule } from './referral/referral.module';
import { NotificationModule } from './notification/notification.module';
import { AppConfigModule } from './config/config.module';
import { EsportsModule } from './esports/esports.module';
import { FootballModule } from './football/football.module';
import { UserModule } from './user/user.module';

import { PrismaModule } from './prisma.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // 全局速率限制: 每分鐘最多 100 個請求 / IP
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000,    // 1 秒
      limit: 10,    // 每秒最多 10 個請求
    }, {
      name: 'medium',
      ttl: 10000,   // 10 秒
      limit: 50,    // 每 10 秒最多 50 個請求
    }, {
      name: 'long',
      ttl: 60000,   // 1 分鐘
      limit: 100,   // 每分鐘最多 100 個請求
    }]),
    PrismaModule,
    EventsModule,
    MarketModule,
    PlaygroundModule,
    QuestModule,
    TeamModule,
    AuthModule,
    VaultModule,
    AIModule,
    StrategyModule,
    SettlementModule,
    AdminModule,
    SeasonModule,
    RoundModule,
    ContractModule,
    AMMModule,
    ReferralModule,
    NotificationModule,
    AppConfigModule,
    EsportsModule,
    FootballModule,
    UserModule,
  ],
  controllers: [],
  providers: [
    // 啟用全局速率限制守衛
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
