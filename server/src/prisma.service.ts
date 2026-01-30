import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // 终极方案：在构造函数中显式提供数据库地址，彻底无视环境变量丢失问题
    super({
      datasources: {
        db: {
          url: 'postgresql://postgres:123456@localhost:5432/aixl_db?schema=public',
        },
      },
    });
  }

  async onModuleInit() {
    this.logger.log(`Prisma connecting to database (Direct Link)...`);
    try {
      await this.$connect();
      this.logger.log('Prisma connected successfully.');
    } catch (e) {
      this.logger.error('Prisma connection failed!', e);
    }
  }
  
  private readonly logger = new Logger(PrismaService.name);

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

