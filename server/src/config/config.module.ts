import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [ConfigController],
  providers: [],
  exports: [],
})
export class AppConfigModule {}
