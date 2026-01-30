import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MarketModule } from '../market/market.module';
import { EventsModule } from '../events/events.module';
import { QuestModule } from '../quest/quest.module';

@Module({
  imports: [MarketModule, EventsModule, QuestModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

