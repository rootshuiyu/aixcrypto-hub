import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { RiotService } from './providers/riot.service';
import { OpenDotaService } from './providers/opendota.service';
import { CS2SimulatorService } from './providers/cs2-simulator.service';
import { PandaScoreService } from './providers/pandascore.service';
import { SportDevsService } from './providers/sportdevs.service';
import { EventsGateway } from '../events/events.gateway';

export interface EsportsMatchDto {
  id: string;
  game: string;
  league: string;
  tournament?: string;
  homeTeam: {
    id: string;
    name: string;
    shortName?: string;
    logo?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName?: string;
    logo?: string;
  };
  bestOf: number;
  scheduledAt: Date;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED' | 'CANCELLED' | 'POSTPONED';
  homeScore: number;
  awayScore: number;
  homeOdds?: number;
  awayOdds?: number;
  streamUrl?: string;
}

@Injectable()
export class EsportsService implements OnModuleInit {
  private readonly logger = new Logger(EsportsService.name);

  constructor(
    private prisma: PrismaService,
    private riotService: RiotService,
    private openDotaService: OpenDotaService,
    private cs2Simulator: CS2SimulatorService,
    private pandaScoreService: PandaScoreService,
    private sportDevsService: SportDevsService,
    private eventsGateway: EventsGateway,
  ) {}

  async onModuleInit() {
    this.logger.log('Esports Service initializing...');
    
    // 🔧 首先清理过期的比赛状态
    await this.cleanupStaleMatchesOnInit();
    
    // 初始化时拉取数据
    await this.syncAllMatches();
  }
  
  /**
   * 🔧 初始化时清理所有过期的比赛状态
   */
  private async cleanupStaleMatchesOnInit() {
    try {
      const now = new Date();
      
      // 将所有超过 3 小时的 LIVE 比赛标记为 FINISHED
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      const staleLive = await this.prisma.esportsMatch.updateMany({
        where: {
          status: 'LIVE',
          scheduledAt: { lte: threeHoursAgo },
        },
        data: { status: 'FINISHED' },
      });
      
      // 将所有超过 12 小时的 UPCOMING 比赛标记为 CANCELLED
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const staleUpcoming = await this.prisma.esportsMatch.updateMany({
        where: {
          status: 'UPCOMING',
          scheduledAt: { lte: twelveHoursAgo },
        },
        data: { status: 'CANCELLED' },
      });
      
      this.logger.log(`🧹 Init cleanup: Finished ${staleLive.count} stale LIVE, Cancelled ${staleUpcoming.count} stale UPCOMING matches`);
    } catch (error) {
      this.logger.error('Failed to cleanup stale matches on init', error);
    }
  }

