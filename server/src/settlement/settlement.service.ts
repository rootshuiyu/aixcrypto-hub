import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { BetStatus, BetResult, MarketOutcome } from '@prisma/client';
import { AIService } from '../ai/ai.service';
import { getComboStateByResult, calculateComboMultiplier } from '../common/combo.utils';

export interface SettlementResult {
  betId: string;
  result: BetResult;
  payout: number;
  exitPrice: number;
  exitReason: string;
  profitPercent: number;
  emotionalQuote?: string;
}

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private aiService: AIService,
  ) {}

  /**
   * 每 10 秒检查一次持仓状态
   */
  @Cron('*/10 * * * * *')
  async checkPositions() {
    try {
      await this.checkStopLossAndTakeProfit();
      await this.checkExpiredPositions();
    } catch (error) {
      // 数据库表可能还没有新字段，静默处理
      if (!error.message?.includes('does not exist')) {
        this.logger.error(`Position check error: ${error.message}`);
      }
    }
  }

  /**
   * 检查止损/止盈触发
   */
  async checkStopLossAndTakeProfit() {
    // 获取所有活跃持仓
    const activeBets = await this.prisma.bet.findMany({
      where: {
        status: BetStatus.ACTIVE,
        entryPrice: { not: null },
      },
      include: { market: true },
    });

    if (activeBets.length === 0) return;

    for (const bet of activeBets) {
      try {
        // 获取当前价格
        const currentIndex = await this.prisma.marketIndex.findFirst({
          where: { type: bet.market.category },
          orderBy: { timestamp: 'desc' },
        });

        if (!currentIndex || !bet.entryPrice) continue;

        const currentPrice = currentIndex.value;
        const entryPrice = bet.entryPrice;
        const priceChange = ((currentPrice - entryPrice) / entryPrice) * 100;

        // 根据持仓方向计算实际收益率
        const isLong = bet.position === MarketOutcome.YES;
        const profitPercent = isLong ? priceChange : -priceChange;

        // --- A2: 爆仓风险提醒 (Margin Call Warning) ---
        // 当亏损达到止损线 80% 时发送告警
        if (bet.stopLoss && profitPercent <= -(bet.stopLoss * 0.8) && profitPercent > -bet.stopLoss) {
          this.eventsGateway.server.to(bet.userId).emit('notification', {
            type: 'WARNING',
            message: `[CRITICAL_MARGIN_CALL]: ${bet.market.category} position is approaching Stop-Loss (-${Math.abs(profitPercent).toFixed(2)}%). Risk of liquidation high.`
          });
        }

        // 检查止盈
        if (bet.takeProfit && profitPercent >= bet.takeProfit) {
          await this.settleBet(bet.id, currentPrice, 'TAKE_PROFIT', profitPercent);
          this.logger.log(`[TAKE_PROFIT] Bet ${bet.id}: +${profitPercent.toFixed(2)}%`);
          continue;
        }

        // 检查止损
        if (bet.stopLoss && profitPercent <= -bet.stopLoss) {
          await this.settleBet(bet.id, currentPrice, 'STOP_LOSS', profitPercent);
          this.logger.log(`[STOP_LOSS] Bet ${bet.id}: ${profitPercent.toFixed(2)}%`);
          continue;
        }
      } catch (error) {
        this.logger.error(`Error checking bet ${bet.id}: ${error.message}`);
      }
    }
  }

  /**
   * 检查到期的持仓
   */
  async checkExpiredPositions() {
    const now = new Date();

    const expiredBets = await this.prisma.bet.findMany({
      where: {
        status: BetStatus.ACTIVE,
        expiresAt: { lte: now },
      },
      include: { market: true },
    });

    for (const bet of expiredBets) {
      try {
        // 获取当前价格
        const currentIndex = await this.prisma.marketIndex.findFirst({
          where: { type: bet.market.category },
          orderBy: { timestamp: 'desc' },
        });

        if (!currentIndex || !bet.entryPrice) continue;

        const currentPrice = currentIndex.value;
        const entryPrice = bet.entryPrice;
        const priceChange = ((currentPrice - entryPrice) / entryPrice) * 100;

        const isLong = bet.position === MarketOutcome.YES;
        const profitPercent = isLong ? priceChange : -priceChange;

        await this.settleBet(bet.id, currentPrice, 'EXPIRED', profitPercent);
        this.logger.log(`[EXPIRED] Bet ${bet.id}: ${profitPercent.toFixed(2)}%`);
      } catch (error) {
        this.logger.error(`Error settling expired bet ${bet.id}: ${error.message}`);
      }
    }
  }

  /**
   * 结算单个持仓
   */
  async settleBet(
    betId: string,
    exitPrice: number,
    exitReason: string,
    profitPercent: number,
  ): Promise<SettlementResult> {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: { user: true },
    });

    if (!bet || bet.status !== BetStatus.ACTIVE) {
      throw new Error('Bet not found or already settled');
    }

    // 计算派彩
    let payout = 0;
    let result: BetResult;

    if (exitReason === 'TAKE_PROFIT') {
      // 触发止盈：获得本金 + 止盈收益
      const profitMultiplier = bet.takeProfit ? bet.takeProfit / 100 : 0.3;
      payout = bet.amount * (1 + profitMultiplier);
      result = BetResult.WIN;
    } else if (exitReason === 'STOP_LOSS') {
      // 触发止损：保留部分本金
      const lossMultiplier = bet.stopLoss ? bet.stopLoss / 100 : 0.2;
      payout = bet.amount * (1 - lossMultiplier);
      result = BetResult.LOSE;
    } else if (exitReason === 'EXPIRED') {
      // 到期结算：根据实际涨跌幅
      if (profitPercent > 0) {
        // 盈利：本金 + 收益（最高限制在 100%）
        const cappedProfit = Math.min(profitPercent, 100);
        payout = bet.amount * (1 + cappedProfit / 100);
        result = BetResult.WIN;
      } else if (profitPercent < -50) {
        // 大幅亏损：全部损失
        payout = 0;
        result = BetResult.LOSE;
      } else if (profitPercent < 0) {
        // 小幅亏损：损失部分本金
        payout = bet.amount * (1 + profitPercent / 100);
        result = BetResult.LOSE;
      } else {
        // 保本
        payout = bet.amount;
        result = BetResult.BREAKEVEN;
      }
    } else {
      // 手动平仓
      if (profitPercent > 0) {
        payout = bet.amount * (1 + profitPercent / 100);
        result = BetResult.WIN;
      } else {
        payout = Math.max(0, bet.amount * (1 + profitPercent / 100));
        result = profitPercent < 0 ? BetResult.LOSE : BetResult.BREAKEVEN;
      }
    }

    // 确保派彩不为负
    payout = Math.max(0, Math.floor(payout));

    // 加载最新的连击配置
    const comboConfigRecord = await this.prisma.systemConfig.findUnique({
      where: { key: 'combo_config' }
    });
    const comboConfig = comboConfigRecord ? JSON.parse(comboConfigRecord.value) : undefined;

    // 更新数据库
    await this.prisma.$transaction(async (tx) => {
      // 获取用户以计算连击
      const user = await tx.user.findUnique({ where: { id: bet.userId } });
      if (!user) return;

      // 使用统一的连击计算工具
      const resultType = result === BetResult.WIN ? 'WIN' : 
                         result === BetResult.LOSE ? 'LOSE' : 'BREAKEVEN';
      const comboState = getComboStateByResult(
        resultType,
        user.combo,
        user.maxCombo,
        user.multiplier,
        comboConfig
      );

      // 只有赢了才应用当前的倍率
      if (result === BetResult.WIN) {
        payout = Math.floor(payout * user.multiplier);
      }

      // 更新持仓状态
      await tx.bet.update({
        where: { id: betId },
        data: {
          status: BetStatus.SETTLED,
          result,
          exitPrice,
          exitReason,
          payout,
          settledAt: new Date(),
        },
      });

      // 更新用户信息 (PTS, Combo, Multiplier) - 增加乐观锁版本控制
      const updatedUser = await tx.user.update({
        where: { id: bet.userId, version: user.version },
        data: {
          pts: { increment: payout },
          combo: comboState.newCombo,
          maxCombo: comboState.newMaxCombo,
          multiplier: comboState.newMultiplier,
          version: { increment: 1 }
        },
      });

      // 更新团队积分
      if (updatedUser.teamId) {
        await tx.team.update({
          where: { id: updatedUser.teamId },
          data: { totalPts: { increment: payout } },
        });
      }

      // WebSocket 通知余额变化
      this.eventsGateway.emitBalanceUpdate(bet.userId, updatedUser.pts);
    });

    // 发送结算通知
    let emotionalQuote = '';
    try {
      emotionalQuote = await this.aiService.generateSettlementCommentary(
        result,
        profitPercent.toFixed(2),
        exitReason,
        'en' // Default to en, can be enhanced to user preferred lang
      );
    } catch (e) {
      this.logger.error(`Failed to generate settlement commentary: ${e.message}`);
    }

    this.eventsGateway.server.to(bet.userId).emit('betSettled', {
      betId,
      result,
      payout,
      exitPrice,
      exitReason,
      profitPercent: profitPercent.toFixed(2),
      emotionalQuote,
    });

    return {
      betId,
      result,
      payout,
      exitPrice,
      exitReason,
      profitPercent,
      emotionalQuote,
    };
  }

  /**
   * 创建智能持仓
   */
  async createSmartBet(data: {
    userId: string;
    marketId: string;
    position: MarketOutcome;
    amount: number;
    strategyId?: string;
    stopLoss?: number;
    takeProfit?: number;
    holdDuration?: string;
  }) {
    // 获取市场信息
    const market = await this.prisma.market.findUnique({ where: { id: data.marketId } });
    if (!market) throw new Error('Market not found');

    // 获取当前入场价格
    const currentIndex = await this.prisma.marketIndex.findFirst({
      where: { type: market.category },
      orderBy: { timestamp: 'desc' },
    });
    if (!currentIndex) throw new Error('No price data available');

    // 计算到期时间
    const holdDuration = data.holdDuration || '1H';
    const durationMinutes: Record<string, number> = {
      '10M': 10,
      '30M': 30,
      '1H': 60,
      '12H': 720,
      '24H': 1440,
    };
    const minutes = durationMinutes[holdDuration] || 60;
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

    // 创建持仓（使用事务和乐观锁）
    const result = await this.prisma.$transaction(async (tx) => {
      // 获取用户最新信息（用于乐观锁）
      const user = await tx.user.findUnique({ where: { id: data.userId } });
      if (!user) throw new Error('User not found');
      if (user.pts < data.amount) throw new Error('Insufficient balance');

      // 扣除积分（带乐观锁）
      const updatedUser = await tx.user.update({
        where: { id: data.userId, version: user.version },
        data: { 
          pts: { decrement: data.amount },
          version: { increment: 1 }
        },
      });

      // 更新团队积分
      if (user.teamId) {
        await tx.team.update({
          where: { id: user.teamId },
          data: { totalPts: { decrement: data.amount } },
        });
      }

      // 创建持仓记录
      const newBet = await tx.bet.create({
        data: {
          userId: data.userId,
          marketId: data.marketId,
          position: data.position,
          amount: data.amount,
          entryPrice: currentIndex.value,
          strategyId: data.strategyId,
          stopLoss: data.stopLoss,
          takeProfit: data.takeProfit,
          holdDuration,
          expiresAt,
          status: BetStatus.ACTIVE,
        },
      });

      // 更新市场池
      await tx.market.update({
        where: { id: data.marketId },
        data: { poolSize: { increment: data.amount } },
      });

      return { bet: newBet, newBalance: updatedUser.pts };
    });

    // 通知余额变化
    this.eventsGateway.emitBalanceUpdate(data.userId, result.newBalance);

    this.logger.log(
      `[NEW BET] User ${data.userId}: ${data.position} ${data.amount} PTS @ ${currentIndex.value.toFixed(2)} | ` +
      `SL: ${data.stopLoss || 'N/A'}% | TP: ${data.takeProfit || 'N/A'}% | Expires: ${holdDuration}`
    );

    return {
      success: true,
      bet: result.bet,
      entryPrice: currentIndex.value,
      expiresAt,
      message: `Position opened: ${data.position} at ${currentIndex.value.toFixed(2)}`,
    };
  }

  /**
   * 手动平仓
   */
  async closePosition(userId: string, betId: string) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: { market: true },
    });

    if (!bet || bet.userId !== userId) {
      throw new Error('Position not found');
    }
    if (bet.status !== BetStatus.ACTIVE) {
      throw new Error('Position already closed');
    }

    // 获取当前价格
    const currentIndex = await this.prisma.marketIndex.findFirst({
      where: { type: bet.market.category },
      orderBy: { timestamp: 'desc' },
    });

    if (!currentIndex || !bet.entryPrice) {
      throw new Error('Cannot determine exit price');
    }

    const priceChange = ((currentIndex.value - bet.entryPrice) / bet.entryPrice) * 100;
    const isLong = bet.position === MarketOutcome.YES;
    const profitPercent = isLong ? priceChange : -priceChange;

    return this.settleBet(betId, currentIndex.value, 'MANUAL', profitPercent);
  }

  /**
   * 获取用户活跃持仓
   */
  async getActivePositions(userId: string) {
    const positions = await this.prisma.bet.findMany({
      where: {
        userId,
        status: BetStatus.ACTIVE,
      },
      include: { market: true },
      orderBy: { timestamp: 'desc' },
    });

    // 计算每个持仓的当前盈亏
    const results = await Promise.all(
      positions.map(async (bet) => {
        const currentIndex = await this.prisma.marketIndex.findFirst({
          where: { type: bet.market.category },
          orderBy: { timestamp: 'desc' },
        });

        if (!currentIndex || !bet.entryPrice) {
          return { ...bet, currentPrice: 0, unrealizedPnL: 0, pnlPercent: 0 };
        }

        const currentPrice = currentIndex.value;
        const priceChange = ((currentPrice - bet.entryPrice) / bet.entryPrice) * 100;
        const isLong = bet.position === MarketOutcome.YES;
        const pnlPercent = isLong ? priceChange : -priceChange;
        const unrealizedPnL = bet.amount * (pnlPercent / 100);

        return {
          ...bet,
          currentPrice,
          unrealizedPnL: unrealizedPnL.toFixed(2),
          pnlPercent: pnlPercent.toFixed(2),
        };
      })
    );

    return results;
  }

  /**
   * 获取用户历史持仓
   */
  async getPositionHistory(userId: string, limit: number = 20) {
    return this.prisma.bet.findMany({
      where: {
        userId,
        status: BetStatus.SETTLED,
      },
      include: { market: true },
      orderBy: { settledAt: 'desc' },
      take: limit,
    });
  }

  /**
   * 获取结算统计
   */
  async getSettlementStats(userId: string) {
    const settled = await this.prisma.bet.findMany({
      where: {
        userId,
        status: BetStatus.SETTLED,
      },
    });

    const totalBets = settled.length;
    const wins = settled.filter(b => b.result === BetResult.WIN).length;
    const losses = settled.filter(b => b.result === BetResult.LOSE).length;
    const totalWagered = settled.reduce((sum, b) => sum + b.amount, 0);
    const totalPayout = settled.reduce((sum, b) => sum + (b.payout || 0), 0);
    const netProfit = totalPayout - totalWagered;

    return {
      totalBets,
      wins,
      losses,
      winRate: totalBets > 0 ? ((wins / totalBets) * 100).toFixed(1) : '0',
      totalWagered,
      totalPayout,
      netProfit,
      roi: totalWagered > 0 ? ((netProfit / totalWagered) * 100).toFixed(1) : '0',
    };
  }
}
