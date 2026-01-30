import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { PositionSide, TradeType, PositionStatus } from '@prisma/client';
import { QuestService } from '../quest/quest.service';
import { getComboStateByResult } from '../common/combo.utils';
import Decimal from 'decimal.js';

// AMM 配置
interface AMMConfig {
  INITIAL_LIQUIDITY: number;    // 初始流动性
  FEE_RATE: number;             // 手续费率
  MIN_TRADE_AMOUNT: number;     // 最小交易金额
  MAX_TRADE_AMOUNT: number;     // 最大单笔交易
  MIN_RESERVE_RATIO: number;    // 最小储备比例（防止枯竭）
}

const DEFAULT_CONFIG: AMMConfig = {
  INITIAL_LIQUIDITY: 10000,     // 初始 10000 虚拟流动性
  FEE_RATE: 0.02,               // 2% 手续费
  MIN_TRADE_AMOUNT: 1,          // 最小 1 PTS
  MAX_TRADE_AMOUNT: 5000,       // 最大 5000 PTS 单笔
  MIN_RESERVE_RATIO: 0.01,      // 储备不能低于初始的 1%
};

@Injectable()
export class AMMService {
  private readonly logger = new Logger(AMMService.name);
  private config: AMMConfig = DEFAULT_CONFIG;

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private questService: QuestService,
  ) {}

  /**
   * 为回合创建流动性池
   */
  async createPool(roundId: string, initialLiquidity?: number): Promise<any> {
    const liquidity = initialLiquidity || this.config.INITIAL_LIQUIDITY;
    
    // 初始 50/50 流动性
    const yesReserve = liquidity;
    const noReserve = liquidity;
    const kConstant = yesReserve * noReserve;

    const pool = await this.prisma.liquidityPool.create({
      data: {
        roundId,
        yesReserve,
        noReserve,
        kConstant,
        initialLiquidity: liquidity,
        yesPrice: 0.5,
        noPrice: 0.5,
      }
    });

    this.logger.log(`Created AMM pool for round ${roundId} with ${liquidity} initial liquidity`);
    return pool;
  }

  /**
   * 获取流动性池
   */
  async getPool(roundId: string) {
    return this.prisma.liquidityPool.findUnique({
      where: { roundId }
    });
  }

  /**
   * 获取当前价格
   */
  async getPrices(roundId: string): Promise<{ yesPrice: number; noPrice: number }> {
    const pool = await this.getPool(roundId);
    if (!pool) {
      return { yesPrice: 0.5, noPrice: 0.5 };
    }

    const total = pool.yesReserve + pool.noReserve;
    return {
      yesPrice: parseFloat((pool.noReserve / total).toFixed(6)),
      noPrice: parseFloat((pool.yesReserve / total).toFixed(6)),
    };
  }

  /**
   * 计算买入报价（不执行交易）
   */
  async quoteBuy(
    roundId: string,
    side: PositionSide,
    amountIn: number
  ): Promise<{
    sharesOut: number;
    avgPrice: number;
    priceImpact: number;
    fee: number;
    newYesPrice: number;
    newNoPrice: number;
  }> {
    const pool = await this.getPool(roundId);
    if (!pool) {
      throw new BadRequestException('Pool not found');
    }

    // 计算手续费
    const fee = new Decimal(amountIn).mul(this.config.FEE_RATE);
    const amountAfterFee = new Decimal(amountIn).minus(fee);

    // 当前价格
    const currentTotal = new Decimal(pool.yesReserve).add(pool.noReserve);
    const currentYesPrice = new Decimal(pool.noReserve).div(currentTotal);
    const currentNoPrice = new Decimal(pool.yesReserve).div(currentTotal);

    let sharesOut: Decimal;
    let newYesReserve: Decimal;
    let newNoReserve: Decimal;

    if (side === PositionSide.YES) {
      // 买入 YES：PTS 转换为 NO 储备增加，YES 储备减少
      newNoReserve = new Decimal(pool.noReserve).add(amountAfterFee);
      newYesReserve = new Decimal(pool.kConstant).div(newNoReserve);
      sharesOut = new Decimal(pool.yesReserve).minus(newYesReserve);
    } else {
      // 买入 NO：PTS 转换为 YES 储备增加，NO 储备减少
      newYesReserve = new Decimal(pool.yesReserve).add(amountAfterFee);
      newNoReserve = new Decimal(pool.kConstant).div(newYesReserve);
      sharesOut = new Decimal(pool.noReserve).minus(newNoReserve);
    }

    // 新价格
    const newTotal = newYesReserve.add(newNoReserve);
    const newYesPrice = newNoReserve.div(newTotal);
    const newNoPrice = newYesReserve.div(newTotal);

    // 价格影响
    const entryPrice = side === PositionSide.YES ? currentYesPrice : currentNoPrice;
    const exitPrice = side === PositionSide.YES ? newYesPrice : newNoPrice;
    const priceImpact = exitPrice.minus(entryPrice).div(entryPrice).mul(100);

    // 平均买入价
    const avgPrice = new Decimal(amountIn).div(sharesOut);

    return {
      sharesOut: parseFloat(sharesOut.toFixed(4)),
      avgPrice: parseFloat(avgPrice.toFixed(6)),
      priceImpact: parseFloat(priceImpact.toFixed(4)),
      fee: parseFloat(fee.toFixed(4)),
      newYesPrice: parseFloat(newYesPrice.toFixed(6)),
      newNoPrice: parseFloat(newNoPrice.toFixed(6)),
    };
  }

  /**
   * 计算卖出报价（不执行交易）
   */
  async quoteSell(
    roundId: string,
    side: PositionSide,
    sharesIn: number
  ): Promise<{
    amountOut: number;
    avgPrice: number;
    priceImpact: number;
    fee: number;
    newYesPrice: number;
    newNoPrice: number;
  }> {
    const pool = await this.getPool(roundId);
    if (!pool) {
      throw new BadRequestException('Pool not found');
    }

    let amountBeforeFee: Decimal;
    let newYesReserve: Decimal;
    let newNoReserve: Decimal;

    // 当前价格
    const currentTotal = new Decimal(pool.yesReserve).add(pool.noReserve);
    const currentYesPrice = new Decimal(pool.noReserve).div(currentTotal);
    const currentNoPrice = new Decimal(pool.yesReserve).div(currentTotal);

    if (side === PositionSide.YES) {
      // 卖出 YES：YES 份额返还储备，NO 储备减少
      newYesReserve = new Decimal(pool.yesReserve).add(sharesIn);
      newNoReserve = new Decimal(pool.kConstant).div(newYesReserve);
      amountBeforeFee = new Decimal(pool.noReserve).minus(newNoReserve);
    } else {
      // 卖出 NO：NO 份额返还储备，YES 储备减少
      newNoReserve = new Decimal(pool.noReserve).add(sharesIn);
      newYesReserve = new Decimal(pool.kConstant).div(newNoReserve);
      amountBeforeFee = new Decimal(pool.yesReserve).minus(newYesReserve);
    }

    // 检查储备是否足够
    const minReserve = new Decimal(pool.initialLiquidity).mul(this.config.MIN_RESERVE_RATIO);
    if (newYesReserve.lessThan(minReserve) || newNoReserve.lessThan(minReserve)) {
      throw new BadRequestException('Insufficient liquidity');
    }

    // 计算手续费和实际获得
    const fee = amountBeforeFee.mul(this.config.FEE_RATE);
    const amountOut = amountBeforeFee.minus(fee);

    // 新价格
    const newTotal = newYesReserve.add(newNoReserve);
    const newYesPrice = newNoReserve.div(newTotal);
    const newNoPrice = newYesReserve.div(newTotal);

    // 价格影响
    const entryPrice = side === PositionSide.YES ? currentYesPrice : currentNoPrice;
    const exitPrice = side === PositionSide.YES ? newYesPrice : newNoPrice;
    const priceImpact = entryPrice.minus(exitPrice).div(entryPrice).mul(100);

    // 平均卖出价
    const avgPrice = amountOut.div(sharesIn);

    return {
      amountOut: parseFloat(amountOut.toFixed(4)),
      avgPrice: parseFloat(avgPrice.toFixed(6)),
      priceImpact: parseFloat(priceImpact.toFixed(4)),
      fee: parseFloat(fee.toFixed(4)),
      newYesPrice: parseFloat(newYesPrice.toFixed(6)),
      newNoPrice: parseFloat(newNoPrice.toFixed(6)),
    };
  }

  /**
   * 执行买入交易
   */
  async executeBuy(
    roundId: string,
    userId: string,
    side: PositionSide,
    amountIn: number
  ): Promise<{
    success: boolean;
    shares: number;
    avgPrice: number;
    fee: number;
    position: any;
  }> {
    // 验证
    if (amountIn < this.config.MIN_TRADE_AMOUNT) {
      throw new BadRequestException(`Minimum trade amount is ${this.config.MIN_TRADE_AMOUNT} PTS`);
    }
    if (amountIn > this.config.MAX_TRADE_AMOUNT) {
      throw new BadRequestException(`Maximum trade amount is ${this.config.MAX_TRADE_AMOUNT} PTS`);
    }

    // 获取报价
    const quote = await this.quoteBuy(roundId, side, amountIn);

    // 事务执行
    const result = await this.prisma.$transaction(async (tx) => {
      // 检查用户余额
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.pts < amountIn) {
        throw new BadRequestException('Insufficient balance');
      }

      // 获取池子
      const pool = await tx.liquidityPool.findUnique({ where: { roundId } });
      if (!pool) {
        throw new BadRequestException('Pool not found');
      }

      // 计算新储备
      const fee = new Decimal(amountIn).mul(this.config.FEE_RATE);
      const amountAfterFee = new Decimal(amountIn).minus(fee);

      let newYesReserve: number;
      let newNoReserve: number;

      if (side === PositionSide.YES) {
        newNoReserve = new Decimal(pool.noReserve).add(amountAfterFee).toNumber();
        newYesReserve = new Decimal(pool.kConstant).div(newNoReserve).toNumber();
      } else {
        newYesReserve = new Decimal(pool.yesReserve).add(amountAfterFee).toNumber();
        newNoReserve = new Decimal(pool.kConstant).div(newYesReserve).toNumber();
      }

      // 更新池子
      const newTotal = newYesReserve + newNoReserve;
      await tx.liquidityPool.update({
        where: { roundId },
        data: {
          yesReserve: newYesReserve,
          noReserve: newNoReserve,
          yesPrice: newNoReserve / newTotal,
          noPrice: newYesReserve / newTotal,
          totalVolume: { increment: amountIn },
          totalFees: { increment: parseFloat(fee.toFixed(4)) },
          tradeCount: { increment: 1 },
        }
      });

      // 扣除用户余额
      await tx.user.update({
        where: { id: userId, version: user.version },
        data: {
          pts: { decrement: amountIn },
          version: { increment: 1 }
        }
      });

      // 更新或创建持仓
      const existingPosition = await tx.position.findUnique({
        where: {
          userId_roundId_side: { userId, roundId, side }
        }
      });

      let position;
      if (existingPosition && existingPosition.status === PositionStatus.OPEN) {
        // 加仓：更新平均成本
        const newTotalCost = existingPosition.totalCost + amountIn;
        const newShares = existingPosition.shares + quote.sharesOut;
        const newAvgCost = newTotalCost / newShares;

        position = await tx.position.update({
          where: { id: existingPosition.id },
          data: {
            shares: newShares,
            avgCost: newAvgCost,
            totalCost: newTotalCost,
          }
        });
      } else {
        // 新建持仓
        position = await tx.position.create({
          data: {
            userId,
            roundId,
            side,
            shares: quote.sharesOut,
            avgCost: quote.avgPrice,
            totalCost: amountIn,
            status: PositionStatus.OPEN,
          }
        });
      }

      // 记录交易
      await tx.aMMTrade.create({
        data: {
          poolId: pool.id,
          roundId,
          userId,
          tradeType: TradeType.BUY,
          side,
          shares: quote.sharesOut,
          amount: amountIn,
          price: quote.avgPrice,
          fee: quote.fee,
          yesPriceAfter: quote.newYesPrice,
          noPriceAfter: quote.newNoPrice,
          yesReserveAfter: newYesReserve,
          noReserveAfter: newNoReserve,
        }
      });

      return { position, newBalance: user.pts - amountIn };
    });

    // 广播价格更新
    this.broadcastPriceUpdate(roundId);
    
    // 推送余额更新
    this.eventsGateway.emitBalanceUpdate(userId, result.newBalance);

    // 🔧 触发任务进度：预测 (买入即算一次预测)
    await this.questService.updateProgress(userId, 'PREDICTION');

    return {
      success: true,
      shares: quote.sharesOut,
      avgPrice: quote.avgPrice,
      fee: quote.fee,
      position: result.position,
    };
  }

  /**
   * 执行卖出交易
   */
  async executeSell(
    roundId: string,
    userId: string,
    side: PositionSide,
    sharesToSell: number
  ): Promise<{
    success: boolean;
    amountOut: number;
    avgPrice: number;
    fee: number;
    realizedPnL: number;
    position: any;
  }> {
    // 检查持仓
    const position = await this.prisma.position.findUnique({
      where: {
        userId_roundId_side: { userId, roundId, side }
      }
    });

    if (!position || position.status !== PositionStatus.OPEN) {
      throw new BadRequestException('No open position found');
    }

    const availableShares = position.shares - position.closedShares;
    if (sharesToSell > availableShares) {
      throw new BadRequestException(`Only ${availableShares} shares available to sell`);
    }

    // 获取报价
    const quote = await this.quoteSell(roundId, side, sharesToSell);

    // 事务执行
    const result = await this.prisma.$transaction(async (tx) => {
      // 获取池子
      const pool = await tx.liquidityPool.findUnique({ where: { roundId } });
      if (!pool) {
        throw new BadRequestException('Pool not found');
      }

      // 计算新储备
      let newYesReserve: number;
      let newNoReserve: number;

      if (side === PositionSide.YES) {
        newYesReserve = new Decimal(pool.yesReserve).add(sharesToSell).toNumber();
        newNoReserve = new Decimal(pool.kConstant).div(newYesReserve).toNumber();
      } else {
        newNoReserve = new Decimal(pool.noReserve).add(sharesToSell).toNumber();
        newYesReserve = new Decimal(pool.kConstant).div(newNoReserve).toNumber();
      }

      // 更新池子
      const newTotal = newYesReserve + newNoReserve;
      await tx.liquidityPool.update({
        where: { roundId },
        data: {
          yesReserve: newYesReserve,
          noReserve: newNoReserve,
          yesPrice: newNoReserve / newTotal,
          noPrice: newYesReserve / newTotal,
          totalVolume: { increment: quote.amountOut },
          totalFees: { increment: quote.fee },
          tradeCount: { increment: 1 },
        }
      });

      // 计算已实现盈亏
      const costBasis = position.avgCost * sharesToSell;
      const realizedPnL = quote.amountOut - costBasis;

      // 更新持仓
      const newClosedShares = position.closedShares + sharesToSell;
      const isFullyClosed = newClosedShares >= position.shares;

      const updatedPosition = await tx.position.update({
        where: { id: position.id },
        data: {
          closedShares: newClosedShares,
          status: isFullyClosed ? PositionStatus.CLOSED : PositionStatus.OPEN,
          closedAt: isFullyClosed ? new Date() : undefined,
          exitPrice: quote.avgPrice,
          realizedPnL: (position.realizedPnL || 0) + realizedPnL,
        }
      });

      // 增加用户余额
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      await tx.user.update({
        where: { id: userId, version: user.version },
        data: {
          pts: { increment: quote.amountOut },
          version: { increment: 1 }
        }
      });

      // 记录交易
      await tx.aMMTrade.create({
        data: {
          poolId: pool.id,
          roundId,
          userId,
          tradeType: TradeType.SELL,
          side,
          shares: sharesToSell,
          amount: quote.amountOut,
          price: quote.avgPrice,
          fee: quote.fee,
          yesPriceAfter: quote.newYesPrice,
          noPriceAfter: quote.newNoPrice,
          yesReserveAfter: newYesReserve,
          noReserveAfter: newNoReserve,
        }
      });

      return { 
        position: updatedPosition, 
        newBalance: user.pts + quote.amountOut,
        realizedPnL 
      };
    });

    // 广播价格更新
    this.broadcastPriceUpdate(roundId);
    
    // 推送余额更新
    this.eventsGateway.emitBalanceUpdate(userId, result.newBalance);

    return {
      success: true,
      amountOut: quote.amountOut,
      avgPrice: quote.avgPrice,
      fee: quote.fee,
      realizedPnL: result.realizedPnL,
      position: result.position,
    };
  }

  /**
   * 获取用户持仓
   */
  async getUserPositions(userId: string, roundId?: string) {
    const where: any = { userId };
    if (roundId) {
      where.roundId = roundId;
    }

    const positions = await this.prisma.position.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // 计算未实现盈亏
    const positionsWithPnL = await Promise.all(
      positions.map(async (pos) => {
        if (pos.status !== PositionStatus.OPEN) {
          return pos;
        }

        const prices = await this.getPrices(pos.roundId);
        const currentPrice = pos.side === PositionSide.YES ? prices.yesPrice : prices.noPrice;
        const availableShares = pos.shares - pos.closedShares;
        const currentValue = availableShares * currentPrice;
        const costBasis = availableShares * pos.avgCost;
        const unrealizedPnL = currentValue - costBasis;
        const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

        return {
          ...pos,
          currentPrice,
          currentValue,
          availableShares,
          unrealizedPnL,
          unrealizedPnLPercent,
        };
      })
    );

    return positionsWithPnL;
  }

  /**
   * 回合结算时处理所有持仓
   */
  async settlePositions(roundId: string, outcome: 'YES' | 'NO' | 'DRAW') {
    const positions = await this.prisma.position.findMany({
      where: { roundId, status: PositionStatus.OPEN }
    });

    this.logger.log(`Settling ${positions.length} positions for round ${roundId}, outcome: ${outcome}`);

    // 加载最新的连击配置
    const comboConfigRecord = await this.prisma.systemConfig.findUnique({
      where: { key: 'combo_config' }
    });
    const comboConfig = comboConfigRecord ? JSON.parse(comboConfigRecord.value) : undefined;

    for (const position of positions) {
      await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: position.userId } });
        if (!user) return;

        const availableShares = position.shares - position.closedShares;
        
        // 判定结果类型
        let resultType: 'WIN' | 'LOSE' | 'DRAW';
        if (outcome === 'DRAW') {
          resultType = 'DRAW';
        } else {
          resultType = (position.side === outcome) ? 'WIN' : 'LOSE';
        }

        // 计算基础派彩
        let payout = (resultType === 'WIN') ? availableShares : 0;

        // 应用连击逻辑
        const comboState = getComboStateByResult(
          resultType,
          user.combo,
          user.maxCombo,
          user.multiplier,
          comboConfig
        );

        // 如果赢了，应用 *当前* 的倍率（即该次预测享受到的加成）
        if (resultType === 'WIN') {
          payout = Math.floor(payout * user.multiplier);
        }

        // 计算盈亏
        const costBasis = availableShares * position.avgCost;
        const settlementPnL = payout - costBasis;

        // 更新持仓状态
        await tx.position.update({
          where: { id: position.id },
          data: {
            status: PositionStatus.SETTLED,
            settledAt: new Date(),
            settlementPayout: payout,
            realizedPnL: (position.realizedPnL || 0) + settlementPnL,
          }
        });

        // 更新用户信息
        await tx.user.update({
          where: { id: position.userId, version: user.version },
          data: {
            pts: { increment: payout },
            combo: comboState.newCombo,
            maxCombo: comboState.newMaxCombo,
            multiplier: comboState.newMultiplier,
            version: { increment: 1 }
          }
        });
        
        this.eventsGateway.emitBalanceUpdate(position.userId, user.pts + payout);
        
        // 🆕 发送结算通知以触发章鱼动画
        this.eventsGateway.server.to(position.userId).emit('betSettled', {
          betId: position.id,
          result: resultType,
          payout,
          exitPrice: payout / availableShares,
          exitReason: 'ROUND_SETTLEMENT',
          profitPercent: ((payout - costBasis) / costBasis * 100).toFixed(2),
        });

        // 📣 同步用户资料（包括最新的连击和倍率）到前端和管理后台
        this.eventsGateway.emitUserProfileUpdate(position.userId, {
          combo: comboState.newCombo,
          multiplier: comboState.newMultiplier,
          pts: user.pts + payout
        });

        this.logger.debug(
          `Settled position ${position.id}: user=${user.username}, result=${resultType}, payout=${payout}, newCombo=${comboState.newCombo}, newMult=${comboState.newMultiplier}`
        );
      });
    }
  }

  /**
   * 获取交易历史（用于 K 线）
   */
  async getTrades(roundId: string, limit: number = 100) {
    return this.prisma.aMMTrade.findMany({
      where: { roundId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * 获取 K 线数据
   */
  async getPriceCandles(
    roundId: string,
    interval: '1s' | '5s' | '1m' = '5s',
    limit: number = 100
  ) {
    return this.prisma.priceCandle.findMany({
      where: { roundId, interval },
      orderBy: { startTime: 'desc' },
      take: limit,
    });
  }

  /**
   * 广播价格更新
   */
  private async broadcastPriceUpdate(roundId: string) {
    try {
      const pool = await this.getPool(roundId);
      if (!pool) return;

      const prices = await this.getPrices(roundId);

      if (this.eventsGateway?.server) {
        this.eventsGateway.server.emit('ammPriceUpdate', {
          roundId,
          yesPrice: prices.yesPrice,
          noPrice: prices.noPrice,
          yesReserve: pool.yesReserve,
          noReserve: pool.noReserve,
          totalVolume: pool.totalVolume,
          timestamp: new Date(),
        });
      }
    } catch (e) {
      this.logger.error(`Failed to broadcast AMM price update: ${e.message}`);
    }
  }

  /**
   * 聚合 K 线数据（定时任务调用）
   */
  async aggregateCandles(roundId: string, interval: '1s' | '5s' | '1m') {
    const intervalMs = interval === '1s' ? 1000 : interval === '5s' ? 5000 : 60000;
    const now = new Date();
    const startTime = new Date(Math.floor(now.getTime() / intervalMs) * intervalMs - intervalMs);
    const endTime = new Date(startTime.getTime() + intervalMs);

    // 获取该时间段的交易
    const trades = await this.prisma.aMMTrade.findMany({
      where: {
        roundId,
        createdAt: { gte: startTime, lt: endTime }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (trades.length === 0) return;

    // 聚合 OHLCV
    const yesPrices = trades.map(t => t.yesPriceAfter);
    const candle = {
      roundId,
      interval,
      startTime,
      endTime,
      open: yesPrices[0],
      high: Math.max(...yesPrices),
      low: Math.min(...yesPrices),
      close: yesPrices[yesPrices.length - 1],
      volume: trades.reduce((sum, t) => sum + t.amount, 0),
      tradeCount: trades.length,
    };

    await this.prisma.priceCandle.upsert({
      where: {
        roundId_interval_startTime: { roundId, interval, startTime }
      },
      update: candle,
      create: candle,
    });
  }

  /**
   * 获取配置
   */
  getConfig() {
    return this.config;
  }
}
