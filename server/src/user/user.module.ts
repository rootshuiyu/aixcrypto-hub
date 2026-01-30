import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma.module';
import { EventsModule } from '../events/events.module';
import { QuestModule } from '../quest/quest.module';

@Module({
  imports: [PrismaModule, EventsModule, QuestModule],
  controllers: [UserController],
  providers: [],
  exports: [],
})
export class UserModule {}
