import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma.service';
import { QuestService } from '../quest/quest.service';
import { EventsGateway } from '../events/events.gateway';
import { BadRequestException } from '@nestjs/common';

// API-Football 响应类型
interface APIFootballFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
    venue: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

interface APIFootballOdds {
  league: { id: number; name: string };
  fixture: { id: number; date: string };
  bookmakers: Array<{
    id: number;
    name: string;
    bets: Array<{
      id: number;
      name: string;
      values: Array<{
        value: string;
        odd: string;
      }>;
    }>;
  }>;
}

export interface FootballMatch {
  id: string;
  fixtureId: number;
  league: string;
  leagueLogo: string;
  leagueCountry: string;
  round: string;
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  scheduledAt: Date;
  status: 'UPCOMING' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  elapsed: number | null;
  homeScore: number;
  awayScore: number;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  venue: string | null;
  tvChannels?: { name: string }[];
}

@Injectable()
export class FootballService implements OnModuleInit {
  private readonly logger = new Logger(FootballService.name);
  private readonly baseUrl = 'https://api-football-v1.p.rapidapi.com/v3';
  private readonly apiKey: string;
  private readonly apiHost: string;
  private readonly sportDevsKey: string;
  private readonly sportDevsUrl = 'https://esports.sportdevs.com/matches-tv-channels';

