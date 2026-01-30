import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { EsportsController } from './esports.controller';
import { EsportsService } from './esports.service';
import { RiotService } from './providers/riot.service';
import { OpenDotaService } from './providers/opendota.service';
import { CS2SimulatorService } from './providers/cs2-simulator.service';
import { PandaScoreService } from './providers/pandascore.service';
import { SportDevsService } from './providers/sportdevs.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 3,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [EsportsController],
  providers: [
    EsportsService,
    RiotService,
    OpenDotaService,
    CS2SimulatorService,
    PandaScoreService,
    SportDevsService,
  ],
  exports: [EsportsService],
})
export class EsportsModule {}
