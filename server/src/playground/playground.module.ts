import { Module } from '@nestjs/common';
import { PlaygroundController } from './playground.controller';
import { PlaygroundService } from './playground.service';
import { PrismaService } from '../prisma.service';
import { QuestModule } from '../quest/quest.module';

@Module({
  imports: [QuestModule],
  controllers: [PlaygroundController],
  providers: [PlaygroundService],
})
export class PlaygroundModule {}

