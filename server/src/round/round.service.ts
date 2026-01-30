import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { RoundStatus, RoundResult } from '@prisma/client';
import Decimal from 'decimal.js';
import { MarketCalendarService } from '../market/market-calendar.service';
import { AMMService } from '../amm/amm.service';

// 回合配置
export interface RoundConfig {
  ROUND_DURATION: number;     // 回合总时长（秒）
  BETTING_WINDOW: number;     // 下注窗口时长（秒）
  LOCK_PERIOD: number;        // 锁定期（秒）
  MIN_BET: number;            // 最小下注额
  MAX_BET: number;            // 最大下注额
  PAYOUT_RATIO: number;       // 基础派彩倍率
  PLATFORM_FEE: number;       // 平台费率
  MIN_PRICE_CHANGE: number;   // 最小价格变动阈值（用于判定涨跌）
}

const DEFAULT_CONFIG: RoundConfig = {
  ROUND_DURATION: 10,       // 默认为 10 秒一回合
  BETTING_WINDOW: 7,        // 前 7 秒可下注
  LOCK_PERIOD: 3,           // 最后 3 秒锁定
  MIN_BET: 10,              // 最小 10 PTS
  MAX_BET: 1000,            // 最大 1000 PTS
  PAYOUT_RATIO: 1.95,       // 1.95 倍派彩
  PLATFORM_FEE: 0.05,       // 5% 平台费
  MIN_PRICE_CHANGE: 0.0001, // 0.01% 最小价格变动
};

// 黄金专用配置（更高精度，适应微小波动）
const GOLD_CONFIG: Partial<RoundConfig> = {
  MIN_PRICE_CHANGE: 0.000001, // 0.0001% - 黄金波动小，需要更高精度
};

