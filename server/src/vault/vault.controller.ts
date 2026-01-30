import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { VaultService } from './vault.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('vault')
@Controller('vault')
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Get('info')
  @ApiOperation({ summary: '获取合约信息' })
  getContractInfo() {
    return this.vaultService.getContractInfo();
  }

  @Get('balance/:address')
  @ApiOperation({ summary: '获取用户链上余额' })
  getOnChainBalance(
    @Param('address') address: string,
    @Query('token') token?: string,
  ) {
    return this.vaultService.getOnChainBalance(address, token);
  }

  @Post('prepare-deposit')
  @ApiOperation({ summary: '生成充值交易数据' })
  prepareDeposit(@Body() body: { userAddress: string; amount: string }) {
    return this.vaultService.prepareDepositTx(body.userAddress, body.amount);
  }

  @Post('prepare-withdraw')
  @ApiOperation({ summary: '生成提现交易数据' })
  prepareWithdraw(@Body() body: { userAddress: string; amount: string }) {
    return this.vaultService.prepareWithdrawTx(body.userAddress, body.amount);
  }

  @Post('record-deposit')
  @ApiOperation({ summary: '记录充值交易' })
  recordDeposit(@Body() body: { userId: string; txHash: string; amount: string; token?: string }) {
    return this.vaultService.createDepositRecord(body.userId, body.txHash, body.amount, body.token);
  }

  @Post('record-withdraw')
  @ApiOperation({ summary: '记录提现交易' })
  recordWithdraw(@Body() body: { userId: string; txHash: string; amount: string; token?: string }) {
    return this.vaultService.createWithdrawRecord(body.userId, body.txHash, body.amount, body.token);
  }

  @Get('confirm/:txHash')
  @ApiOperation({ summary: '确认交易状态' })
  confirmTransaction(@Param('txHash') txHash: string) {
    return this.vaultService.confirmTransaction(txHash);
  }

  @Get('history/:userId')
  @ApiOperation({ summary: '获取交易历史' })
  getTransactionHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.vaultService.getTransactionHistory(userId, parsedLimit);
  }
}






