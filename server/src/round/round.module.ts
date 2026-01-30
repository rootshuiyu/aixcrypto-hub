import { Module, forwardRef } from '@nestjs/common';
import { RoundService } from './round.service';
import { RoundController } from './round.controller';
import { PrismaModule } from '../prisma.module';
import { EventsModule } from '../events/events.module';
import { AuthModule } from '../auth/auth.module';
import { MarketModule } from '../market/market.module';
import { AMMModule } from '../amm/amm.module';

@Module({
  imports: [
    PrismaModule, 
    EventsModule, 
    AuthModule,
    forwardRef(() => MarketModule),
    forwardRef(() => AMMModule),
  ],
  controllers: [RoundController],
  providers: [RoundService],
  exports: [RoundService],
})
export class RoundModule {}