@Injectable()
export class RoundService implements OnModuleInit {
  private readonly logger = new Logger(RoundService.name);
  private config: RoundConfig = DEFAULT_CONFIG;
  private goldConfig: RoundConfig = { ...DEFAULT_CONFIG, ...GOLD_CONFIG };
  private currentRounds: Map<string, { roundId: string; roundNumber: number }> = new Map();
  private roundTimers: Map<string, NodeJS.Timeout> = new Map();
  private goldMarketCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    @Inject(forwardRef(() => MarketCalendarService))
    private marketCalendarService: MarketCalendarService,
    @Inject(forwardRef(() => AMMService))
    private ammService: AMMService,
  ) {}

  async onModuleInit() {
    this.logger.log('RoundService initializing...');
    
    // 加载配置
    await this.loadConfig();
    
    // 初始化指数权重
    await this.initializeWeights();
    
    // 为每个类别启动回合
    for (const category of ['C10', 'GOLD']) {
      await this.initializeRound(category);
    }
    
    this.logger.log('RoundService initialized');
  }

  /**
   * 从数据库加载配置
   */
  private async loadConfig() {
    try {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key: 'round_config' }
      });
      
      if (config) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(config.value) };
        this.logger.log('Loaded round config from database');
      }
    } catch (e) {
      this.logger.warn('Using default round config');
    }
  }

  /**
   * 初始化指数权重（市值加权）
   */
  private async initializeWeights() {
    const existingWeights = await this.prisma.indexWeight.count();
    
    if (existingWeights === 0) {
      // 初始化 C10 权重配置
      const c10Weights = [
        { category: 'C10', symbol: 'BTC', weight: 0.40 },   // 40%
        { category: 'C10', symbol: 'ETH', weight: 0.25 },   // 25%
        { category: 'C10', symbol: 'SOL', weight: 0.08 },   // 8%
        { category: 'C10', symbol: 'BNB', weight: 0.07 },   // 7%
        { category: 'C10', symbol: 'LINK', weight: 0.05 },  // 5%
        { category: 'C10', symbol: 'ADA', weight: 0.04 },   // 4%
        { category: 'C10', symbol: 'AVAX', weight: 0.04 },  // 4%
        { category: 'C10', symbol: 'DOT', weight: 0.03 },   // 3%
        { category: 'C10', symbol: 'MATIC', weight: 0.02 }, // 2%
        { category: 'C10', symbol: 'UNI', weight: 0.02 },   // 2%
      ];

      await this.prisma.indexWeight.createMany({
        data: c10Weights.map(w => ({ ...w, isActive: true })),
      });
      
      this.logger.log('Initialized C10 index weights');
    }
  }

  /**
   * 初始化回合
   */
  private async initializeRound(category: string) {
    // 🆕 黄金市场休市检查
    if (category === 'GOLD') {
      const marketStatus = this.marketCalendarService.checkMarketOpen('GOLD');
      if (!marketStatus.isOpen) {
        this.logger.warn(`[GOLD_MARKET_CLOSED] ${marketStatus.message}`);
        
        // 广播市场休市状态
        if (this.eventsGateway?.server) {
          this.eventsGateway.server.emit('marketClosed', {
            market: 'GOLD',
            message: marketStatus.message,
          });
        }
        
        // 启动定时检查，等待市场开放
        this.scheduleGoldMarketCheck();
        return;
      }
    }

    // 检查是否有进行中的回合
    const activeRound = await this.prisma.round.findFirst({
      where: { 
        category,
        status: { in: [RoundStatus.BETTING, RoundStatus.LOCKED] }
      },
      orderBy: { roundNumber: 'desc' }
    });

    if (activeRound) {
      const now = Date.now();
      const endTime = new Date(activeRound.endTime).getTime();
      
      if (now >= endTime) {
        // 回合已过期，立即结算并创建新回合
        this.logger.log(`Round #${activeRound.roundNumber} for ${category} has expired, settling...`);
        await this.settleRound(activeRound.id);
      } else {
        // 恢复现有回合
        this.currentRounds.set(category, {
          roundId: activeRound.id,
          roundNumber: activeRound.roundNumber
        });
        this.scheduleRoundTransitions(activeRound);
        this.logger.log(`Resumed round #${activeRound.roundNumber} for ${category}`);
      }
    } else {
      // 创建新回合
      await this.createNewRound(category);
    }
  }

  /**
   * 定时检查黄金市场是否开放（每 5 分钟检查一次）
   */
  private scheduleGoldMarketCheck() {
    // 清除之前的定时器
    if (this.goldMarketCheckInterval) {
      clearInterval(this.goldMarketCheckInterval);
    }

    this.goldMarketCheckInterval = setInterval(async () => {
      const status = this.marketCalendarService.checkMarketOpen('GOLD');
      
      if (status.isOpen) {
        this.logger.log('[GOLD_MARKET_OPENED] Gold market is now open, initializing rounds...');
        
        // 清除定时器
        if (this.goldMarketCheckInterval) {
          clearInterval(this.goldMarketCheckInterval);
          this.goldMarketCheckInterval = null;
        }
        
        // 广播市场开放
        if (this.eventsGateway?.server) {
          this.eventsGateway.server.emit('marketOpened', {
            market: 'GOLD',
            message: 'Gold market is now open',
          });
        }
        
        // 初始化黄金回合
        await this.initializeRound('GOLD');
      } else {
        this.logger.debug(`[GOLD_MARKET_CHECK] Still closed. ${status.message}`);
      }
    }, 5 * 60 * 1000); // 每 5 分钟检查一次
  }

  /**
   * 创建新回合
   */
  async createNewRound(category: string): Promise<void> {
    // 🆕 每次创建新回合前尝试重新加载最新配置（实现管理后台实时生效）
    await this.loadConfig();

    // 获取最新回合号
    const lastRound = await this.prisma.round.findFirst({
      where: { category },
      orderBy: { roundNumber: 'desc' }
    });
    
    const newRoundNumber = (lastRound?.roundNumber || 0) + 1;
    const now = new Date();
    const startTime = now;
    
    // 🔧 修复：确保 lockTime 严格遵循 ROUND_DURATION - LOCK_PERIOD
    // 不再直接使用 BETTING_WINDOW，因为它可能与管理员设置的 ROUND_DURATION 不匹配
    const duration = this.config.ROUND_DURATION || 10;
    const lockPeriod = this.config.LOCK_PERIOD || 3;
    const bettingDuration = Math.max(1, duration - lockPeriod);
    
    const lockTime = new Date(now.getTime() + bettingDuration * 1000);
    const endTime = new Date(now.getTime() + duration * 1000);

    // 获取当前价格作为开盘价
    const currentPrice = await this.getCurrentPrice(category);

    const round = await this.prisma.round.create({
      data: {
        roundNumber: newRoundNumber,
        category,
        startTime,
        lockTime,
        endTime,
        openPrice: currentPrice,
        highPrice: currentPrice,
        lowPrice: currentPrice,
        status: RoundStatus.BETTING,
      }
    });

    this.currentRounds.set(category, {
      roundId: round.id,
      roundNumber: round.roundNumber
    });

    // 创建 AMM 流动性池
    try {
      await this.ammService.createPool(round.id);
      this.logger.log(`Created AMM pool for round #${newRoundNumber}`);
    } catch (e) {
      this.logger.error(`Failed to create AMM pool: ${e.message}`);
    }

    // 调度状态转换
    this.scheduleRoundTransitions(round);

    // 广播新回合开始
    this.broadcastRoundUpdate(round);

    this.logger.log(`Created new round #${newRoundNumber} for ${category}`);
  }

  /**
   * 调度回合状态转换
   */
  private scheduleRoundTransitions(round: any) {
    const now = Date.now();
    const lockTime = new Date(round.lockTime).getTime();
    const endTime = new Date(round.endTime).getTime();

    // 清除旧的定时器
    const existingTimer = this.roundTimers.get(round.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 调度锁定
    if (now < lockTime && round.status === RoundStatus.BETTING) {
      const lockDelay = lockTime - now;
      setTimeout(() => this.lockRound(round.id), lockDelay);
      this.logger.debug(`Scheduled lock for round #${round.roundNumber} in ${lockDelay}ms`);
    }

    // 调度结算
    if (now < endTime) {
      const settleDelay = endTime - now;
      const timer = setTimeout(() => this.settleRound(round.id), settleDelay);
      this.roundTimers.set(round.id, timer);
      this.logger.debug(`Scheduled settle for round #${round.roundNumber} in ${settleDelay}ms`);
    }
  }

  /**
   * 锁定回合（禁止下注）
   */
  async lockRound(roundId: string) {
    const round = await this.prisma.round.update({
      where: { id: roundId },
      data: { status: RoundStatus.LOCKED }
    });

    this.broadcastRoundUpdate(round);
    this.logger.log(`Locked round #${round.roundNumber}`);
  }

  /**
   * 获取指定市场的配置（黄金使用更高精度）
   */
  private getConfigForCategory(category: string): RoundConfig {
    if (category === 'GOLD') {
      return this.goldConfig;
    }
    return this.config;
  }

  /**
   * 结算回合
   */
  async settleRound(roundId: string) {
    this.logger.log(`Settling round ${roundId}...`);

    const round = await this.prisma.round.findUnique({
      where: { id: roundId }
    });

    if (!round || round.status === RoundStatus.SETTLED) {
      return;
    }

    // 🆕 使用市场专用配置
    const marketConfig = this.getConfigForCategory(round.category);

    // 获取收盘价
    const closePrice = await this.getCurrentPrice(round.category);
    const openPrice = round.openPrice || closePrice;

    // 判定结果（使用市场专用的最小价格变动阈值）
    const priceChange = new Decimal(closePrice).minus(openPrice).div(openPrice);
    let result: RoundResult;

    // 🆕 黄金使用更高精度判定（0.0001% vs 0.01%）
    if (priceChange.greaterThan(marketConfig.MIN_PRICE_CHANGE)) {
      result = RoundResult.LONG_WIN;
    } else if (priceChange.lessThan(-marketConfig.MIN_PRICE_CHANGE)) {
      result = RoundResult.SHORT_WIN;
    } else {
      result = RoundResult.DRAW;
    }
    
    // 🆕 记录精度信息用于调试
    this.logger.debug(
      `[${round.category}] Price change: ${priceChange.mul(100).toFixed(6)}%, ` +
      `Threshold: ${marketConfig.MIN_PRICE_CHANGE * 100}%`
    );

    // 更新回合状态
    await this.prisma.round.update({
      where: { id: roundId },
      data: {
        status: RoundStatus.SETTLING,
        closePrice,
        result,
      }
    });

    // 结算 AMM 持仓
    try {
      const ammOutcome = result === RoundResult.LONG_WIN ? 'YES' : 
                         result === RoundResult.SHORT_WIN ? 'NO' : 'DRAW';
      
      await this.ammService.settlePositions(roundId, ammOutcome);
      this.logger.log(`AMM positions settled for round ${roundId} with outcome ${ammOutcome}`);
    } catch (e) {
      this.logger.error(`Failed to settle AMM positions: ${e.message}`);
    }

    // 标记为已结算
    const settledRound = await this.prisma.round.update({
      where: { id: roundId },
      data: { status: RoundStatus.SETTLED }
    });

    // 广播结算结果
    this.broadcastRoundUpdate(settledRound);
    this.broadcastSettlement(settledRound, result);

    this.logger.log(`Round #${round.roundNumber} settled: ${result} (${priceChange.mul(100).toFixed(2)}%)`);

    // 创建下一个回合
    await this.createNewRound(round.category);
  }

  /**
   * 获取当前价格（市值加权）
   */
  async getCurrentPrice(category: string): Promise<number> {
    if (category === 'GOLD') {
      // 黄金直接返回预言机价格
      const goldIndex = await this.prisma.marketIndex.findFirst({
        where: { type: 'GOLD' },
        orderBy: { timestamp: 'desc' }
      });
      return goldIndex?.value || 0;
    }

    // C10 使用市值加权
    const weights = await this.prisma.indexWeight.findMany({
      where: { category, isActive: true }
    });

    const c10Index = await this.prisma.marketIndex.findFirst({
      where: { type: 'C10' },
      orderBy: { timestamp: 'desc' }
    });

    // 如果没有权重数据，返回简单平均值
    if (weights.length === 0) {
      return c10Index?.value || 0;
    }

    // 使用权重计算
    // 注意：这里假设 IndexService 已经计算好了加权指数
    // 实际的市值加权计算应该在 IndexService 中进行
    return c10Index?.value || 0;
  }

  /**
   * 更新回合内的高低价
   */
  async updateRoundPrice(category: string, price: number) {
    const currentRound = this.currentRounds.get(category);
    if (!currentRound) return;

    const round = await this.prisma.round.findUnique({
      where: { id: currentRound.roundId }
    });

    if (!round || round.status === RoundStatus.SETTLED) return;

    const updates: any = {};
    if (!round.highPrice || price > round.highPrice) {
      updates.highPrice = price;
    }
    if (!round.lowPrice || price < round.lowPrice) {
      updates.lowPrice = price;
    }

    if (Object.keys(updates).length > 0) {
      await this.prisma.round.update({
        where: { id: round.id },
        data: updates
      });
    }
  }

  /**
   * 获取当前回合信息
   */
  async getCurrentRound(category: string) {
    const currentRound = this.currentRounds.get(category);
    if (!currentRound) return null;

    const round = await this.prisma.round.findUnique({
      where: { id: currentRound.roundId }
    });

    if (!round) return null;

    const now = Date.now();
    const endTime = new Date(round.endTime).getTime();
    const lockTime = new Date(round.lockTime).getTime();

    return {
      ...round,
      countdown: Math.max(0, Math.floor((endTime - now) / 1000)),
      canBet: round.status === RoundStatus.BETTING && now < lockTime,
      timeToLock: Math.max(0, Math.floor((lockTime - now) / 1000)),
      // 🆕 包含配置信息
      ROUND_DURATION: this.config.ROUND_DURATION,
      LOCK_PERIOD: this.config.LOCK_PERIOD,
      PAYOUT_RATIO: this.config.PAYOUT_RATIO,
    };
  }

  /**
   * 获取回合历史
   */
  async getRoundHistory(category: string, limit: number = 20) {
    return this.prisma.round.findMany({
      where: { category, status: RoundStatus.SETTLED },
      orderBy: { roundNumber: 'desc' },
      take: limit,
      select: {
        id: true,
        roundNumber: true,
        openPrice: true,
        closePrice: true,
        highPrice: true,
        lowPrice: true,
        result: true,
        longPool: true,
        shortPool: true,
        longBetCount: true,
        shortBetCount: true,
        startTime: true,
        endTime: true,
      }
    });
  }

  /**
   * 广播回合更新
   */
  private broadcastRoundUpdate(round: any) {
    if (this.eventsGateway?.server) {
      this.eventsGateway.server.emit('roundUpdate', {
        category: round.category,
        roundNumber: round.roundNumber,
        status: round.status,
        openPrice: round.openPrice,
        closePrice: round.closePrice,
        highPrice: round.highPrice,
        lowPrice: round.lowPrice,
        result: round.result,
        longPool: round.longPool,
        shortPool: round.shortPool,
        longBetCount: round.longBetCount,
        shortBetCount: round.shortBetCount,
        startTime: round.startTime,
        endTime: round.endTime,
        lockTime: round.lockTime,
        // 🆕 包含配置信息，方便前端展示
        ROUND_DURATION: this.config.ROUND_DURATION,
        LOCK_PERIOD: this.config.LOCK_PERIOD,
        PAYOUT_RATIO: this.config.PAYOUT_RATIO,
      });
    }
  }

  /**
   * 广播结算结果
   */
  private broadcastSettlement(round: any, result: RoundResult) {
    if (this.eventsGateway?.server) {
      this.eventsGateway.server.emit('roundSettled', {
        category: round.category,
        roundNumber: round.roundNumber,
        result,
        openPrice: round.openPrice,
        closePrice: round.closePrice,
      });
    }
  }

  /**
   * 获取配置
   */
  getConfig() {
    return this.config;
  }

  /**
   * 获取实时交易流水 (AMM 交易 + 预测记录)
   */
  async getLiveFeed(category: string, limit: number = 20) {
    // ... existing implementation ...
    // 1. 获取最近的 AMM 交易
    const ammTrades = await this.prisma.aMMTrade.findMany({
      where: {
        round: { category }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { username: true, address: true } }
      }
    });

    // 2. 转换为统一格式
    const formattedAmm = ammTrades.map(t => ({
      id: t.id,
      userId: t.userId,
      user: t.user,
      amount: t.amount,
      position: t.side, // YES/NO
      timestamp: t.createdAt,
      type: 'AMM',
      category: category
    }));

    // 3. 获取最近的普通下注
    const bets = await this.prisma.bet.findMany({
      where: {
        market: { category }
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        user: { select: { username: true, address: true } }
      }
    });

    const formattedBets = bets.map(b => ({
      id: b.id,
      userId: b.userId,
      user: b.user,
      amount: b.amount,
      position: b.position, // YES/NO
      timestamp: b.timestamp,
      type: 'BET',
      category: category
    }));

    // 4. 合并并重新排序
    return [...formattedAmm, ...formattedBets]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * 获取全平台未结算订单 (實時交易)
   */
  async getGlobalActiveOrders(limit: number = 50) {
    // 1. AMM 持仓 (未结算)
    const ammPositions = await this.prisma.position.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { username: true, address: true } }
      }
    });

    // 2. 普通市场下注 (未结算)
    const activeBets = await this.prisma.bet.findMany({
      where: { status: { in: ['PENDING', 'ACTIVE'] } },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        user: { select: { username: true, address: true } },
        market: { select: { title: true, category: true } }
      }
    });

    // 3. 电竞下注 (未结算)
    const activeEsports = await this.prisma.esportsBet.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { username: true, address: true } },
        match: { 
          include: { 
            homeTeam: { select: { name: true } }, 
            awayTeam: { select: { name: true } } 
          } 
        }
      }
    });

    // 4. 足球下注 (未结算)
    const activeFootball = await this.prisma.footballBet.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { username: true, address: true } },
        match: { select: { homeTeamName: true, awayTeamName: true } }
      }
    });

    // 格式化输出
    const results = [
      ...ammPositions.map(p => ({
        id: p.id,
        user: p.user,
        amount: p.totalCost,
        position: p.side,
        timestamp: p.createdAt,
        type: 'AMM',
        module: 'ROUND',
        title: `Round Order`
      })),
      ...activeBets.map(b => ({
        id: b.id,
        user: b.user,
        amount: b.amount,
        position: b.position,
        timestamp: b.timestamp,
        type: 'BET',
        module: 'MARKET',
        title: b.market.title
      })),
      ...activeEsports.filter(e => e.match?.homeTeam && e.match?.awayTeam).map(e => ({
        id: e.id,
        user: e.user,
        amount: e.amount,
        position: e.prediction,
        timestamp: e.createdAt,
        type: 'ESPORTS',
        module: 'ESPORTS',
        title: `${e.match.homeTeam?.name || 'TBD'} vs ${e.match.awayTeam?.name || 'TBD'}`
      })),
      ...activeFootball.map(f => ({
        id: f.id,
        user: f.user,
        amount: f.amount,
        position: f.prediction,
        timestamp: f.createdAt,
        type: 'FOOTBALL',
        module: 'FOOTBALL',
        title: `${f.match.homeTeamName} vs ${f.match.awayTeamName}`
      }))
    ];

    return results
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * 获取全平台已结算订单 (歷史記錄)
   */
  async getGlobalSettledOrders(limit: number = 50) {
    // 1. AMM 持仓 (已结算)
    const ammPositions = await this.prisma.position.findMany({
      where: { status: 'SETTLED' },
      orderBy: { settledAt: 'desc' },
      take: limit,
      include: {
        user: { select: { username: true, address: true } }
      }
    });

    // 2. 普通市场下注 (已结算)
    const settledBets = await this.prisma.bet.findMany({
      where: { status: 'SETTLED' },
      orderBy: { settledAt: 'desc' },
      take: limit,
      include: {
        user: { select: { username: true, address: true } },
        market: { select: { title: true, category: true } }
      }
    });

    // 3. 电竞下注 (已结算)
    const settledEsports = await this.prisma.esportsBet.findMany({
      where: { status: { in: ['WON', 'LOST'] } },
      orderBy: { settledAt: 'desc' },
      take: limit,
      include: {
        user: { select: { username: true, address: true } },
        match: { 
          include: { 
            homeTeam: { select: { name: true } }, 
            awayTeam: { select: { name: true } } 
          } 
        }
      }
    });

    // 4. 足球下注 (已结算)
    const settledFootball = await this.prisma.footballBet.findMany({
      where: { status: { in: ['WON', 'LOST'] } },
      orderBy: { settledAt: 'desc' },
      take: limit,
      include: {
        user: { select: { username: true, address: true } },
        match: { select: { homeTeamName: true, awayTeamName: true } }
      }
    });

    // 格式化输出
    const results = [
      ...ammPositions.map(p => ({
        id: p.id,
        user: p.user,
        amount: p.totalCost,
        payout: p.settlementPayout,
        position: p.side,
        timestamp: p.settledAt,
        type: 'AMM',
        module: 'ROUND',
        title: `Round Order`
      })),
      ...settledBets.map(b => ({
        id: b.id,
        user: b.user,
        amount: b.amount,
        payout: b.payout,
        position: b.position,
        timestamp: b.settledAt,
        type: 'BET',
        module: 'MARKET',
        title: b.market.title
      })),
      ...settledEsports.filter(e => e.match?.homeTeam && e.match?.awayTeam).map(e => ({
        id: e.id,
        user: e.user,
        amount: e.amount,
        payout: e.payout,
        position: e.prediction,
        timestamp: e.settledAt,
        type: 'ESPORTS',
        module: 'ESPORTS',
        title: `${e.match.homeTeam?.name || 'TBD'} vs ${e.match.awayTeam?.name || 'TBD'}`
      })),
      ...settledFootball.map(f => ({
        id: f.id,
        user: f.user,
        amount: f.amount,
        payout: f.payout,
        position: f.prediction,
        timestamp: f.settledAt,
        type: 'FOOTBALL',
        module: 'FOOTBALL',
        title: `${f.match.homeTeamName} vs ${f.match.awayTeamName}`
      }))
    ];

    return results
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * 更新配置
   */
  async updateConfig(newConfig: Partial<RoundConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    await this.prisma.systemConfig.upsert({
      where: { key: 'round_config' },
      update: { value: JSON.stringify(this.config) },
      create: { key: 'round_config', value: JSON.stringify(this.config) }
    });

    return this.config;
  }
}