  /**
   * 每5分钟同步比赛数据
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncAllMatches() {
    this.logger.log('Syncing esports matches from SportDevs and PandaScore...');

    try {
      const sportDevsMatches = await this.sportDevsService.getLiveAndUpcomingMatches(50);
      if (sportDevsMatches.length > 0) {
        await this.upsertMatches(sportDevsMatches, 'sportdevs');
        this.logger.log(`Synced ${sportDevsMatches.length} matches from SportDevs`);
      } else {
        this.logger.warn('SportDevs returned 0 matches');
      }
    } catch (error) {
      this.logger.error('Failed to sync from SportDevs', error);
    }

    try {
      // 使用 PandaScore 补充直播源/赔率等字段
      await this.syncFromPandaScore();
      this.logger.log('Esports matches synced successfully');
    } catch (error) {
      this.logger.error('Failed to sync esports matches', error);

      // 如果 PandaScore 失败，回退到其他数据源
      this.logger.log('Falling back to alternative data sources...');
      await Promise.all([
        this.syncLOLMatches(),
        this.syncDOTA2Matches(),
        this.syncCS2Matches(),
      ]);
    }
  }

  /**
   * 🔧 每2分钟清理过期的比赛状态
   * 不再自动将 UPCOMING 标记为 LIVE（应该由 PandaScore 同步来决定）
   * 只清理超时的 LIVE 比赛
   */
  @Cron('0 */2 * * * *') // 每2分钟执行
  async cleanupStaleMatches() {
    try {
      const now = new Date();
      
      // 将超过 3 小时的 LIVE 比赛标记为 FINISHED
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      const staleLiveMatches = await this.prisma.esportsMatch.updateMany({
        where: {
          status: 'LIVE',
          scheduledAt: {
            lte: threeHoursAgo,
          },
        },
        data: {
          status: 'FINISHED',
        },
      });
      
      if (staleLiveMatches.count > 0) {
        this.logger.log(`⏹️ Auto-finished ${staleLiveMatches.count} stale LIVE matches (>3h)`);
      }
      
      // 将超过 24 小时的 UPCOMING 比赛（已过时间但未开始）标记为 CANCELLED
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const staleUpcomingMatches = await this.prisma.esportsMatch.updateMany({
        where: {
          status: 'UPCOMING',
          scheduledAt: {
            lte: oneDayAgo,
          },
        },
        data: {
          status: 'CANCELLED',
        },
      });
      
      if (staleUpcomingMatches.count > 0) {
        this.logger.log(`🚫 Auto-cancelled ${staleUpcomingMatches.count} stale UPCOMING matches (>24h)`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup stale matches', error);
    }
  }

  /**
   * 从 PandaScore 同步所有比赛数据
   */
  async syncFromPandaScore() {
    try {
      const data = await this.pandaScoreService.getAllUpcomingAndRunningMatches();
      
      // 同步所有比赛
      for (const match of data.all) {
        if (match) {
          await this.upsertMatchFromPandaScore(match);
        }
      }
      
      this.logger.log(`Synced ${data.all.length} matches from PandaScore (LOL: ${data.lol.length}, DOTA2: ${data.dota2.length}, CS2: ${data.cs2.length})`);
    } catch (error) {
      this.logger.error('Failed to sync from PandaScore', error);
      throw error;
    }
  }

  /**
   * 从 PandaScore 数据插入/更新比赛
   */
  private async upsertMatchFromPandaScore(match: NonNullable<ReturnType<typeof this.pandaScoreService.transformMatch>>) {
    try {
      // 确保队伍存在
      const homeTeam = await this.prisma.esportsTeam.upsert({
        where: { externalId: match.homeTeam.id },
        create: {
          externalId: match.homeTeam.id,
          name: match.homeTeam.name,
          shortName: match.homeTeam.shortName,
          logo: match.homeTeam.logo,
          game: match.game,
        },
        update: {
          name: match.homeTeam.name,
          shortName: match.homeTeam.shortName,
          logo: match.homeTeam.logo,
        },
      });

      const awayTeam = await this.prisma.esportsTeam.upsert({
        where: { externalId: match.awayTeam.id },
        create: {
          externalId: match.awayTeam.id,
          name: match.awayTeam.name,
          shortName: match.awayTeam.shortName,
          logo: match.awayTeam.logo,
          game: match.game,
        },
        update: {
          name: match.awayTeam.name,
          shortName: match.awayTeam.shortName,
          logo: match.awayTeam.logo,
        },
      });

      const existing = await this.prisma.esportsMatch.findUnique({
        where: { externalId: match.id },
        select: { status: true, streamUrl: true, source: true },
      });

      const shouldPreserveStatus = existing?.source === 'sportdevs';
      const nextStatus = shouldPreserveStatus ? existing?.status : match.status;
      const nextStreamUrl = match.streamUrl || existing?.streamUrl || null;

      const updateData: any = {
        league: match.league,
        leagueLogo: match.leagueLogo,
        tournament: match.tournament,
        scheduledAt: match.scheduledAt,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        homeOdds: match.homeOdds,
        awayOdds: match.awayOdds,
      };

      if (!shouldPreserveStatus) {
        updateData.status = match.status;
      }

      if (match.streamUrl) {
        updateData.streamUrl = match.streamUrl;
      }

      // 插入或更新比赛
      const upsertedMatch = await this.prisma.esportsMatch.upsert({
        where: { externalId: match.id },
        create: {
          externalId: match.id,
          game: match.game,
          league: match.league,
          leagueLogo: match.leagueLogo,
          tournament: match.tournament,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          bestOf: match.bestOf,
          scheduledAt: match.scheduledAt,
          status: nextStatus || match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          homeOdds: match.homeOdds,
          awayOdds: match.awayOdds,
          streamUrl: nextStreamUrl,
          source: 'pandascore',
        },
        update: updateData,
      });

      // 🆕 状态变化时发送 WebSocket 广播
      if (existing && existing.status !== (nextStatus || match.status)) {
        this.logger.log(`📢 Broadcasting esports match status change: ${match.id} (${existing.status} -> ${nextStatus || match.status})`);
        this.eventsGateway.server.emit('esportsUpdate', {
          id: upsertedMatch.id,
          externalId: match.id,
          status: nextStatus || match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error(`Failed to upsert match ${match.id}`, error);
    }
  }

  /**
   * 同步 LOL 比赛（备用）
   */
  async syncLOLMatches() {
    try {
      const matches = await this.riotService.getLiveAndUpcomingMatches();
      await this.upsertMatches(matches, 'riot');
      this.logger.log(`Synced ${matches.length} LOL matches from Riot`);
    } catch (error) {
      this.logger.error('Failed to sync LOL matches', error);
    }
  }

  /**
   * 同步 DOTA2 比赛（备用）
   */
  async syncDOTA2Matches() {
    try {
      const matches = await this.openDotaService.getLiveAndUpcomingMatches();
      await this.upsertMatches(matches, 'opendota');
      this.logger.log(`Synced ${matches.length} DOTA2 matches from OpenDota`);
    } catch (error) {
      this.logger.error('Failed to sync DOTA2 matches', error);
    }
  }

  /**
   * 同步 CS2 比赛（备用/模拟数据）
   */
  async syncCS2Matches() {
    try {
      const matches = await this.cs2Simulator.generateMatches();
      await this.upsertMatches(matches, 'simulator');
      this.logger.log(`Synced ${matches.length} CS2 matches from simulator`);
    } catch (error) {
      this.logger.error('Failed to sync CS2 matches', error);
    }
  }

  /**
   * 插入或更新比赛数据
   */
  private async upsertMatches(matches: EsportsMatchDto[], source: string) {
    for (const match of matches) {
      try {
        const existing = await this.prisma.esportsMatch.findUnique({
          where: { externalId: match.id },
          select: { status: true, streamUrl: true, source: true },
        });

        // 确保队伍存在
        const homeTeam = await this.upsertTeam(match.homeTeam, match.game);
        const awayTeam = await this.upsertTeam(match.awayTeam, match.game);

        const shouldPreserveStatus = existing?.source === 'sportdevs' && source !== 'sportdevs';
        const nextStatus = shouldPreserveStatus ? existing?.status : match.status;
        const nextStreamUrl = match.streamUrl || existing?.streamUrl || null;

        const updateData: any = {
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          homeOdds: match.homeOdds,
          awayOdds: match.awayOdds,
        };

        if (!shouldPreserveStatus) {
          updateData.status = nextStatus;
        }

        if (match.streamUrl) {
          updateData.streamUrl = match.streamUrl;
        }

        if (source === 'sportdevs') {
          updateData.source = source;
        }

        // 插入或更新比赛
        await this.prisma.esportsMatch.upsert({
          where: { externalId: match.id },
          create: {
            externalId: match.id,
            game: match.game,
            league: match.league,
            tournament: match.tournament,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            bestOf: match.bestOf,
            scheduledAt: match.scheduledAt,
            status: nextStatus || match.status,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            homeOdds: match.homeOdds,
            awayOdds: match.awayOdds,
            streamUrl: nextStreamUrl,
            source,
          },
          update: updateData,
        });
      } catch (error) {
        this.logger.error(`Failed to upsert match ${match.id}`, error);
      }
    }
  }

  /**
   * 插入或更新队伍
   */
  private async upsertTeam(team: EsportsMatchDto['homeTeam'], game: string) {
    return this.prisma.esportsTeam.upsert({
      where: { externalId: team.id },
      create: {
        externalId: team.id,
        name: team.name,
        shortName: team.shortName,
        logo: team.logo,
        game,
      },
      update: {
        name: team.name,
        shortName: team.shortName,
        logo: team.logo,
      },
    });
  }

  /**
   * 获取所有比赛（按游戏分类）
   */
  async getMatches(options?: {
    game?: string;
    status?: string;
    limit?: number;
  }) {
    const where: any = {};
    
    if (options?.game) {
      where.game = options.game;
    }
    
    if (options?.status) {
      where.status = options.status;
    } else {
      // 默认只返回即将开始和进行中的比赛
      where.status = { in: ['UPCOMING', 'LIVE'] };
    }

    const matches = await this.prisma.esportsMatch.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: [
        { status: 'asc' }, // LIVE 优先
        { scheduledAt: 'asc' },
      ],
      take: options?.limit || 50,
    });

    return matches.map(match => ({
      id: match.id,
      externalId: match.externalId,
      game: match.game,
      league: match.league,
      tournament: match.tournament,
      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        shortName: match.homeTeam.shortName,
        logo: match.homeTeam.logo,
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        shortName: match.awayTeam.shortName,
        logo: match.awayTeam.logo,
      },
      bestOf: match.bestOf,
      scheduledAt: match.scheduledAt,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      homeOdds: match.homeOdds,
      awayOdds: match.awayOdds,
      streamUrl: match.streamUrl,
      homeBetPool: match.homeBetPool,
      awayBetPool: match.awayBetPool,
    }));
  }

  /**
   * 获取单场比赛详情
   */
  async getMatchById(id: string) {
    const match = await this.prisma.esportsMatch.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        bets: {
          select: {
            prediction: true,
            amount: true,
          },
        },
      },
    });

