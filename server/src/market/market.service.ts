import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { MarketStatus, MarketOutcome } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { QuestService } from '../quest/quest.service';
import { EventsGateway } from '../events/events.gateway';
import { IndexService } from './index.service';
import { RSI, MACD, BollingerBands } from 'technicalindicators';
import { getWinComboState, getLoseComboState } from '../common/combo.utils';

@Injectable()
export class MarketService implements OnModuleInit {
  private readonly logger = new Logger(MarketService.name);
  
  // 平台手续费率 (5%)
  private readonly PLATFORM_FEE_RATE = 0.05;
  
  private readonly categories = ['C10', 'GOLD'];
  private readonly timeframes = [
    { label: '10M', minutes: 10 },
    { label: '30M', minutes: 30 },
    { label: '1H', minutes: 60 },
    { label: '12H', minutes: 720 },
    { label: '24H', minutes: 1440 }
  ];

  constructor(
    private prisma: PrismaService,
    private questService: QuestService,
    private eventsGateway: EventsGateway,
    @Inject(forwardRef(() => IndexService))
    private indexService: IndexService,
  ) {}

  async onModuleInit() {
    this.logger.log('MarketService: Initializing automated markets...');
    await this.checkAndCreateMarkets();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMarketMaintenance() {
    await this.checkAndCreateMarkets();
    await this.handleSettlement();
  }

  async checkAndCreateMarkets() {
    for (const category of this.categories) {
      for (const tf of this.timeframes) {
        const activeMarket = await this.prisma.market.findFirst({
          where: { category, timeframe: tf.label, status: MarketStatus.ACTIVE }
        });

        if (!activeMarket) {
          const now = new Date();
          const endTime = new Date(now.getTime() + tf.minutes * 60 * 1000);
          // 锁定时间：结束前10秒（强制成交感）
          const lockTime = new Date(endTime.getTime() - 10 * 1000);
          
          // 获取当前指数值作为 T0 快照
          const currentIndex = await this.prisma.marketIndex.findFirst({
            where: { type: category },
            orderBy: { timestamp: 'desc' }
          });
          const startPrice = currentIndex?.value || 0;
          
          // 获取当前成分币价格
          const indexService = this.prisma as any; // 临时访问，后续优化
          const components = await this.getCurrentComponents(category);
          
          const market = await this.prisma.market.create({
            data: {
              title: `${category} Index [${tf.label} Round]`,
              category,
              timeframe: tf.label,
              status: MarketStatus.ACTIVE,
              endTime: endTime,
              lockTime: lockTime,
              resolutionTime: new Date(endTime.getTime() + 60 * 1000),
              poolSize: 0,
              startPrice: startPrice,
              aiPrediction: `Generating signals for ${category} ${tf.label}...`
            }
          });

          // 记录 T0 快照
          await this.createSnapshot(market.id, 'START', startPrice, components);
        }
      }
    }
  }

  /**
   * 获取当前成分币价格（用于快照）
   * 从 IndexService 的缓存中获取真实价格数据
   */
  private async getCurrentComponentsForSnapshot(category: string): Promise<Record<string, number>> {
    try {
      if (category === 'GOLD') {
        // 黄金市场使用专门的黄金组件
        const goldComponents = this.indexService.getGoldComponents();
        if (goldComponents && goldComponents.length > 0) {
          return goldComponents.reduce((acc: Record<string, number>, comp: any) => {
            acc[comp.symbol] = comp.price;
            return acc;
          }, {});
        }
        // 如果没有缓存数据，从数据库获取最新黄金价格
        const goldIndex = await this.prisma.marketIndex.findFirst({
          where: { type: 'GOLD' },
          orderBy: { timestamp: 'desc' }
        });
        return { 'XAU': goldIndex?.value || 0 };
      }

      // C10 加密货币指数
      const components = this.indexService.getComponents();
      if (components && components.length > 0) {
        return components.reduce((acc: Record<string, number>, comp: any) => {
          acc[comp.symbol] = comp.price;
          return acc;
        }, {});
      }

      // 如果 IndexService 缓存为空，从数据库获取权重配置并返回空价格（等待首次更新）
      this.logger.warn(`[SNAPSHOT] No component cache available for ${category}, returning empty prices`);
      const weights = await this.prisma.indexWeight.findMany({
        where: { category, isActive: true }
      });
      return weights.reduce((acc: Record<string, number>, w) => {
        acc[w.symbol] = 0;
        return acc;
      }, {});
    } catch (error) {
      this.logger.error(`[SNAPSHOT] Failed to get components for ${category}: ${error.message}`);
      return {};
    }
  }

  /**
   * 获取当前成分币价格（创建市场时使用）
   * 直接复用快照获取方法
   */
  private async getCurrentComponents(category: string): Promise<Record<string, number>> {
    return this.getCurrentComponentsForSnapshot(category);
  }

  /**
   * 获取当前指数值（用于市场创建和结算）
   */
  private async getCurrentIndexValue(category: string): Promise<number> {
    const index = await this.prisma.marketIndex.findFirst({
      where: { type: category },
      orderBy: { timestamp: 'desc' }
    });
    return index?.value || 0;
  }

  /**
   * 创建市场快照
   */
  async createSnapshot(
    marketId: string,
    snapshotType: 'START' | 'END' | 'SETTLEMENT',
    indexValue: number,
    components: Record<string, number>,
    formulaParams?: Record<string, any>
  ) {
    return this.prisma.marketSnapshot.create({
      data: {
        marketId,
        snapshotType,
        indexValue,
        components: components as any,
        formulaParams: formulaParams as any,
      }
    });
  }

  async findAll() {
    const markets = await this.prisma.market.findMany({
      where: { status: MarketStatus.ACTIVE },
      orderBy: { createdAt: 'desc' }
    });

    // 为每个市场添加赔率信息
    return Promise.all(markets.map(async (market) => {
      const odds = await this.getMarketOdds(market.id);
      return {
        ...market,
        ...odds,
      };
    }));
  }

  /**
   * 获取公开统计数据（用于首页展示）
   */
  async getPublicStats() {
    // 1. 活跃预测者数量
    const activeUsers = await this.prisma.user.count({
      where: {
        bets: { some: {} }
      }
    });

    // 2. 总 TVL（所有活跃市场的资金池总和）
    const activeMarkets = await this.prisma.market.findMany({
      where: { status: MarketStatus.ACTIVE }
    });
    const totalTVL = activeMarkets.reduce((sum, m) => sum + (m.poolSize || 0), 0);

    // 3. AI Signal 覆盖的市场数量
    const totalMarkets = await this.prisma.market.count({
      where: { status: MarketStatus.ACTIVE }
    });

    // 4. 用户胜率中位数（简化计算：取有下注记录用户的平均胜率）
    const usersWithBets = await this.prisma.user.findMany({
      where: { bets: { some: {} } },
      include: {
        bets: {
          include: { market: true }
        }
      },
      take: 100 // 限制计算量
    });

    let totalWinRate = 0;
    let validUserCount = 0;

    for (const user of usersWithBets) {
      const resolvedBets = user.bets.filter(b => b.market.status === MarketStatus.RESOLVED);
      if (resolvedBets.length > 0) {
        const wins = resolvedBets.filter(b => b.position === b.market.outcome).length;
        totalWinRate += (wins / resolvedBets.length) * 100;
        validUserCount++;
      }
    }

    const medianWinRate = validUserCount > 0 ? totalWinRate / validUserCount : 50;

    // 5. 24小时交易量
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const volume24h = await this.prisma.bet.aggregate({
      where: { timestamp: { gte: oneDayAgo } },
      _sum: { amount: true }
    });

    // 6. 总下注次数
    const totalBets = await this.prisma.bet.count();

    return {
      activeUsers,
      totalTVL,
      totalMarkets,
      medianWinRate: parseFloat(medianWinRate.toFixed(1)),
      volume24h: volume24h._sum.amount || 0,
      totalBets,
    };
  }

  async findResolved(category: string, timeframe: string, limit: number = 10) {
    return this.prisma.market.findMany({
      where: { 
        category, 
        timeframe, 
        status: MarketStatus.RESOLVED 
      },
      orderBy: { resolutionTime: 'desc' },
      take: limit
    });
  }

  async findRecentBets(marketId: string, limit: number = 10) {
    return this.prisma.bet.findMany({
      where: { marketId },
      include: { user: { select: { username: true, address: true } } },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  async findOne(id: string) {
    const market = await this.prisma.market.findUnique({ where: { id } });
    if (!market) throw new NotFoundException('Market not found');
    
    // 添加赔率信息
    const odds = await this.getMarketOdds(id);
    
    // 计算锁定状态和倒计时
    const now = new Date();
    const isLocked = market.lockTime ? now >= market.lockTime : false;
    const timeToLock = market.lockTime 
      ? Math.max(0, Math.floor((market.lockTime.getTime() - now.getTime()) / 1000))
      : null;
    const timeToEnd = Math.max(0, Math.floor((market.endTime.getTime() - now.getTime()) / 1000));
    
    return {
      ...market,
      ...odds,
      isLocked,
      timeToLock,
      timeToEnd,
      canBet: market.status === MarketStatus.ACTIVE && !isLocked,
    };
  }

  /**
   * 获取市场快照和复盘数据
   */
  async getMarketSnapshots(marketId: string) {
    const market = await this.prisma.market.findUnique({ where: { id: marketId } });
    if (!market) throw new NotFoundException('Market not found');

    const snapshots = await this.prisma.marketSnapshot.findMany({
      where: { marketId },
      orderBy: { timestamp: 'asc' }
    });

    const startSnapshot = snapshots.find(s => s.snapshotType === 'START');
    const endSnapshot = snapshots.find(s => s.snapshotType === 'END');

    // 计算变化
    let priceChange = 0;
    let priceChangePercent = 0;
    if (startSnapshot && endSnapshot) {
      const start = Number(startSnapshot.indexValue);
      const end = Number(endSnapshot.indexValue);
      priceChange = end - start;
      priceChangePercent = start > 0 ? (priceChange / start) * 100 : 0;
    }

    return {
      marketId,
      startSnapshot: startSnapshot ? {
        timestamp: startSnapshot.timestamp,
        indexValue: Number(startSnapshot.indexValue),
        components: startSnapshot.components as Record<string, number>,
        formulaParams: startSnapshot.formulaParams as Record<string, any>,
      } : null,
      endSnapshot: endSnapshot ? {
        timestamp: endSnapshot.timestamp,
        indexValue: Number(endSnapshot.indexValue),
        components: endSnapshot.components as Record<string, number>,
        formulaParams: endSnapshot.formulaParams as Record<string, any>,
      } : null,
      priceChange,
      priceChangePercent: parseFloat(priceChangePercent.toFixed(6)),
      outcome: market.outcome,
    };
  }

  /**
   * 获取市场赔率和资金池信息
   */
  async getMarketOdds(marketId: string) {
    const market = await this.prisma.market.findUnique({ where: { id: marketId } });
    if (!market) throw new NotFoundException('Market not found');

    // 优先使用数据库中的 yesPool/noPool（如果已更新）
    let yesPool = market.yesPool || 0;
    let noPool = market.noPool || 0;

    // 如果数据库字段为0，从下注记录计算（兼容旧数据）
    if (yesPool === 0 && noPool === 0) {
      const bets = await this.prisma.bet.findMany({ where: { marketId } });
      yesPool = bets.filter(b => b.position === MarketOutcome.YES).reduce((s, b) => s + b.amount, 0);
      noPool = bets.filter(b => b.position === MarketOutcome.NO).reduce((s, b) => s + b.amount, 0);
    }

    const totalPool = yesPool + noPool;

    // 计算概率和赔率
    const yesProbability = totalPool > 0 ? yesPool / totalPool : 0.5;
    const noProbability = totalPool > 0 ? noPool / totalPool : 0.5;

    // 赔率计算：总池 / 该方向池（考虑平台手续费）
    // 实际赔率 = (总池 * (1 - 手续费率)) / 该方向池
    const effectivePool = totalPool * (1 - this.PLATFORM_FEE_RATE);
    const yesOdds = yesPool > 0 ? effectivePool / yesPool : 1.0;
    const noOdds = noPool > 0 ? effectivePool / noPool : 1.0;

    return {
      marketId,
      yesPool,
      noPool,
      totalPool,
      yesProbability,
      noProbability,
      yesOdds: parseFloat(yesOdds.toFixed(2)),
      noOdds: parseFloat(noOdds.toFixed(2)),
      platformFeeRate: this.PLATFORM_FEE_RATE,
    };
  }

  async placeBet(marketId: string, userId: string, position: MarketOutcome, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      const market = await tx.market.findUnique({ where: { id: marketId } });
      const user = await tx.user.findUnique({ where: { id: userId } });

      if (!market || market.status !== MarketStatus.ACTIVE) throw new BadRequestException('Invalid market');
      if (!user || user.pts < amount) throw new BadRequestException('Insufficient balance');

      // 检查锁定状态（最后10秒禁止下注）
      const now = new Date();
      if (market.lockTime && now >= market.lockTime) {
        const secondsLeft = Math.max(0, Math.floor((market.endTime.getTime() - now.getTime()) / 1000));
        throw new BadRequestException(`Market is locked. Betting closed ${secondsLeft} seconds before end.`);
      }

      // 计算下注时的锁定赔率（关键：Web3 预测市场核心逻辑）
      // 赔率 = (当前总池 + 本次下注) * (1 - 手续费率) / (对应方向池 + 本次下注)
      const currentYesPool = market.yesPool || 0;
      const currentNoPool = market.noPool || 0;
      const newTotalPool = currentYesPool + currentNoPool + amount;
      const effectivePool = newTotalPool * (1 - this.PLATFORM_FEE_RATE);
      
      let lockedOdds: number;
      if (position === MarketOutcome.YES) {
        const newYesPool = currentYesPool + amount;
        lockedOdds = newYesPool > 0 ? effectivePool / newYesPool : 1.0;
      } else {
        const newNoPool = currentNoPool + amount;
        lockedOdds = newNoPool > 0 ? effectivePool / newNoPool : 1.0;
      }
      
      // 确保赔率至少为 1.0（不亏本金）
      lockedOdds = Math.max(1.0, lockedOdds);
      const potentialPayout = amount * lockedOdds;

      await tx.user.update({
        where: { id: userId, version: user.version },
        data: { 
          pts: { decrement: amount },
          version: { increment: 1 }
        }
      });

      if (user.teamId) {
        await tx.team.update({
          where: { id: user.teamId },
          data: { totalPts: { decrement: amount } }
        });
      }

      const bet = await tx.bet.create({
        data: { 
          userId, 
          marketId, 
          position, 
          amount,
          lockedOdds: parseFloat(lockedOdds.toFixed(4)),
          potentialPayout: parseFloat(potentialPayout.toFixed(2)),
        }
      });

      // 根据下注方向更新对应的资金池
      const updateData: any = { 
        poolSize: { increment: amount }
      };
      
      if (position === MarketOutcome.YES) {
        updateData.yesPool = { increment: amount };
      } else {
        updateData.noPool = { increment: amount };
      }

      await tx.market.update({
        where: { id: marketId },
        data: updateData
      });

      await this.questService.updateProgress(userId, 'PREDICTION');
      this.eventsGateway.emitBalanceUpdate(userId, user.pts - amount);
      
      // 发送包含锁定赔率的下注成功通知
      this.eventsGateway.emitBetSuccess(userId, {
        ...bet,
        lockedOdds: parseFloat(lockedOdds.toFixed(4)),
        potentialPayout: parseFloat(potentialPayout.toFixed(2)),
      });

      // 广播赔率更新（让其他用户看到实时赔率变化）
      this.broadcastOddsUpdate(marketId);

      return { 
        success: true,
        betId: bet.id,
        lockedOdds: parseFloat(lockedOdds.toFixed(4)),
        potentialPayout: parseFloat(potentialPayout.toFixed(2)),
      };
    });
  }

  /**
   * 广播市场赔率更新（WebSocket）
   */
  private async broadcastOddsUpdate(marketId: string) {
    try {
      const odds = await this.getMarketOdds(marketId);
      if (this.eventsGateway?.server) {
        this.eventsGateway.server.emit('marketOddsUpdate', {
          marketId,
          ...odds,
          timestamp: new Date(),
        });
      }
    } catch (e) {
      this.logger.error(`Failed to broadcast odds update: ${e.message}`);
    }
  }

  async handleSettlement() {
    const now = new Date();
    const resolvableMarkets = await this.prisma.market.findMany({
      where: { status: MarketStatus.ACTIVE, resolutionTime: { lte: now } }
    });

    for (const market of resolvableMarkets) {
      await this.resolveMarket(market.id);
    }
  }

  async resolveMarket(marketId: string) {
    const market = await this.prisma.market.findUnique({ where: { id: marketId } });
    if (!market) return;

    // 延迟2-3秒等待预言机最后一帧数据
    await new Promise(resolve => setTimeout(resolve, 2500));

    // 获取最终价格（使用预言机数据，更可信）
    const finalIndices = await this.prisma.marketIndex.findMany({
      where: { type: market.category },
      orderBy: { timestamp: 'desc' },
      take: 2
    });

    if (finalIndices.length < 2) {
      this.logger.warn(`[SETTLEMENT] Market ${marketId}: Insufficient price data`);
      return;
    }

    // 获取开始价格（T0快照或第一个数据点）
    const startPrice = market.startPrice 
      ? Number(market.startPrice) 
      : (finalIndices.length >= 2 ? finalIndices[1].value : 0);
    
    // 获取结束价格（T1最终价格）
    const endPrice = Number(finalIndices[0].value);

    // 获取当前成分币价格（用于快照）
    const currentComponents = await this.getCurrentComponentsForSnapshot(market.category);

    // 记录 T1 快照
    await this.createSnapshot(marketId, 'END', endPrice, currentComponents);

    // 计算价格变化（使用6位小数精度）
    const priceChange = startPrice > 0 
      ? (endPrice - startPrice) / startPrice 
      : 0;
    
    // 严格判定：差值小于 0.000001 (百万分之一) 判定为 DRAW
    const DRAW_THRESHOLD = 0.000001;
    let outcome: MarketOutcome;
    
    if (Math.abs(priceChange) < DRAW_THRESHOLD) {
      outcome = MarketOutcome.YES; // 平局时默认 YES（可根据需求调整）
      this.logger.log(`[DRAW] Market ${marketId} resolved as DRAW. Change: ${(priceChange*1000000).toFixed(2)} ppm`);
    } else {
      outcome = priceChange > 0 ? MarketOutcome.YES : MarketOutcome.NO;
      this.logger.log(`[SETTLEMENT] Market ${marketId}: ${outcome}. Change: ${(priceChange*100).toFixed(6)}%`);
    }
    
    await this.prisma.$transaction(async (tx) => {
      // 更新市场状态和最终价格
      await tx.market.update({
        where: { id: marketId },
        data: { 
          status: MarketStatus.RESOLVED, 
          outcome,
          endPrice: endPrice,
        }
      });

      const bets = await tx.bet.findMany({ where: { marketId } });
      const winners = bets.filter(b => b.position === outcome);
      const losers = bets.filter(b => b.position !== outcome);

      const winPool = winners.reduce((s, b) => s + b.amount, 0);
      const losePool = losers.reduce((s, b) => s + b.amount, 0);
      const totalPool = winPool + losePool;

      // 计算平台手续费和奖池
      const platformFee = totalPool * this.PLATFORM_FEE_RATE;
      const prizePool = totalPool - platformFee;

      if (winPool > 0) {
        for (const bet of winners) {
          const user = await tx.user.findUnique({ where: { id: bet.userId } });
          if (!user) continue;

          // 使用统一的连击计算工具
          const comboState = getWinComboState(user.combo, user.maxCombo);
          
          // 🆕 Web3 预测市场核心：使用锁定赔率计算派彩
          // 如果有锁定赔率，使用锁定赔率；否则回退到按比例分配
          let reward: number;
          let profit: number;
          
          if (bet.lockedOdds && bet.lockedOdds > 0) {
            // 使用下注时锁定的赔率（Web3 标准模式）
            // 派彩 = 下注金额 × 锁定赔率 × 连击倍率加成
            const baseReward = bet.amount * bet.lockedOdds;
            profit = baseReward - bet.amount;
            // 利润部分应用连击倍率
            reward = bet.amount + (profit * user.multiplier);
          } else {
            // 回退：按比例分配失败方资金（兼容旧数据）
            profit = (bet.amount / winPool) * (prizePool - winPool);
            reward = bet.amount + (profit * user.multiplier);
          }
          
          // 更新下注记录的最终派彩
          await tx.bet.update({
            where: { id: bet.id },
            data: { 
              payout: parseFloat(reward.toFixed(2)),
              result: 'WIN',
              status: 'SETTLED',
              settledAt: new Date()
            }
          });
          
          const updatedUser = await tx.user.update({
            where: { id: bet.userId, version: user.version },
            data: { 
              pts: { increment: reward },
              combo: comboState.newCombo,
              maxCombo: comboState.newMaxCombo,
              multiplier: comboState.newMultiplier,
              version: { increment: 1 }
            }
          });

          this.eventsGateway.emitBalanceUpdate(bet.userId, updatedUser.pts);
          this.eventsGateway.emitBetSuccess(bet.userId, { 
            ...bet, 
            status: 'WINNER', 
            reward: parseFloat(reward.toFixed(2)),
            profit: parseFloat(profit.toFixed(2)),
            lockedOdds: bet.lockedOdds,
            combo: comboState.newCombo,
            multiplier: comboState.newMultiplier
          });

          if (updatedUser.teamId) {
            await tx.team.update({
              where: { id: updatedUser.teamId },
              data: { totalPts: { increment: reward } }
            });
          }
        }
        
        // 更新失败者的下注记录
        for (const bet of losers) {
          await tx.bet.update({
            where: { id: bet.id },
            data: { 
              payout: 0,
              result: 'LOSE',
              status: 'SETTLED',
              settledAt: new Date()
            }
          });
        }
        
        // 记录平台手续费（可选：可以存储到系统账户）
        this.logger.log(`[SETTLEMENT] Market ${marketId}: Platform fee collected: ${platformFee.toFixed(2)} PTS`);
      } else {
        // 如果没有人下注获胜方，退还所有下注（扣除手续费）
        this.logger.warn(`[SETTLEMENT] Market ${marketId}: No winners, refunding all bets with fee deduction`);
        for (const bet of bets) {
          const user = await tx.user.findUnique({ where: { id: bet.userId } });
          if (!user) continue;
          
          const refund = bet.amount * (1 - this.PLATFORM_FEE_RATE);
          await tx.user.update({
            where: { id: bet.userId, version: user.version },
            data: { 
              pts: { increment: refund },
              version: { increment: 1 }
            }
          });
        }
      }

      // 处理失败者的连击重置（使用统一的连击计算工具）
      for (const bet of losers) {
        const user = await tx.user.findUnique({ where: { id: bet.userId } });
        if (!user) continue;

        const loseState = getLoseComboState();

        await tx.user.update({
          where: { id: bet.userId, version: user.version },
          data: { 
            combo: loseState.newCombo,
            multiplier: loseState.newMultiplier,
            version: { increment: 1 }
          }
        });
        this.eventsGateway.emitBetSuccess(bet.userId, { 
          ...bet, 
          status: 'LOSER', 
          combo: loseState.newCombo, 
          multiplier: loseState.newMultiplier 
        });
      }
    });
  }

  /**
   * AI 信号与解读引擎 (Signal Engine + LLM Prep)
   */
  async getAiAnalysis(marketId: string) {
    const market = await this.prisma.market.findUnique({ where: { id: marketId } });
    const indexType = market?.category || 'C10';
    
    // 获取 50 个点位以计算技术指标
    const recentIndex = await this.prisma.marketIndex.findMany({
      where: { type: indexType },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    if (recentIndex.length < 20) {
      return { marketId, analysis: "Gathering technical signals...", confidence: 0, timestamp: new Date() };
    }

    const prices = recentIndex.map(i => i.value).reverse();
    const latestPrice = prices[prices.length - 1];

    // 1. 计算量化指标 (Signal Engine)
    const rsiValues = RSI.calculate({ values: prices, period: 14 });
    const macdValues = MACD.calculate({ 
      values: prices, 
      fastPeriod: 12, 
      slowPeriod: 26, 
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    const bbValues = BollingerBands.calculate({ values: prices, period: 20, stdDev: 2 });

    const currentRSI = rsiValues[rsiValues.length - 1];
    const currentMACD = macdValues[macdValues.length - 1];
    const currentBB = bbValues[bbValues.length - 1];

    // 2. 结构化信号生成
    let signals = [];
    let bullishScore = 0;

    if (currentRSI < 30) { signals.push('RSI Oversold'); bullishScore += 30; }
    if (currentRSI > 70) { signals.push('RSI Overbought'); bullishScore -= 30; }
    if (currentMACD.histogram > 0) { signals.push('MACD Bullish Cross'); bullishScore += 20; }
    if (latestPrice < currentBB.lower) { signals.push('Price below BB Lower'); bullishScore += 25; }

    const recommendation = bullishScore > 10 ? 'YES' : bullishScore < -10 ? 'NO' : 'HOLD';
    const confidence = Math.min(Math.abs(bullishScore) / 100 + 0.5, 0.95);

    // 3. 返回结构化数据供前端/LLM 使用
    return {
      marketId,
      recommendation,
      confidence,
      signals,
      technicalData: {
        rsi: currentRSI.toFixed(2),
        macd: currentMACD.histogram.toFixed(4),
        bb: { upper: currentBB.upper.toFixed(2), lower: currentBB.lower.toFixed(2) }
      },
      analysis: `Detected ${signals.join(', ')}. RSI is at ${currentRSI.toFixed(2)}. ${recommendation === 'YES' ? 'Bullish' : 'Bearish'} momentum suspected.`,
      timestamp: new Date()
    };
  }
}
