import { Module, forwardRef } from '@nestjs/common';
import { AMMService } from './amm.service';
import { AMMController } from './amm.controller';
import { PrismaModule } from '../prisma.module';
import { EventsModule } from '../events/events.module';
import { QuestModule } from '../quest/quest.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => EventsModule),
    QuestModule,
  ],
  controllers: [AMMController],
  providers: [AMMService],
  exports: [AMMService],
})
export class AMMModule {}
