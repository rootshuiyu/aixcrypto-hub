import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MarketOutcome } from '@prisma/client';

/**
 * 回测服务
 * 基于历史数据模拟 AI 预测，计算历史回测胜率
 */
@Injectable()
export class BacktestService {
  private readonly logger = new Logger(BacktestService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 计算市场的历史回测胜率
   */
  async calculateBacktestWinRate(
    category: string,
    timeframe: string,
    lookbackPeriods: number = 100
  ) {
    // 获取历史已结算市场
    const historicalMarkets = await this.prisma.market.findMany({
      where: {
        category,
        timeframe,
        status: 'RESOLVED',
        outcome: { not: null },
      },
      orderBy: { resolutionTime: 'desc' },
      take: lookbackPeriods,
      include: {
        snapshots: {
          where: { snapshotType: { in: ['START', 'END'] } },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (historicalMarkets.length === 0) {
      return {
        winRate: 0,
        totalPredictions: 0,
        wins: 0,
        losses: 0,
        timeframeBreakdown: {},
      };
    }

    // 模拟 AI 预测逻辑（基于技术指标）
    let totalPredictions = 0;
    let correctPredictions = 0;
    const timeframeStats: Record<string, { total: number; correct: number }> = {};

    for (const market of historicalMarkets) {
      if (!market.outcome) continue;

      // 获取市场开始时的价格数据
      const startSnapshot = market.snapshots.find(s => s.snapshotType === 'START');
      const endSnapshot = market.snapshots.find(s => s.snapshotType === 'END');

      if (!startSnapshot || !endSnapshot) continue;

      // 模拟 AI 预测（基于价格趋势）
      const startPrice = Number(startSnapshot.indexValue);
      const endPrice = Number(endSnapshot.indexValue);
      const actualOutcome = market.outcome;

      // 简单的预测逻辑：基于历史趋势
      // 实际应该使用技术指标（RSI, MACD等）
      const predictedOutcome = await this.simulateAIPrediction(
        category,
        startPrice,
        market.timeframe
      );

      totalPredictions++;
      if (predictedOutcome === actualOutcome) {
        correctPredictions++;
      }

      // 按时间段统计
      if (!timeframeStats[market.timeframe]) {
        timeframeStats[market.timeframe] = { total: 0, correct: 0 };
      }
      timeframeStats[market.timeframe].total++;
      if (predictedOutcome === actualOutcome) {
        timeframeStats[market.timeframe].correct++;
      }
    }

    const winRate = totalPredictions > 0 
      ? (correctPredictions / totalPredictions) * 100 
      : 0;

    // 计算各时间段胜率
    const timeframeBreakdown: Record<string, number> = {};
    for (const [tf, stats] of Object.entries(timeframeStats)) {
      timeframeBreakdown[tf] = stats.total > 0 
        ? (stats.correct / stats.total) * 100 
        : 0;
    }

    return {
      winRate: parseFloat(winRate.toFixed(2)),
      totalPredictions,
      wins: correctPredictions,
      losses: totalPredictions - correctPredictions,
      timeframeBreakdown,
    };
  }

  /**
   * 模拟 AI 预测（基于技术指标）
   */
  private async simulateAIPrediction(
    category: string,
    startPrice: number,
    timeframe: string
  ): Promise<MarketOutcome> {
    // 获取历史价格数据
    const history = await this.prisma.marketIndex.findMany({
      where: { type: category },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    if (history.length < 20) {
      // 数据不足，随机预测
      return Math.random() > 0.5 ? MarketOutcome.YES : MarketOutcome.NO;
    }

    const prices = history.map(h => Number(h.value)).reverse();
    const latestPrice = prices[prices.length - 1];

    // 简单趋势判断
    const shortMA = this.calculateMA(prices.slice(-5)); // 5期均线
    const longMA = this.calculateMA(prices.slice(-20)); // 20期均线

    // 如果短期均线 > 长期均线，预测上涨
    if (shortMA > longMA) {
      return MarketOutcome.YES;
    } else if (shortMA < longMA) {
      return MarketOutcome.NO;
    } else {
      // 均线交叉，随机预测
      return Math.random() > 0.5 ? MarketOutcome.YES : MarketOutcome.NO;
    }
  }

  /**
   * 计算移动平均
   */
  private calculateMA(prices: number[]): number {
    if (prices.length === 0) return 0;
    return prices.reduce((sum, p) => sum + p, 0) / prices.length;
  }

  /**
   * 获取指定市场的回测统计
   */
  async getMarketBacktestStats(marketId: string) {
    const market = await this.prisma.market.findUnique({ where: { id: marketId } });
    if (!market) throw new NotFoundException('Market not found');

    return this.calculateBacktestWinRate(market.category, market.timeframe);
  }
}

