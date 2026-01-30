import { Controller, Get, Query } from '@nestjs/common';
import { RoundService } from './round.service';

@Controller('round')
export class RoundController {
  constructor(private readonly roundService: RoundService) {}

  /**
   * 获取当前回合信息
   */
  @Get('current')
  async getCurrentRound(@Query('category') category: string = 'C10') {
    const round = await this.roundService.getCurrentRound(category);
    if (!round) {
      return { success: false, error: 'No active round' };
    }
    return { success: true, round };
  }

  /**
   * 获取回合历史（用于 K 线图）
   */
  @Get('history')
  async getRoundHistory(
    @Query('category') category: string = 'C10',
    @Query('limit') limit: string = '50'
  ) {
    const rounds = await this.roundService.getRoundHistory(category, parseInt(limit) || 50);
    return { success: true, rounds };
  }

  /**
   * 获取回合配置
   */
  @Get('config')
  async getConfig() {
    const config = this.roundService.getConfig();
    return { success: true, config };
  }

  /**
   * 获取实时交易流水 (包含 AMM 交易和普通下注)
   */
  @Get('live-feed')
  async getLiveFeed(
    @Query('category') category: string = 'C10',
    @Query('limit') limit: string = '20'
  ) {
    const feed = await this.roundService.getLiveFeed(category, parseInt(limit) || 20);
    return { success: true, feed };
  }

  /**
   * 获取全平台未结算的活跃订单 (實時交易)
   */
  @Get('active-orders')
  async getGlobalActiveOrders(@Query('limit') limit: string = '50') {
    const orders = await this.roundService.getGlobalActiveOrders(parseInt(limit) || 50);
    return { success: true, orders };
  }

  /**
   * 获取全平台已结算的历史订单 (歷史記錄)
   */
  @Get('settled-orders')
  async getGlobalSettledOrders(@Query('limit') limit: string = '50') {
    const orders = await this.roundService.getGlobalSettledOrders(parseInt(limit) || 50);
    return { success: true, orders };
  }
}
