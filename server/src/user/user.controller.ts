import { Controller, Get, Put, Post, Param, Body, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { EventsGateway } from '../events/events.gateway';
import { QuestService } from '../quest/quest.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly questService: QuestService,
  ) {}

  @Get(':id/recent-activity')
  @ApiOperation({ summary: '获取用户最近活动（下注/持仓/结算等）' })
  async getRecentActivity(
    @Param('id') id: string,
    @Query('limit') limit: string = '10',
  ) {
    const take = Math.min(parseInt(limit, 10) || 10, 50);
    const [bets, positions, esportsBets, footballBets] = await Promise.all([
      this.prisma.bet.findMany({
        where: { userId: id },
        orderBy: { timestamp: 'desc' },
        take,
        include: { market: { select: { title: true, category: true } } },
      }),
      this.prisma.position.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take,
      }),
      this.prisma.esportsBet.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take,
        include: {
          match: {
            include: {
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.footballBet.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take,
        include: { match: true },
      }),
    ]);

    type ActivityItem = {
      id: string;
      type: 'BET' | 'POSITION' | 'ESPORTS' | 'FOOTBALL';
      title: string;
      amount: number;
      position?: string;
      status: string;
      time: Date;
    };

    const items: ActivityItem[] = [
      ...bets.map((b) => ({
        id: b.id,
        type: 'BET' as const,
        title: b.market?.title || 'C10/GOLD',
        amount: Number(b.amount),
        position: b.position,
        status: b.status,
        time: b.timestamp,
      })),
      ...positions.map((p) => ({
        id: p.id,
        type: 'POSITION' as const,
        title: `Round (${p.roundId.slice(0, 8)}…)`,
        amount: Number(p.totalCost),
        position: p.side,
        status: p.status,
        time: p.createdAt,
      })),
      ...esportsBets.map((e) => ({
        id: e.id,
        type: 'ESPORTS' as const,
        title: [e.match?.homeTeam?.name, e.match?.awayTeam?.name].filter(Boolean).join(' vs ') || 'Esports',
        amount: Number(e.amount),
        position: e.prediction,
        status: e.status,
        time: e.createdAt,
      })),
      ...footballBets.map((f) => ({
        id: f.id,
        type: 'FOOTBALL' as const,
        title: [f.match?.homeTeamName, f.match?.awayTeamName].filter(Boolean).join(' vs ') || 'Football',
        amount: Number(f.amount),
        position: f.prediction,
        status: f.status,
        time: f.createdAt,
      })),
    ];

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return { success: true, activities: items.slice(0, take) };
  }

  @Get(':id/season-level')
  @ApiOperation({ summary: '获取用户当前赛季等级/排名' })
  async getSeasonLevel(@Param('id') id: string) {
    const activeSeason = await this.prisma.season.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { startDate: 'desc' },
    });
    if (!activeSeason) {
      return { success: true, seasonName: null, rank: null, totalPts: 0, winRate: 0, level: '—' };
    }
    const ranking = await this.prisma.seasonRanking.findUnique({
      where: { seasonId_userId: { seasonId: activeSeason.id, userId: id } },
    });
    if (!ranking) {
      return {
        success: true,
        seasonName: activeSeason.name,
        rank: null,
        totalPts: 0,
        winRate: 0,
        level: 'Bronze',
      };
    }
    const allInSeason = await this.prisma.seasonRanking.count({
      where: { seasonId: activeSeason.id },
    });
    const rankOrder = await this.prisma.seasonRanking.findMany({
      where: { seasonId: activeSeason.id },
      orderBy: [{ totalPts: 'desc' }, { winRate: 'desc' }],
      select: { userId: true },
    });
    const rankIndex = rankOrder.findIndex((r) => r.userId === id);
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;
    let level = 'Bronze';
    if (rank != null) {
      if (rank <= 10) level = 'Platinum';
      else if (rank <= 50) level = 'Gold';
      else if (rank <= 100) level = 'Silver';
    }
    return {
      success: true,
      seasonName: activeSeason.name,
      rank,
      totalPts: Number(ranking.totalPts),
      winRate: Number(ranking.winRate),
      level,
    };
  }

  @Get(':id/profit-curve')
  @ApiOperation({ summary: '获取用户收益曲线（按日汇总 PnL）' })
  async getProfitCurve(
    @Param('id') id: string,
    @Query('days') days: string = '30',
  ) {
    const dayCount = Math.min(parseInt(days, 10) || 30, 90);
    const since = new Date();
    since.setDate(since.getDate() - dayCount);
    since.setHours(0, 0, 0, 0);

    const [bets, positions] = await Promise.all([
      this.prisma.bet.findMany({
        where: { userId: id, status: 'SETTLED', timestamp: { gte: since } },
        select: { timestamp: true, amount: true, result: true, payout: true },
      }),
      this.prisma.position.findMany({
        where: {
          userId: id,
          status: { in: ['CLOSED', 'SETTLED'] },
        },
        select: { closedAt: true, settledAt: true, realizedPnL: true },
      }),
    ]);

    const dailyPnL: Record<string, number> = {};
    const toDateKey = (d: Date) => d.toISOString().slice(0, 10);

    for (const b of bets) {
      const dateKey = toDateKey(b.timestamp);
      if (!dailyPnL[dateKey]) dailyPnL[dateKey] = 0;
      if (b.result === 'WIN') dailyPnL[dateKey] += Number(b.payout ?? 0) - Number(b.amount);
      else dailyPnL[dateKey] -= Number(b.amount);
    }
    for (const p of positions) {
      const at = p.closedAt ?? p.settledAt;
      if (!at || at < since) continue;
      const dateKey = toDateKey(at);
      if (!dailyPnL[dateKey]) dailyPnL[dateKey] = 0;
      dailyPnL[dateKey] += Number(p.realizedPnL ?? 0);
    }

    const sortedDates = Object.keys(dailyPnL).sort();
    let cumulative = 0;
    const curve = sortedDates.map((date) => {
      cumulative += dailyPnL[date];
      return { date, pnl: dailyPnL[date], cumulativePnl: cumulative };
    });

    return { success: true, curve };
  }

  @Put(':id/username')
  @ApiOperation({ summary: '更新用户名' })
  @ApiBody({ schema: { type: 'object', properties: { username: { type: 'string' } } } })
  async updateUsername(
    @Param('id') id: string,
    @Body() body: { username: string }
  ) {
    if (!body.username || body.username.trim().length < 2) {
      throw new BadRequestException('Username must be at least 2 characters');
    }
    if (body.username.length > 20) {
      throw new BadRequestException('Username must be at most 20 characters');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { username: body.username.trim() }
    });

    // 📣 实时同步到管理后台
    this.eventsGateway.emitUserProfileUpdate(id, {
      username: updated.username,
      address: updated.address,
    });

    // 🔧 触发任务进度：修改用户名
    await this.questService.updateProgress(id, 'UPDATE_USERNAME');

    return { success: true, username: updated.username };
  }

  @Get(':id/profile')
  @ApiOperation({ summary: '获取用户资料及余额' })
  async getProfile(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { id },
      include: { 
        team: true,
        _count: {
          select: {
            battles: true
          }
        }
      }
    });
    if (!user) {
      return this.prisma.user.upsert({
        where: { id },
        update: {},
        create: { id, address: `0x${Math.random().toString(16).slice(2, 10)}`, pts: 1000 }
      });
    }
    
    // 自动同步对战统计数据（解决历史数据不一致问题）
    const actualWins = await this.prisma.battle.count({
      where: { userId: id, winner: 'USER' }
    });
    const actualBattles = user._count.battles;
    
    // 如果数据不一致，自动修复
    if (user.totalWins !== actualWins || user.totalBattles !== actualBattles) {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          totalWins: actualWins,
          totalBattles: actualBattles
        },
        include: { team: true }
      });
      return {
        ...updatedUser,
        totalWins: actualWins,
        totalBattles: actualBattles
      };
    }
    
    return {
      ...user,
      totalWins: actualWins,
      totalBattles: actualBattles
    };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: '获取全球排行榜 (带权重算法，合并 Bet + Battle 胜率)' })
  async getLeaderboard() {
    const users = await this.prisma.user.findMany({
      take: 50,
      select: {
        id: true,
        address: true,
        username: true,
        pts: true,
        totalWins: true,     // AI 对战胜场
        totalBattles: true,  // AI 对战总场次
        _count: {
          select: {
            bets: true,
          }
        }
      },
      orderBy: { pts: 'desc' }
    });

    // 为前 50 名用户计算权重分 (Score = PTS * (1 + WinRate))
    // 合并 Bet 胜率 + Battle 胜率
    const leaderboard = await Promise.all(users.map(async (user) => {
      // Bet 胜场
      const betWins = await this.prisma.bet.count({
        where: { userId: user.id, result: 'WIN' }
      });
      const totalBets = user._count.bets;
      
      // Battle 胜场 (已在 User 模型中统计)
      const battleWins = user.totalWins || 0;
      const totalBattles = user.totalBattles || 0;
      
      // 合并计算总胜率
      const totalWins = betWins + battleWins;
      const totalGames = totalBets + totalBattles;
      const winRate = totalGames > 0 ? totalWins / totalGames : 0;
      
      return {
        id: user.id,
        address: user.address,
        username: user.username,
        pts: user.pts,
        winRate: (winRate * 100).toFixed(1) + '%',
        // 权重分：资产 * (1 + 胜率)
        score: Math.floor(user.pts * (1 + winRate)),
        totalGames,
        betWins,
        battleWins
      };
    }));

    // 重新根据 Score 排序
    return leaderboard.sort((a, b) => b.score - a.score).slice(0, 20);
  }
}
