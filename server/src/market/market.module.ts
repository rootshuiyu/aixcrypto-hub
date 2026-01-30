import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { IndexService } from './index.service';
import { ExchangePriceService } from './exchange-price.service';
import { BacktestService } from './backtest.service';
import { MarketCalendarService } from './market-calendar.service';
import { QuestModule } from '../quest/quest.module';
import { EventsModule } from '../events/events.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [QuestModule, EventsModule, AIModule],
  controllers: [MarketController],
  providers: [
    MarketService, 
    IndexService, 
    ExchangePriceService, 
    BacktestService,
    MarketCalendarService
  ],
  exports: [
    MarketService, 
    IndexService, 
    ExchangePriceService, 
    BacktestService,
    MarketCalendarService
  ],
})
export class MarketModule {}
