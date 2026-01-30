import { Injectable, NotFoundException, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { MarketOutcome } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { QuestService } from '../quest/quest.service';
import { EventsGateway } from '../events/events.gateway';
import { AIService } from '../ai/ai.service';
import { getComboStateByResult } from '../common/combo.utils';

@Injectable()
export class PlaygroundService {
  private readonly logger = new Logger(PlaygroundService.name);
  private rateLimits = new Map<string, number>();

  constructor(
    private prisma: PrismaService,
    private questService: QuestService,
    private eventsGateway: EventsGateway,
    private aiService: AIService,
  ) {}

  /**
   * 计算用户的动态 AI 难度调整系数
   * 结合管理员配置 + 用户胜率自动平衡
   */
  private async calculateDifficultyAdjustment(userId: string, agent: any): Promise<number> {
    // 1. 获取管理员配置的基础难度偏移
    const adminBias = agent.difficultyBias || 0;
    
    // 2. 计算用户胜率动态调整
    const recentBattles = await this.prisma.battle.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    let dynamicAdjustment = 0;
    if (recentBattles.length >= 5) {
      const wins = recentBattles.filter(b => b.winner === 'USER').length;
      const winRate = wins / recentBattles.length;

      // 动态平衡：如果用户赢太多，AI变强；输太多，AI变弱
      if (winRate > 0.7) dynamicAdjustment = 0.15;
      else if (winRate > 0.6) dynamicAdjustment = 0.08;
      else if (winRate < 0.3) dynamicAdjustment = -0.15;
      else if (winRate < 0.4) dynamicAdjustment = -0.08;
    }

    // 3. 高级别 AI 调整更敏感
    const levelMultiplier = { 'EASY': 0.5, 'MEDIUM': 0.8, 'HARD': 1.0, 'MASTER': 1.2 };
    const levelFactor = levelMultiplier[agent.level] || 1;

    // 4. 最终难度 = 管理员配置 + 动态调整
    const finalAdjustment = adminBias + (dynamicAdjustment * levelFactor);
    
    this.logger.debug(`Difficulty for ${agent.name}: adminBias=${adminBias}, dynamic=${dynamicAdjustment}, final=${finalAdjustment}`);
    
    return Math.max(-0.5, Math.min(0.5, finalAdjustment)); // 限制在 -50% ~ +50%
  }

  /**
   * 检查是否应用诱空/诱多策略
   */
  private shouldApplyTrap(agent: any): boolean {
    const trapFreq = agent.trapFrequency || 0.1;
    return Math.random() < trapFreq;
  }

  /**
   * 根据激进程度调整 AI 决策
   */
  private applyAggressiveness(basePick: string, agent: any): string {
    const aggressiveness = agent.aggressiveness || 0.5;
    
    // 高激进度时，AI 更可能做出与市场趋势相反的决策（逆势操作）
    if (aggressiveness > 0.7 && Math.random() < 0.3) {
      return basePick === 'YES' ? 'NO' : 'YES';
    }
    
    return basePick;
  }

  /**
   * 获取当前活跃的赛季和锦标赛
   */
  private async getActiveCompetitions() {
    const [season, tournament] = await Promise.all([
      this.prisma.season.findFirst({ where: { status: 'ACTIVE' } }),
      this.prisma.tournament.findFirst({ 
        where: { status: 'ACTIVE' },
        orderBy: { prizePool: 'desc' }
      })
    ]);
    return { season, tournament };
  }

  async getAgents(userId?: string) {
    const agents = await this.prisma.agent.findMany();
    if (!userId || userId === 'undefined') return agents;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        pts: true, 
        totalWins: true,  // 使用 User 模型的 totalWins 字段
        totalBattles: true
      }
    });

    if (!user) return agents;

    // 使用 User 模型上的 totalWins 字段（与前端一致）
    const totalWins = user.totalWins || 0;
    const userPts = user.pts || 0;

    this.logger.debug(`User ${userId} unlock check: totalWins=${totalWins}, pts=${userPts}`);

    return agents.map(agent => {
      let isLocked = false;
      let requirement = '';

      if (agent.level === 'MEDIUM' && totalWins < 10) {
        isLocked = true;
        requirement = `Need 10 wins to unlock (${totalWins}/10)`;
      } else if (agent.level === 'HARD' && (totalWins < 30 || userPts < 5000)) {
        isLocked = true;
        const winsOk = totalWins >= 30;
        const ptsOk = userPts >= 5000;
        requirement = `Need 30 wins${winsOk ? ' ✓' : ` (${totalWins}/30)`} and 5000 PTS${ptsOk ? ' ✓' : ` (${userPts}/5000)`}`;
      } else if (agent.level === 'MASTER' && (totalWins < 100 || userPts < 20000)) {
        isLocked = true;
        const winsOk = totalWins >= 100;
        const ptsOk = userPts >= 20000;
        requirement = `Need 100 wins${winsOk ? ' ✓' : ` (${totalWins}/100)`} and 20000 PTS${ptsOk ? ' ✓' : ` (${userPts}/20000)`}`;
      }

      return {
        ...agent,
        isLocked,
        requirement
      };
    });
  }

  async startBattle(userId: string, agentId: string, userPick: MarketOutcome, language: string = 'en', amount: number = 0) {
    if (!userId || userId === 'undefined') {
      throw new BadRequestException('Invalid User ID');
    }

    // --- C1: Rate Limiting (防抖限制) ---
    const now = Date.now();
    const lastRequest = this.rateLimits.get(userId) || 0;
    if (now - lastRequest < 1000) { // 每秒只能发起一次
      throw new BadRequestException('Too many requests. Please wait 1s.');
    }
    this.rateLimits.set(userId, now);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent not found');

    // 1. 验证下注金额与等级限制
    const limits = {
      'EASY': { min: 0, max: 100, multiplier: 1.0 },
      'MEDIUM': { min: 50, max: 500, multiplier: 1.2 },
      'HARD': { min: 200, max: 2000, multiplier: 1.5 },
      'MASTER': { min: 500, max: 10000, multiplier: 2.0 }
    };
    const limit = limits[agent.level] || limits['EASY'];

    if (amount > 0) {
      if (amount < limit.min || amount > limit.max) {
        throw new BadRequestException(`Bet amount must be between ${limit.min} and ${limit.max} PTS for ${agent.level}`);
      }
      if (user.pts < amount) {
        throw new BadRequestException('Insufficient PTS balance');
      }
    }

    // 2. 获取活跃市场作为对战基础
    const activeMarket = await this.prisma.market.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });

    let agentPick: MarketOutcome;
    let agentReasoning = '';

    // 3. 计算动态难度调整（结合管理员配置和用户胜率）
    const difficultyAdjustment = await this.calculateDifficultyAdjustment(userId, agent);
    this.logger.debug(`Applied difficulty adjustment: ${difficultyAdjustment} for user ${userId}`);

    // 4. 使用 AI 服务生成不同深度的智能策略
    const personalityMap: Record<string, string> = {
      'EASY': 'a conservative rookie trader, prone to follow short-term hype',
      'MEDIUM': 'a balanced trend-following trader, looks at RSI and basic support',
      'HARD': 'an aggressive pro trader, uses MACD divergence and volume analysis',
      'MASTER': 'an elite quantitative master whale, recognizes traps and high-volatility patterns'
    };
    const agentPersonality = agent.personality || personalityMap[agent.level] || 'balanced trader';

    if (activeMarket) {
      try {
        const context = await this.aiService.getMarketContext(activeMarket.id);
        const strategy = await this.aiService.generateBattleStrategy(
          agentPersonality,
          context,
          language
        );
        let basePick = strategy.pick === 'YES' ? MarketOutcome.YES : MarketOutcome.NO;
        
        // 5. 应用激进程度调整
        const adjustedPick = this.applyAggressiveness(basePick === MarketOutcome.YES ? 'YES' : 'NO', agent);
        agentPick = adjustedPick === 'YES' ? MarketOutcome.YES : MarketOutcome.NO;
        
        // 6. 检查是否应用诱空/诱多策略
        if (this.shouldApplyTrap(agent)) {
          agentPick = agentPick === MarketOutcome.YES ? MarketOutcome.NO : MarketOutcome.YES;
          this.logger.debug(`Trap strategy applied for agent ${agent.name}`);
        }
        
        agentReasoning = strategy.reasoning;
        this.logger.log(`AI Agent ${agent.name} [${agent.level}] picked ${agentPick}: ${agentReasoning}`);
      } catch (error) {
        this.logger.warn(`AI strategy failed, using random: ${error}`);
        agentPick = Math.random() > 0.5 ? MarketOutcome.YES : MarketOutcome.NO;
        agentReasoning = 'Internal system fallback analysis.';
      }
    } else {
      agentPick = Math.random() > 0.5 ? MarketOutcome.YES : MarketOutcome.NO;
      agentReasoning = 'No active market detected, simulation mode.';
    }

    // 7. 判定胜负 (实时基于指数或模拟)
    let marketResult: MarketOutcome;
    if (activeMarket) {
      const indices = await this.prisma.marketIndex.findMany({
        where: { type: activeMarket.category || 'C10' },
        orderBy: { timestamp: 'desc' },
        take: 2
      });
      marketResult = indices.length >= 2 && indices[0].value > indices[1].value 
        ? MarketOutcome.YES 
        : MarketOutcome.NO;
    } else {
      marketResult = Math.random() > 0.5 ? MarketOutcome.YES : MarketOutcome.NO;
    }

    // 8. 应用难度调整到胜负判定
    // difficultyAdjustment > 0 时 AI 更强（用户更难赢）
    // difficultyAdjustment < 0 时 AI 更弱（用户更容易赢）
    let winner: string;
    const userCorrect = userPick === marketResult;
    const agentCorrect = agentPick === marketResult;
    
    if (userCorrect && !agentCorrect) {
      // 用户判断正确，AI 判断错误
      // 但如果难度偏高，有一定概率翻转结果（模拟 AI 的"运气"）
      if (difficultyAdjustment > 0 && Math.random() < difficultyAdjustment * 0.3) {
        winner = 'DRAW'; // 难度高时，用户赢变平局
        this.logger.debug(`Difficulty adjustment turned USER win to DRAW`);
      } else {
        winner = 'USER';
      }
    } else if (!userCorrect && agentCorrect) {
      // AI 判断正确，用户判断错误
      // 如果难度偏低，有一定概率给用户机会
      if (difficultyAdjustment < 0 && Math.random() < Math.abs(difficultyAdjustment) * 0.3) {
        winner = 'DRAW'; // 难度低时，用户输变平局
        this.logger.debug(`Difficulty adjustment turned AGENT win to DRAW`);
      } else {
        winner = 'AGENT';
      }
    } else {
      winner = 'DRAW';
    }

    this.logger.debug(`Battle determined: userPick=${userPick}, marketResult=${marketResult}, agentPick=${agentPick}, winner=${winner}`);

    // --- B1: 情感化 AI 互动 (Emotional Interaction) ---
    let emotionalComment = '';
    try {
      this.logger.debug(`Generating emotional debriefing for user: ${userId}`);
      const recentBattles = await this.prisma.battle.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 5
      });
      const consecutiveLosses = recentBattles.filter(b => b.winner === 'AGENT').length;
      
      emotionalComment = await this.aiService.generateEmotionalDebriefing(
        agent.name,
        agent.level,
        winner,
        language,
        consecutiveLosses
      );
      this.logger.debug(`Emotional comment: ${emotionalComment}`);
    } catch (e) {
      this.logger.error(`Emotional debriefing failed: ${e.message}`);
    }

    // 5. 计算奖励与扣除
    let finalReward = 0;
    try {
      // --- C2: Optimistic Locking & Atomic Update ---
      await this.prisma.$transaction(async (tx) => {
        // 再次获取最新的用户信息和版本号
        const latestUser = await tx.user.findUnique({ where: { id: userId } });
        if (!latestUser) throw new Error('User missing');

        if (amount > 0) {
          if (winner === 'USER') {
            finalReward = amount * limit.multiplier;
            await tx.user.update({
              where: { id: userId, version: latestUser.version },
              data: { 
                pts: { increment: finalReward },
                version: { increment: 1 }
              }
            });
          } else if (winner === 'AGENT') {
            await tx.user.update({
              where: { id: userId, version: latestUser.version },
              data: { 
                pts: { decrement: amount },
                version: { increment: 1 }
              }
            });
          } else { // DRAW
            if (agent.level === 'EASY') {
              finalReward = amount * 0.05;
              await tx.user.update({
                where: { id: userId, version: latestUser.version },
                data: { 
                  pts: { increment: finalReward },
                  version: { increment: 1 }
                }
              });
            }
          }
        }
      });
    } catch (e) {
      this.logger.error(`PTS update failed: ${e.message}`);
      throw new BadRequestException(`Transaction failed: ${e.message}`);
    }

    // 获取当前赛季和锦标赛
    const { season, tournament } = await this.getActiveCompetitions();

    // 获取详细的市场数据用于记录
    let entryPrice: number | undefined;
    let exitPrice: number | undefined;
    let technicalData: string | undefined;
    let marketType: string | undefined;
    let timeframe: string | undefined;

    if (activeMarket) {
      marketType = activeMarket.category;
      timeframe = activeMarket.timeframe;
      
      const indices = await this.prisma.marketIndex.findMany({
        where: { type: activeMarket.category || 'C10' },
        orderBy: { timestamp: 'desc' },
        take: 10
      });
      
      if (indices.length >= 2) {
        entryPrice = indices[1].value;
        exitPrice = indices[0].value;
        
        // 计算技术指标
        const prices = indices.map(i => i.value).reverse();
        const rsi = this.calculateRSI(prices);
        const priceChange = ((exitPrice - entryPrice) / entryPrice) * 100;
        
        technicalData = JSON.stringify({
          rsi,
          priceChange: priceChange.toFixed(2),
          entryTime: indices[1].timestamp,
          exitTime: indices[0].timestamp,
          trend: priceChange > 0 ? 'BULLISH' : 'BEARISH'
        });
      }
    }

    try {
      this.logger.debug(`Creating battle record...`);
      const battle = await this.prisma.battle.create({
        data: {
          userId,
          agentId,
          userPick,
          agentPick,
          amount,
          reward: finalReward,
          winner,
          reasoning: emotionalComment ? `${agentReasoning}\n\n[${agent.name}]: ${emotionalComment}` : agentReasoning,
          status: 'COMPLETED',
          // 扩展字段
          marketType,
          timeframe,
          entryPrice,
          exitPrice,
          userStrategy: `${userPick === 'YES' ? 'LONG' : 'SHORT'} position`,
          agentStrategy: `${agentPick === 'YES' ? 'LONG' : 'SHORT'} - ${agent.level} strategy`,
          technicalData,
          priceChange: entryPrice && exitPrice ? ((exitPrice - entryPrice) / entryPrice) * 100 : null,
          seasonId: season?.id,
          tournamentId: tournament?.id,
          isPublic: true
        },
        include: { agent: true }
      });
      this.logger.debug(`Battle record created: ${battle.id}`);

      // 更新用户统计（包括 combo 和 maxCombo）
      // 使用统一的连击计算工具
      const currentUser = await this.prisma.user.findUnique({ where: { id: userId } });
      if (currentUser) {
        const resultType = winner === 'USER' ? 'WIN' : 
                           winner === 'AGENT' ? 'LOSE' : 'DRAW';
        const comboState = getComboStateByResult(
          resultType,
          currentUser.combo,
          currentUser.maxCombo,
          currentUser.multiplier
        );

        await this.prisma.user.update({
          where: { id: userId },
          data: {
            totalBattles: { increment: 1 },
            totalWins: winner === 'USER' ? { increment: 1 } : undefined,
            combo: comboState.newCombo,
            maxCombo: comboState.newMaxCombo,
            multiplier: comboState.newMultiplier
          }
        });
      }

      // 更新赛季排名
      if (season) {
        await this.updateSeasonRanking(userId, season.id, winner === 'USER', finalReward - (winner === 'AGENT' ? amount : 0));
      }

      // 更新锦标赛分数
      if (tournament) {
        await this.updateTournamentScore(userId, tournament.id, winner === 'USER', finalReward);
      }

      // 6. 任务与通知
      await this.questService.updateProgress(userId, 'BATTLE');
      this.eventsGateway.emitBattleResult(userId, battle);

      // 7. 推送余额更新，多 Tab 同步
      const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { pts: true } });
      if (u != null) this.eventsGateway.emitBalanceUpdate(userId, u.pts);

      // 广播实时对战结果（用于观战）
      this.eventsGateway.server.emit('liveBattle:completed', {
        battleId: battle.id,
        username: user.username || 'Anonymous',
        agentName: agent.name,
        winner,
        amount,
        reward: finalReward
      });

      return battle;
    } catch (e) {
      this.logger.error(`Battle record creation failed: ${e.message}`);
      throw e;
    }
  }

  /**
   * 简单 RSI 计算
   */
  private calculateRSI(prices: number[], period: number = 7): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * 更新赛季排名
   */
  private async updateSeasonRanking(userId: string, seasonId: string, isWin: boolean, ptsChange: number) {
    try {
      const existing = await this.prisma.seasonRanking.findUnique({
        where: { seasonId_userId: { seasonId, userId } }
      });

      if (existing) {
        const newWins = existing.wins + (isWin ? 1 : 0);
        const newTotal = existing.totalBattles + 1;
        
        await this.prisma.seasonRanking.update({
          where: { id: existing.id },
          data: {
            totalBattles: { increment: 1 },
            wins: isWin ? { increment: 1 } : undefined,
            losses: !isWin ? { increment: 1 } : undefined,
            winRate: newWins / newTotal,
            totalPts: { increment: ptsChange > 0 ? ptsChange : 0 }
          }
        });
      } else {
        await this.prisma.seasonRanking.create({
          data: {
            seasonId,
            userId,
            totalBattles: 1,
            wins: isWin ? 1 : 0,
            losses: isWin ? 0 : 1,
            winRate: isWin ? 1 : 0,
            totalPts: ptsChange > 0 ? ptsChange : 0
          }
        });
      }
    } catch (e) {
      this.logger.error(`Season ranking update failed: ${e.message}`);
    }
  }

  /**
   * 更新锦标赛分数
   */
  private async updateTournamentScore(userId: string, tournamentId: string, isWin: boolean, points: number) {
    try {
      const participant = await this.prisma.tournamentParticipant.findUnique({
        where: { tournamentId_userId: { tournamentId, userId } }
      });

      if (participant && !participant.eliminated) {
        await this.prisma.tournamentParticipant.update({
          where: { id: participant.id },
          data: {
            wins: isWin ? { increment: 1 } : undefined,
            losses: !isWin ? { increment: 1 } : undefined,
            score: { increment: points }
          }
        });
      }
    } catch (e) {
      this.logger.error(`Tournament score update failed: ${e.message}`);
    }
  }

  async getRecentBattles(userId: string, limit?: number) {
    const battles = await this.prisma.battle.findMany({
      where: { userId },
      include: { agent: true },
      orderBy: { timestamp: 'desc' },
      take: limit ?? 10
    });
    return battles.map((b) => {
      const priceChange = b.priceChange != null ? Number(b.priceChange) : null;
      const marketResult = priceChange != null ? (priceChange >= 0 ? 'YES' : 'NO') : null;
      return { ...b, marketResult };
    });
  }

  /**
   * 获取用户 Battle 统计（对战胜率、净盈亏、ROI）
   */
  async getBattleStats(userId: string) {
    const battles = await this.prisma.battle.findMany({
      where: { userId },
      select: { winner: true, amount: true, reward: true }
    });
    const totalBattles = battles.length;
    const wins = battles.filter((b) => b.winner === 'USER').length;
    const losses = battles.filter((b) => b.winner === 'AGENT').length;
    const draws = battles.filter((b) => b.winner === 'DRAW').length;
    const totalWagered = battles.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const totalReward = battles.reduce((sum, b) => sum + Number(b.reward || 0), 0);
    const netProfit = totalReward - totalWagered;
    const winRate = totalBattles > 0 ? ((wins / totalBattles) * 100).toFixed(1) : '0';
    const roi = totalWagered > 0 ? ((netProfit / totalWagered) * 100).toFixed(1) : '0';
    return {
      totalBattles,
      wins,
      losses,
      draws,
      winRate,
      totalWagered,
      totalReward,
      netProfit,
      roi
    };
  }
}
