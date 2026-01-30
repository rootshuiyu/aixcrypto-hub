import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { QuestService } from '../quest/quest.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService, QuestService],
  exports: [AuthService, JwtService],
})
export class AuthModule {}
