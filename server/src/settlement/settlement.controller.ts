import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { MarketOutcome } from '@prisma/client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('settlement')
@Controller('settlement')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Post('smart-bet')
  @ApiOperation({ summary: '创建智能持仓 (带止损止盈)' })
  createSmartBet(
    @Body() body: {
      userId: string;
      marketId: string;
      position: 'YES' | 'NO';
      amount: number;
      strategyId?: string;
      stopLoss?: number;
      takeProfit?: number;
      holdDuration?: string;
    }
  ) {
    return this.settlementService.createSmartBet({
      ...body,
      position: body.position as MarketOutcome,
    });
  }

  @Post('close/:betId')
  @ApiOperation({ summary: '手动平仓' })
  closePosition(
    @Param('betId') betId: string,
    @Body() body: { userId: string }
  ) {
    return this.settlementService.closePosition(body.userId, betId);
  }

  @Get('active/:userId')
  @ApiOperation({ summary: '获取用户活跃持仓 (含实时盈亏)' })
  getActivePositions(@Param('userId') userId: string) {
    return this.settlementService.getActivePositions(userId);
  }

  @Get('history/:userId')
  @ApiOperation({ summary: '获取用户历史持仓' })
  getPositionHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: number
  ) {
    return this.settlementService.getPositionHistory(userId, limit || 20);
  }

  @Get('stats/:userId')
  @ApiOperation({ summary: '获取用户结算统计' })
  getSettlementStats(@Param('userId') userId: string) {
    return this.settlementService.getSettlementStats(userId);
  }
}

