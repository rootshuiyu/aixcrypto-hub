import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { FootballService } from './football.service';
import {
  FootballEvent,
  FootballEventType,
  MatchLiveUpdate,
  OddsUpdate,
  BettingPoolStats,
  LiveMatchManager,
} from './types/football-live.types';

/**
 * 足球直播服务
 * 负责：
 * 1. 实时比赛数据同步
 * 2. 事件流管理
 * 3. 赔率动态计算
 * 4. WebSocket 推送协调
 */
@Injectable()
export class FootballLiveService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FootballLiveService.name);
  private liveMatches: Map<string, LiveMatchManager> = new Map();
  private eventCache: Map<string, FootballEvent[]> = new Map(); // matchId -> events
  private updateIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly footballService: FootballService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing FootballLiveService...');
    // 在启动时加载今天的所有直播比赛
    await this.initializeLiveMatches();
  }

  onModuleDestroy() {
    this.logger.log('Destroying FootballLiveService - cleaning up timers...');
    // 清理所有定时器
    for (const [matchId, interval] of this.updateIntervals) {
      clearInterval(interval);
    }
    this.updateIntervals.clear();
    this.liveMatches.clear();
  }

  /**
   * 初始化今天和明天的直播比赛
   */
  private async initializeLiveMatches() {
    try {
      const matches = await this.prisma.footballMatch.findMany({
        where: {
          OR: [
            { status: 'LIVE' },
            { status: 'HALFTIME' },
            {
              status: 'UPCOMING',
              scheduledAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 过去24小时
                lte: new Date(Date.now() + 48 * 60 * 60 * 1000), // 未来48小时
              },
            },
          ],
        },
      });

      this.logger.log(`Loaded ${matches.length} potential live matches`);

      for (const match of matches) {
        this.registerLiveMatch(match.id);
      }
    } catch (error) {
      this.logger.warn(`Failed to initialize live matches: ${error}`);
    }
  }

  /**
   * 注册一场比赛为直播
   */
  public registerLiveMatch(matchId: string) {
    if (!this.liveMatches.has(matchId)) {
      this.liveMatches.set(matchId, {
        matchId,
        fixtureId: parseInt(matchId.split('-')[1]),
        isLive: true,
        lastUpdate: new Date(),
      });

      // 立即执行第一次更新
      this.updateMatchData(matchId);

      // 启动定时更新（每30秒更新一次API数据）
      const interval = setInterval(() => {
        this.updateMatchData(matchId);
      }, 30000);

      this.updateIntervals.set(matchId, interval);
      this.logger.log(`Registered live match: ${matchId}`);
    }
  }

  /**
   * 注销一场比赛的直播
   */
  public unregisterLiveMatch(matchId: string) {
    const interval = this.updateIntervals.get(matchId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(matchId);
    }

    this.liveMatches.delete(matchId);
    this.eventCache.delete(matchId);
    this.logger.log(`Unregistered live match: ${matchId}`);
  }

  /**
   * 更新比赛数据（从 API 或数据库）
   */
  private async updateMatchData(matchId: string) {
    try {
      const match = await this.prisma.footballMatch.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        this.unregisterLiveMatch(matchId);
        return;
      }

      // 检查比赛是否已结束
      if (match.status === 'FINISHED' || match.status === 'CANCELLED') {
        this.unregisterLiveMatch(matchId);
        return;
      }

      const manager = this.liveMatches.get(matchId);
      if (!manager) return;

      // 检测比分变化
      const scoreChanged =
        manager.lastScore?.home !== match.homeScore || manager.lastScore?.away !== match.awayScore;
      
      // 检测进度变化
      const elapsedChanged = manager.lastElapsed !== match.elapsed;

      // 准备直播更新数据
      const liveUpdate: MatchLiveUpdate = {
        matchId: match.id,
        fixtureId: match.fixtureId,
        status: match.status as any,
        elapsed: match.elapsed,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        homeTeam: {
          id: match.homeTeamId,
          name: match.homeTeamName,
          logo: match.homeTeamLogo || '',
        },
        awayTeam: {
          id: match.awayTeamId,
          name: match.awayTeamName,
          logo: match.awayTeamLogo || '',
        },
        league: match.league,
        venue: match.venue,
        scheduledAt: match.scheduledAt,
        updatedAt: new Date(),
      };

      // 推送比赛更新
      if (scoreChanged || elapsedChanged) {
        this.eventsGateway.emitMatchLiveUpdate(liveUpdate);
        manager.lastScore = { home: match.homeScore, away: match.awayScore };
        manager.lastElapsed = match.elapsed;
      }

      // 推送赔率更新（每次更新都推送）
      const oddsUpdate: OddsUpdate = {
        matchId: match.id,
        fixtureId: match.fixtureId,
        homeOdds: match.homeOdds,
        drawOdds: match.drawOdds,
        awayOdds: match.awayOdds,
        updatedAt: new Date(),
      };
      this.eventsGateway.emitOddsUpdate(oddsUpdate);

      // 推送下注池统计
      const bettingStats: BettingPoolStats = {
        matchId: match.id,
        fixtureId: match.fixtureId,
        homeBetPool: match.homeBetPool,
        drawBetPool: match.drawBetPool,
        awayBetPool: match.awayBetPool,
        homeBetCount: 0, // TODO: 从数据库查询实际下注数
        drawBetCount: 0,
        awayBetCount: 0,
        totalPool: match.homeBetPool + match.drawBetPool + match.awayBetPool,
        updatedAt: new Date(),
      };
      this.eventsGateway.emitBettingStatsUpdate(bettingStats);

      manager.lastUpdate = new Date();
    } catch (error: any) {
      this.logger.error(`Failed to update match data for ${matchId}: ${error.message}`);
    }
  }

  /**
   * 手动添加比赛事件（来自外部或手动输入）
   */
  public async addEvent(matchId: string, event: Omit<FootballEvent, 'id'>) {
    try {
      const eventId = `${matchId}-${Date.now()}`;
      const fullEvent: FootballEvent = {
        id: eventId,
        ...event,
      };

      // 保存到事件缓存
      if (!this.eventCache.has(matchId)) {
        this.eventCache.set(matchId, []);
      }
      this.eventCache.get(matchId)!.push(fullEvent);

      // 推送事件到前端
      this.eventsGateway.emitFootballEvent(fullEvent);

      // 如果是进球事件，更新赔率
      if (event.type === 'GOAL' || event.type === 'OWN_GOAL') {
        await this.updateMatchOdds(matchId);
      }

      this.logger.debug(
        `Added event [${event.type}] for match ${matchId} by ${event.player.name}`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to add event to ${matchId}: ${error.message}`);
    }
  }

  /**
   * 获取比赛的所有事件
   */
  public getMatchEvents(matchId: string): FootballEvent[] {
    return this.eventCache.get(matchId) || [];
  }

  /**
   * 清除比赛的事件缓存（比赛结束时）
   */
  public clearMatchEvents(matchId: string) {
    this.eventCache.delete(matchId);
  }

  /**
   * 更新比赛赔率（动态赔率计算）
   */
  private async updateMatchOdds(matchId: string) {
    try {
      const match = await this.prisma.footballMatch.findUnique({
        where: { id: matchId },
      });

      if (!match) return;

      // 简单赔率调整逻辑：根据比分调整
      const scoreDiff = match.homeScore - match.awayScore;
      const baseHomeOdds = 2.0;
      const baseDrawOdds = 3.2;
      const baseAwayOdds = 2.0;

      // 领先方赔率降低，落后方赔率升高
      let homeOdds = baseHomeOdds;
      let drawOdds = baseDrawOdds;
      let awayOdds = baseAwayOdds;

      if (scoreDiff > 0) {
        homeOdds *= 0.95; // 主队领先，赔率降低
        awayOdds *= 1.1; // 客队落后，赔率升高
      } else if (scoreDiff < 0) {
        awayOdds *= 0.95;
        homeOdds *= 1.1;
      }

      // 根据下注池调整赔率（帕利蒙德定律）
      const totalPool = match.homeBetPool + match.drawBetPool + match.awayBetPool;
      if (totalPool > 0) {
        const homeRatio = match.homeBetPool / totalPool;
        const drawRatio = match.drawBetPool / totalPool;
        const awayRatio = match.awayBetPool / totalPool;

        // 下注越多的选项，赔率越低
        if (homeRatio > 0.4) homeOdds *= 0.98;
        if (drawRatio > 0.4) drawOdds *= 0.98;
        if (awayRatio > 0.4) awayOdds *= 0.98;
      }

      // 更新到数据库
      await this.prisma.footballMatch.update({
        where: { id: matchId },
        data: {
          homeOdds: Math.round(homeOdds * 100) / 100,
          drawOdds: Math.round(drawOdds * 100) / 100,
          awayOdds: Math.round(awayOdds * 100) / 100,
        },
      });
    } catch (error: any) {
      this.logger.warn(`Failed to update odds for ${matchId}: ${error.message}`);
    }
  }

  /**
   * 获取当前所有直播比赛
   */
  public getAllLiveMatches(): string[] {
    return Array.from(this.liveMatches.keys());
  }

  /**
   * 检查比赛是否在直播中
   */
  public isMatchLive(matchId: string): boolean {
    return this.liveMatches.has(matchId);
  }

  /**
   * 每分钟检查是否有新的直播比赛
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async syncLiveMatches() {
    try {
      const liveMatches = await this.prisma.footballMatch.findMany({
        where: {
          status: { in: ['LIVE', 'HALFTIME'] },
        },
      });

      // 注册新的直播比赛
      for (const match of liveMatches) {
        if (!this.liveMatches.has(match.id)) {
          this.registerLiveMatch(match.id);
        }
      }

      // 注销已结束的比赛
      const liveMatchIds = new Set(liveMatches.map(m => m.id));
      for (const matchId of this.liveMatches.keys()) {
        if (!liveMatchIds.has(matchId)) {
          this.unregisterLiveMatch(matchId);
        }
      }
    } catch (error: any) {
      this.logger.warn(`Failed to sync live matches: ${error.message}`);
    }
  }
}
