import { Module } from '@nestjs/common';
import { SeasonController } from './season.controller';
import { SeasonService } from './season.service';
import { TournamentService } from './tournament.service';
import { SpectateService } from './spectate.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [SeasonController],
  providers: [SeasonService, TournamentService, SpectateService],
  exports: [SeasonService, TournamentService, SpectateService],
})
export class SeasonModule {}










