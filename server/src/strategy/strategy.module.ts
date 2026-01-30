import { Module, forwardRef } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { StrategyController } from './strategy.controller';
import { PrismaModule } from '../prisma.module';
import { AIModule } from '../ai/ai.module';
import { QuestModule } from '../quest/quest.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    PrismaModule, 
    AIModule, 
    forwardRef(() => QuestModule),
    EventsModule
  ],
  providers: [StrategyService],
  controllers: [StrategyController],
  exports: [StrategyService],
})
export class StrategyModule {}

