import { Module } from '@nestjs/common';
import { LicenseModule } from './license/license.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [
    PrismaModule,
    LicenseModule,
    AdminModule,
  ],
})
export class AppModule {}