    if (!match) {
      return null;
    }

    // 计算下注统计
    const betStats = match.bets.reduce(
      (acc, bet) => {
        if (bet.prediction === 'HOME') {
          acc.homeCount++;
          acc.homeAmount += bet.amount;
        } else if (bet.prediction === 'AWAY') {
          acc.awayCount++;
          acc.awayAmount += bet.amount;
        }
        return acc;
      },
      { homeCount: 0, awayCount: 0, homeAmount: 0, awayAmount: 0 },
    );

    return {
      ...match,
      betStats,
    };
  }

  /**
   * 下注
   */
  async placeBet(
    userId: string,
    matchId: string,
    prediction: 'HOME' | 'AWAY',
    amount: number,
  ) {
    // 获取比赛
    const match = await this.prisma.esportsMatch.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== 'UPCOMING') {
      throw new Error('Can only bet on upcoming matches');
    }

    // 获取当前赔率
    const odds = prediction === 'HOME' ? match.homeOdds : match.awayOdds;
    if (!odds) {
      throw new Error('Odds not available');
    }

    // 检查用户余额
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.pts < amount) {
      throw new Error('Insufficient balance');
    }

    // 创建下注并扣款
    const [bet] = await this.prisma.$transaction([
      this.prisma.esportsBet.create({
        data: {
          userId,
          matchId,
          prediction,
          amount,
          odds,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          pts: { decrement: amount },
        },
      }),
      this.prisma.esportsMatch.update({
        where: { id: matchId },
        data: {
          [prediction === 'HOME' ? 'homeBetPool' : 'awayBetPool']: {
            increment: amount,
          },
        },
      }),
    ]);

    // 🆕 广播余额更新
    const updatedUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pts: true },
    });
    if (updatedUser) {
      this.eventsGateway.emitBalanceUpdate(userId, updatedUser.pts);
    }

    // 🆕 广播下注成功
    this.eventsGateway.emitBetSuccess(userId, bet);

    return bet;
  }

  /**
   * 获取热门比赛
   */
  async getHotMatches(limit = 5) {
    const matches = await this.prisma.esportsMatch.findMany({
      where: {
        status: { in: ['LIVE', 'UPCOMING'] },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: [
        { status: 'asc' }, // LIVE 优先
        { homeBetPool: 'desc' }, // 下注量高的优先
      ],
      take: limit,
    });
    
    // 🆕 转换为统一的 API 响应格式，确保包含所有必要字段
    return matches.map(match => ({
      id: match.id,
      externalId: match.externalId,
      game: match.game,
      league: match.league,
      tournament: match.tournament,
      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        shortName: match.homeTeam.shortName,
        logo: match.homeTeam.logo,
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        shortName: match.awayTeam.shortName,
        logo: match.awayTeam.logo,
      },
      bestOf: match.bestOf,
      scheduledAt: match.scheduledAt,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      homeOdds: match.homeOdds,
      awayOdds: match.awayOdds,
      streamUrl: match.streamUrl,
      homeBetPool: match.homeBetPool,
      awayBetPool: match.awayBetPool,
    }));
  }

  /**
   * 获取用户下注历史
   */
  async getUserBets(userId: string, limit = 20) {
    return this.prisma.esportsBet.findMany({
      where: { userId },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
