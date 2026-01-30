import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ContractController],
  providers: [ContractService, PrismaService],
  exports: [ContractService],
})
export class ContractModule {}

