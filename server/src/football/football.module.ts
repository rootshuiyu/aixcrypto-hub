import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { FootballController } from './football.controller';
import { FootballService } from './football.service';
import { PrismaModule } from '../prisma.module';
import { QuestModule } from '../quest/quest.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    QuestModule,
    EventsModule,
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 3,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [FootballController],
  providers: [FootballService],
  exports: [FootballService],
})
export class FootballModule {}