  // 热门联赛 ID（英超、西甲、德甲、意甲、法甲、欧冠、中超）
  private readonly popularLeagues = [39, 140, 78, 135, 61, 2, 169];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly questService: QuestService,
    private readonly eventsGateway: EventsGateway,
  ) {
    this.apiKey = this.configService.get<string>('RAPIDAPI_KEY') || '';
    this.apiHost = this.configService.get<string>('RAPIDAPI_HOST') || 'api-football-v1.p.rapidapi.com';
    this.sportDevsKey = this.configService.get<string>('SPORTDEVS_API_KEY') || '';
    
    if (!this.apiKey) {
      this.logger.warn('RapidAPI key not configured for API-Football');
    }
  }

  async onModuleInit() {
    // 启动时同步比赛数据
    if (this.apiKey) {
      this.logger.log('Initializing football matches sync...');
      await this.syncMatches();
    }
  }

  /**
   * 每5分钟同步比赛数据
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncMatches() {
    if (!this.apiKey) {
      this.logger.warn('No RapidAPI key, skipping football sync');
      return;
    }

    this.logger.log('Syncing football matches...');
    
    try {
      // 获取今天和明天的比赛
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // 获取今天的比赛
      const todayMatches = await this.getFixturesByDate(todayStr);
      // 获取明天的比赛
      const tomorrowMatches = await this.getFixturesByDate(tomorrowStr);

      const allMatches = [...todayMatches, ...tomorrowMatches];
      this.logger.log(`Fetched ${allMatches.length} football matches`);

      // 保存到数据库
      for (const match of allMatches) {
        await this.upsertMatch(match);
      }

      this.logger.log('Football matches synced successfully');
    } catch (error: any) {
      this.logger.error(`Failed to sync football matches: ${error.message}`);
    }
  }

  /**
   * 根据日期获取比赛
   */
  private async getFixturesByDate(date: string): Promise<FootballMatch[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ response: APIFootballFixture[] }>(`${this.baseUrl}/fixtures`, {
          headers: {
            'x-rapidapi-key': this.apiKey,
            'x-rapidapi-host': this.apiHost,
          },
          params: {
            date,
            // 只获取热门联赛
            // league: this.popularLeagues.join('-'), // API 不支持多联赛，需要分开查
          },
        }),
      );

      const fixtures = response.data.response || [];
      
      // 过滤热门联赛
      const filteredFixtures = fixtures.filter(f => 
        this.popularLeagues.includes(f.league.id)
      );

      const transforms = filteredFixtures.map(f => this.transformFixture(f));
      const decorated = await Promise.all(
        transforms.map(async match => ({
          ...match,
          tvChannels: await this.getTvChannelsByFixture(match.fixtureId),
        }))
      );
      return decorated;
    } catch (error: any) {
      this.logger.error(`Failed to fetch fixtures for ${date}: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取正在进行的比赛
   */
  async getLiveMatches(): Promise<FootballMatch[]> {
    if (!this.apiKey) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get<{ response: APIFootballFixture[] }>(`${this.baseUrl}/fixtures`, {
          headers: {
            'x-rapidapi-key': this.apiKey,
            'x-rapidapi-host': this.apiHost,
          },
          params: {
            live: 'all',
          },
        }),
      );

      const fixtures = response.data.response || [];
      const filteredFixtures = fixtures.filter(f => 
        this.popularLeagues.includes(f.league.id)
      );

      return filteredFixtures.map(f => this.transformFixture(f));
    } catch (error: any) {
      this.logger.error(`Failed to fetch live matches: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取比赛赔率
   */
  async getOdds(fixtureId: number): Promise<{ home: number; draw: number; away: number } | null> {
    if (!this.apiKey) return null;

    try {
      const response = await firstValueFrom(
        this.httpService.get<{ response: APIFootballOdds[] }>(`${this.baseUrl}/odds`, {
          headers: {
            'x-rapidapi-key': this.apiKey,
            'x-rapidapi-host': this.apiHost,
          },
          params: {
            fixture: fixtureId,
          },
        }),
      );

      const oddsData = response.data.response?.[0];
      if (!oddsData) return null;

      // 找到 Match Winner 赔率
      const bookmaker = oddsData.bookmakers?.[0];
      const matchWinner = bookmaker?.bets?.find(b => b.name === 'Match Winner');
      
      if (!matchWinner) return null;

      const homeOdd = matchWinner.values.find(v => v.value === 'Home')?.odd;
      const drawOdd = matchWinner.values.find(v => v.value === 'Draw')?.odd;
      const awayOdd = matchWinner.values.find(v => v.value === 'Away')?.odd;

      return {
        home: parseFloat(homeOdd || '2.0'),
        draw: parseFloat(drawOdd || '3.0'),
        away: parseFloat(awayOdd || '2.0'),
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch odds for fixture ${fixtureId}: ${error.message}`);
      return null;
    }
  }

  private async getTvChannelsByFixture(fixtureId: number): Promise<{ name: string }[]> {
    if (!this.sportDevsKey) return [];
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ match_id: number; tv_channels: Array<{ name: string }> }[]>(this.sportDevsUrl, {
          headers: {
            Authorization: `Bearer ${this.sportDevsKey}`,
          },
          params: {
            match_id: `eq.${fixtureId}`,
            lang: 'en',
            limit: 5,
          },
        }),
      );
      const rows = response.data || [];
      if (!rows.length) return [];
      return rows.flatMap(row => row.tv_channels || []).map(channel => ({ name: channel.name }));
    } catch (error: any) {
      this.logger.error(`Failed to fetch TV channels for fixture ${fixtureId}: ${error.message}`);
      return [];
    }
  }

  /**
   * 转换 API 数据格式
   */
  private transformFixture(fixture: APIFootballFixture): FootballMatch {
    // 转换状态
    let status: FootballMatch['status'];
    const statusShort = fixture.fixture.status.short;
    
    switch (statusShort) {
      case 'NS': // Not Started
      case 'TBD': // Time To Be Defined
        status = 'UPCOMING';
        break;
      case '1H': // First Half
      case '2H': // Second Half
      case 'ET': // Extra Time
      case 'P': // Penalty
      case 'LIVE':
        status = 'LIVE';
        break;
      case 'HT': // Halftime
        status = 'HALFTIME';
        break;
      case 'FT': // Full Time
      case 'AET': // After Extra Time
      case 'PEN': // Penalty Shootout
        status = 'FINISHED';
        break;
      case 'PST': // Postponed
        status = 'POSTPONED';
        break;
      case 'CANC': // Cancelled
      case 'ABD': // Abandoned
      case 'AWD': // Awarded
      case 'WO': // Walkover
        status = 'CANCELLED';
        break;
      default:
        status = 'UPCOMING';
    }

    // 生成模拟赔率（如果没有真实赔率）
    const baseOdds = 2.0;
    const variance = Math.random() * 0.8 - 0.4;

    return {
      id: `football-${fixture.fixture.id}`,
      fixtureId: fixture.fixture.id,
      league: fixture.league.name,
      leagueLogo: fixture.league.logo,
      leagueCountry: fixture.league.country,
      round: fixture.league.round,
      homeTeam: {
        id: fixture.teams.home.id,
        name: fixture.teams.home.name,
        logo: fixture.teams.home.logo,
      },
      awayTeam: {
        id: fixture.teams.away.id,
        name: fixture.teams.away.name,
        logo: fixture.teams.away.logo,
      },
      scheduledAt: new Date(fixture.fixture.date),
      status,
      elapsed: fixture.fixture.status.elapsed,
      homeScore: fixture.goals.home || 0,
      awayScore: fixture.goals.away || 0,
      homeOdds: Math.round((baseOdds + variance) * 100) / 100,
      drawOdds: Math.round((3.2 + variance * 0.5) * 100) / 100,
      awayOdds: Math.round((baseOdds - variance + 0.1) * 100) / 100,
      venue: fixture.fixture.venue?.name || null,
    };
  }

  /**
   * 保存/更新比赛到数据库
   */
  private async upsertMatch(match: FootballMatch) {
    try {
      await this.prisma.footballMatch.upsert({
        where: { id: match.id },
        create: {
          id: match.id,
          fixtureId: match.fixtureId,
          league: match.league,
          leagueLogo: match.leagueLogo,
          leagueCountry: match.leagueCountry,
          round: match.round,
          homeTeamId: match.homeTeam.id,
          homeTeamName: match.homeTeam.name,
          homeTeamLogo: match.homeTeam.logo,
          awayTeamId: match.awayTeam.id,
          awayTeamName: match.awayTeam.name,
          awayTeamLogo: match.awayTeam.logo,
          scheduledAt: match.scheduledAt,
          status: match.status,
          elapsed: match.elapsed,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          homeOdds: match.homeOdds,
          drawOdds: match.drawOdds,
          awayOdds: match.awayOdds,
          venue: match.venue,
          tvChannels: match.tvChannels,
        },
        update: {
          status: match.status,
          elapsed: match.elapsed,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          homeOdds: match.homeOdds,
          drawOdds: match.drawOdds,
          awayOdds: match.awayOdds,
          tvChannels: match.tvChannels,
        },
      });
    } catch (error: any) {
      // 如果表不存在，使用内存缓存
      this.logger.debug(`Database upsert skipped: ${error.message}`);
    }
  }

  /**
   * 生成模拟比赛数据（当 API 不可用时使用）
   */
  private generateMockMatches(): FootballMatch[] {
    const now = new Date();
    const leagues = this.getPopularLeagues();
    
    const teams = [
      // 英超
      { id: 33, name: 'Manchester United', logo: 'https://media.api-sports.io/football/teams/33.png' },
      { id: 34, name: 'Newcastle', logo: 'https://media.api-sports.io/football/teams/34.png' },
      { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
      { id: 42, name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
      { id: 49, name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png' },
      { id: 50, name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
      // 西甲
      { id: 529, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
      { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
      { id: 530, name: 'Atletico Madrid', logo: 'https://media.api-sports.io/football/teams/530.png' },
      // 德甲
      { id: 157, name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
      { id: 165, name: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png' },
      // 意甲
      { id: 489, name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png' },
      { id: 505, name: 'Inter', logo: 'https://media.api-sports.io/football/teams/505.png' },
      { id: 496, name: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png' },
      // 法甲
      { id: 85, name: 'Paris Saint Germain', logo: 'https://media.api-sports.io/football/teams/85.png' },
      { id: 91, name: 'Monaco', logo: 'https://media.api-sports.io/football/teams/91.png' },
    ];

    const mockMatches: FootballMatch[] = [];
    let fixtureId = 1000000;

    // 生成一场正在进行的比赛
    const liveLeague = leagues[0]; // 英超
    mockMatches.push({
      id: `football-mock-${fixtureId}`,
      fixtureId: fixtureId++,
      league: liveLeague.name,
      leagueLogo: liveLeague.logo,
      leagueCountry: liveLeague.country,
      round: 'Round 22',
      homeTeam: teams[0], // Manchester United
      awayTeam: teams[1], // Newcastle
      scheduledAt: new Date(now.getTime() - 45 * 60 * 1000), // 45 分钟前开始
      status: 'LIVE',
      elapsed: 52,
      homeScore: 1,
      awayScore: 1,
      homeOdds: 2.10,
      drawOdds: 3.25,
      awayOdds: 3.50,
      venue: 'Old Trafford',
    });

    // 生成即将开始的比赛
    const upcomingMatches = [
      { home: teams[2], away: teams[3], league: leagues[0], hours: 2, venue: 'Anfield' },
      { home: teams[4], away: teams[5], league: leagues[0], hours: 4, venue: 'Stamford Bridge' },
      { home: teams[6], away: teams[7], league: leagues[1], hours: 3, venue: 'Camp Nou' },
      { home: teams[8], away: teams[9], league: leagues[1], hours: 5, venue: 'Wanda Metropolitano' },
      { home: teams[10], away: teams[11], league: leagues[2], hours: 6, venue: 'Allianz Arena' },
      { home: teams[12], away: teams[13], league: leagues[3], hours: 7, venue: 'San Siro' },
      { home: teams[14], away: teams[15], league: leagues[4], hours: 8, venue: 'Parc des Princes' },
    ];

    for (const match of upcomingMatches) {
      const variance = Math.random() * 0.6 - 0.3;
      mockMatches.push({
        id: `football-mock-${fixtureId}`,
        fixtureId: fixtureId++,
        league: match.league.name,
        leagueLogo: match.league.logo,
        leagueCountry: match.league.country,
        round: 'Round 22',
        homeTeam: match.home,
        awayTeam: match.away,
        scheduledAt: new Date(now.getTime() + match.hours * 60 * 60 * 1000),
        status: 'UPCOMING',
        elapsed: null,
        homeScore: 0,
        awayScore: 0,
        homeOdds: Math.round((2.0 + variance) * 100) / 100,
        drawOdds: Math.round((3.2 + variance * 0.5) * 100) / 100,
        awayOdds: Math.round((2.1 - variance) * 100) / 100,
        venue: match.venue,
        tvChannels: [],
      });
    }

    this.logger.log(`Generated ${mockMatches.length} mock football matches (API unavailable)`);
    return mockMatches;
  }

  /**
   * 获取所有比赛（从 API 或缓存）
   */
  async getMatches(options?: {
    league?: number;
    status?: string;
    limit?: number;
  }): Promise<FootballMatch[]> {
    const { league, status, limit = 20 } = options || {};

    // 尝试从数据库获取
    try {
      const matches = await this.prisma.footballMatch.findMany({
        where: {
          ...(league && { leagueId: league }),
          ...(status && { status }),
        },
        orderBy: [
          { status: 'asc' }, // LIVE 优先
          { scheduledAt: 'asc' },
        ],
        take: limit,
      });

      if (matches.length > 0) {
        return matches.map(m => ({
          id: m.id,
          fixtureId: m.fixtureId,
          league: m.league,
          leagueLogo: m.leagueLogo || '',
          leagueCountry: m.leagueCountry || '',
          round: m.round || '',
          homeTeam: {
            id: m.homeTeamId,
            name: m.homeTeamName,
            logo: m.homeTeamLogo || '',
          },
          awayTeam: {
            id: m.awayTeamId,
            name: m.awayTeamName,
            logo: m.awayTeamLogo || '',
          },
          scheduledAt: m.scheduledAt,
          status: m.status as FootballMatch['status'],
          elapsed: m.elapsed,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          homeOdds: m.homeOdds,
          drawOdds: m.drawOdds,
          awayOdds: m.awayOdds,
          venue: m.venue,
          tvChannels: (m.tvChannels as { name: string }[]) || [],
        }));
      }
    } catch (error) {
      // 数据库不可用，继续从 API 获取
    }

    // 从 API 获取
    const today = new Date().toISOString().split('T')[0];
    let matches = await this.getFixturesByDate(today);
    
    // 如果 API 也没有数据，使用模拟数据
    if (matches.length === 0) {
      matches = this.generateMockMatches();
    }
    
    // 按联赛筛选
    if (league) {
      matches = matches.filter(m => {
        const leagueInfo = this.getPopularLeagues().find(l => l.name === m.league);
        return leagueInfo?.id === league;
      });
    }
    
    return matches.slice(0, limit);
  }

  /**
   * 获取热门比赛
   */
  async getHotMatches(limit = 5): Promise<FootballMatch[]> {
    const matches = await this.getMatches({ limit: 50 });
    
    // 优先显示 LIVE 和即将开始的比赛
    const sorted = matches.sort((a, b) => {
      if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
      if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });

    return sorted.slice(0, limit);
  }

  /**
   * 获取联赛列表
   */
  getPopularLeagues() {
    return [
      { id: 39, name: '英超', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png' },
      { id: 140, name: '西甲', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png' },
      { id: 78, name: '德甲', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png' },
      { id: 135, name: '意甲', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png' },
      { id: 61, name: '法甲', country: 'France', logo: 'https://media.api-sports.io/football/leagues/61.png' },
      { id: 2, name: '欧冠', country: 'World', logo: 'https://media.api-sports.io/football/leagues/2.png' },
      { id: 169, name: '中超', country: 'China', logo: 'https://media.api-sports.io/football/leagues/169.png' },
    ];
  }

  /**
   * 足球下注逻辑
   */
  async placeBet(data: { userId: string; matchId: string; prediction: 'HOME' | 'DRAW' | 'AWAY'; amount: number }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. 获取用户和比赛
      const user = await tx.user.findUnique({ where: { id: data.userId } });
      const match = await tx.footballMatch.findUnique({ where: { id: data.matchId } });

      if (!user) throw new BadRequestException('User not found');
      if (!match) throw new BadRequestException('Match not found');
      if (user.pts < data.amount) throw new BadRequestException('Insufficient balance');
      if (match.status === 'FINISHED' || match.status === 'CANCELLED') {
        throw new BadRequestException('Match is already finished or cancelled');
      }

      // 2. 确定锁定赔率
      let odds = 1.0;
      if (data.prediction === 'HOME') odds = match.homeOdds;
      else if (data.prediction === 'DRAW') odds = match.drawOdds;
      else if (data.prediction === 'AWAY') odds = match.awayOdds;

      // 3. 扣除积分
      const updatedUser = await tx.user.update({
        where: { id: data.userId, version: user.version },
        data: { 
          pts: { decrement: data.amount },
          version: { increment: 1 }
        }
      });

      // 4. 创建订单
      const bet = await tx.footballBet.create({
        data: {
          userId: data.userId,
          matchId: data.matchId,
          prediction: data.prediction,
          amount: data.amount,
          odds: odds,
          status: 'PENDING',
        },
      });

      // 5. 更新比赛资金池
      const poolField = data.prediction === 'HOME' ? 'homeBetPool' : 
                        data.prediction === 'DRAW' ? 'drawBetPool' : 'awayBetPool';
      
      await tx.footballMatch.update({
        where: { id: data.matchId },
        data: { [poolField]: { increment: data.amount } }
      });

      // 6. 触发任务进度
      await this.questService.updateProgress(data.userId, 'PREDICTION');

      // 7. 发送余额更新通知
      this.eventsGateway.emitBalanceUpdate(data.userId, updatedUser.pts);

      this.logger.log(`[FOOTBALL_BET] User ${data.userId} bet ${data.amount} on ${data.prediction} for match ${data.matchId}`);

      return {
        success: true,
        betId: bet.id,
        amount: data.amount,
        prediction: data.prediction,
        odds: odds,
        newBalance: updatedUser.pts
      };
    });
  }
}
