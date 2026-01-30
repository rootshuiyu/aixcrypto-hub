import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EsportsMatchDto } from '../esports.service';

/**
 * Riot Games API 服务
 * 用于获取 LOL 电竞比赛数据
 * 
 * 注意：Riot 的电竞数据需要使用 LoL Esports API
 * 官方 API: https://lolesports.com/
 * 开发者门户: https://developer.riotgames.com/
 */
@Injectable()
export class RiotService {
  private readonly logger = new Logger(RiotService.name);
  
  // LoL Esports API 基础 URL
  private readonly ESPORTS_API = 'https://esports-api.lolesports.com/persisted/gw';
  private readonly API_KEY = process.env.RIOT_API_KEY || '';
  
  // LPL 热门队伍数据
  private readonly LPL_TEAMS = [
    { id: 'blg', name: 'Bilibili Gaming', shortName: 'BLG', logo: '🦁' },
    { id: 'jdg', name: 'JD Gaming', shortName: 'JDG', logo: '🐉' },
    { id: 't1', name: 'T1', shortName: 'T1', logo: '⚡' },
    { id: 'geng', name: 'Gen.G', shortName: 'GEN', logo: '🐯' },
    { id: 'edg', name: 'EDward Gaming', shortName: 'EDG', logo: '🦅' },
    { id: 'tes', name: 'Top Esports', shortName: 'TES', logo: '🔥' },
    { id: 'weibo', name: 'Weibo Gaming', shortName: 'WBG', logo: '🐺' },
    { id: 'lng', name: 'LNG Esports', shortName: 'LNG', logo: '🐍' },
  ];

  private readonly LEAGUES = [
    { id: 'lpl', name: 'LPL', region: 'CN', tournament: 'LPL Spring 2026' },
    { id: 'lck', name: 'LCK', region: 'KR', tournament: 'LCK Spring 2026' },
    { id: 'lec', name: 'LEC', region: 'EU', tournament: 'LEC Winter 2026' },
    { id: 'worlds', name: 'World Championship', region: 'GLOBAL', tournament: 'Worlds 2026' },
  ];

  constructor(private httpService: HttpService) {}

  /**
   * 获取实时和即将开始的比赛
   * 如果有 API Key 则从官方 API 获取，否则使用模拟数据
   */
  async getLiveAndUpcomingMatches(): Promise<EsportsMatchDto[]> {
    if (this.API_KEY) {
      try {
        return await this.fetchFromRiotAPI();
      } catch (error) {
        this.logger.warn('Failed to fetch from Riot API, using simulated data', error);
        return this.generateSimulatedMatches();
      }
    }
    
    // 无 API Key，使用模拟数据
    return this.generateSimulatedMatches();
  }

  /**
   * 从 Riot 官方 API 获取数据
   */
  private async fetchFromRiotAPI(): Promise<EsportsMatchDto[]> {
    const headers = {
      'x-api-key': this.API_KEY,
    };

    try {
      // 获取赛程
      const response = await firstValueFrom(
        this.httpService.get(`${this.ESPORTS_API}/getSchedule`, {
          headers,
          params: {
            hl: 'en-US',
          },
        }),
      );

      const schedule = response.data?.data?.schedule?.events || [];
      
      return schedule.map((event: any) => this.mapRiotEventToMatch(event));
    } catch (error) {
      this.logger.error('Riot API error', error);
      throw error;
    }
  }

  /**
   * 将 Riot API 事件映射为统一格式
   */
  private mapRiotEventToMatch(event: any): EsportsMatchDto {
    const match = event.match;
    const teams = match?.teams || [];
    
    return {
      id: `riot_${event.id}`,
      game: 'LOL',
      league: event.league?.name || 'Unknown',
      tournament: event.blockName || undefined,
      homeTeam: {
        id: `riot_team_${teams[0]?.code || 'unknown'}`,
        name: teams[0]?.name || 'Team A',
        shortName: teams[0]?.code,
        logo: teams[0]?.image || undefined,
      },
      awayTeam: {
        id: `riot_team_${teams[1]?.code || 'unknown'}`,
        name: teams[1]?.name || 'Team B',
        shortName: teams[1]?.code,
        logo: teams[1]?.image || undefined,
      },
      bestOf: match?.strategy?.count || 1,
      scheduledAt: new Date(event.startTime),
      status: this.mapRiotStatus(event.state),
      homeScore: teams[0]?.result?.gameWins || 0,
      awayScore: teams[1]?.result?.gameWins || 0,
      homeOdds: this.calculateOdds(0.5), // Riot 不提供赔率，使用模拟
      awayOdds: this.calculateOdds(0.5),
      streamUrl: event.streams?.[0]?.provider === 'twitch' 
        ? `https://twitch.tv/${event.streams[0].parameter}` 
        : undefined,
    };
  }

  /**
   * 映射 Riot 比赛状态
   */
  private mapRiotStatus(state: string): 'UPCOMING' | 'LIVE' | 'FINISHED' {
    switch (state) {
      case 'inProgress':
        return 'LIVE';
      case 'completed':
        return 'FINISHED';
      default:
        return 'UPCOMING';
    }
  }

  /**
   * 生成模拟的 LOL 比赛数据
   */
  private generateSimulatedMatches(): EsportsMatchDto[] {
    const matches: EsportsMatchDto[] = [];
    const now = new Date();
    
    // 生成 3-5 场比赛
    const matchCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < matchCount; i++) {
      const league = this.LEAGUES[Math.floor(Math.random() * this.LEAGUES.length)];
      const shuffledTeams = [...this.LPL_TEAMS].sort(() => Math.random() - 0.5);
      const homeTeam = shuffledTeams[0];
      const awayTeam = shuffledTeams[1];
      
      // 决定比赛状态
      let status: 'UPCOMING' | 'LIVE' | 'FINISHED' = 'UPCOMING';
      let scheduledAt = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000); // 每小时一场
      let homeScore = 0;
      let awayScore = 0;
      
      if (i === 0 && Math.random() > 0.3) {
        // 第一场有 70% 概率是直播中
        status = 'LIVE';
        scheduledAt = new Date(now.getTime() - 30 * 60 * 1000); // 30分钟前开始
        homeScore = Math.floor(Math.random() * 2);
        awayScore = Math.floor(Math.random() * 2);
      }
      
      const bestOf = [1, 3, 5][Math.floor(Math.random() * 3)];
      const homeWinProb = 0.3 + Math.random() * 0.4; // 30%-70%
      
      matches.push({
        id: `lol_sim_${Date.now()}_${i}`,
        game: 'LOL',
        league: league.name,
        tournament: league.tournament,
        homeTeam: {
          id: `lol_${homeTeam.id}`,
          name: homeTeam.name,
          shortName: homeTeam.shortName,
          logo: homeTeam.logo,
        },
        awayTeam: {
          id: `lol_${awayTeam.id}`,
          name: awayTeam.name,
          shortName: awayTeam.shortName,
          logo: awayTeam.logo,
        },
        bestOf,
        scheduledAt,
        status,
        homeScore,
        awayScore,
        homeOdds: this.calculateOdds(homeWinProb),
        awayOdds: this.calculateOdds(1 - homeWinProb),
        streamUrl: status === 'LIVE' ? 'https://twitch.tv/lpl' : undefined,
      });
    }
    
    return matches;
  }

  /**
   * 根据胜率计算赔率
   */
  private calculateOdds(winProbability: number): number {
    // 赔率 = 1 / 胜率，加上 5% 抽水
    const baseOdds = 1 / winProbability;
    const margin = 0.95; // 95% 返还率
    return Math.round(baseOdds * margin * 100) / 100;
  }
}
