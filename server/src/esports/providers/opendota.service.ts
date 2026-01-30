import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EsportsMatchDto } from '../esports.service';

/**
 * OpenDota API 服务
 * 用于获取 DOTA2 电竞比赛数据
 * 
 * API 文档: https://docs.opendota.com/
 * 免费使用，有频率限制
 */
@Injectable()
export class OpenDotaService {
  private readonly logger = new Logger(OpenDotaService.name);
  
  // OpenDota API 基础 URL
  private readonly API_BASE = 'https://api.opendota.com/api';
  
  // DOTA2 热门队伍数据
  private readonly PRO_TEAMS = [
    { id: 'og', name: 'OG', shortName: 'OG', logo: '🐂', region: 'EU' },
    { id: 'spirit', name: 'Team Spirit', shortName: 'Spirit', logo: '🦅', region: 'CIS' },
    { id: 'lgd', name: 'PSG.LGD', shortName: 'LGD', logo: '🐉', region: 'CN' },
    { id: 'aster', name: 'Team Aster', shortName: 'Aster', logo: '⭐', region: 'CN' },
    { id: 'eg', name: 'Evil Geniuses', shortName: 'EG', logo: '👹', region: 'NA' },
    { id: 'liquid', name: 'Team Liquid', shortName: 'Liquid', logo: '💧', region: 'EU' },
    { id: 'secret', name: 'Team Secret', shortName: 'Secret', logo: '🔮', region: 'EU' },
    { id: 'gaimin', name: 'Gaimin Gladiators', shortName: 'GG', logo: '⚔️', region: 'EU' },
  ];

  private readonly TOURNAMENTS = [
    { id: 'ti', name: 'The International', shortName: 'TI' },
    { id: 'major', name: 'DPC Major', shortName: 'Major' },
    { id: 'esl', name: 'ESL One', shortName: 'ESL' },
    { id: 'dpc', name: 'DPC League', shortName: 'DPC' },
  ];

  constructor(private httpService: HttpService) {}

  /**
   * 获取实时和即将开始的比赛
   */
  async getLiveAndUpcomingMatches(): Promise<EsportsMatchDto[]> {
    try {
      // 尝试获取职业比赛
      const liveMatches = await this.fetchLiveMatches();
      const upcomingMatches = this.generateUpcomingMatches();
      
      return [...liveMatches, ...upcomingMatches];
    } catch (error) {
      this.logger.warn('Failed to fetch from OpenDota, using simulated data', error);
      return this.generateSimulatedMatches();
    }
  }

  /**
   * 从 OpenDota API 获取实时比赛
   */
  private async fetchLiveMatches(): Promise<EsportsMatchDto[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.API_BASE}/live`, {
          timeout: 5000,
        }),
      );

      const liveGames = response.data || [];
      
      // 只取职业比赛（有 league_id）
      const proMatches = liveGames
        .filter((game: any) => game.league_id && game.radiant_team && game.dire_team)
        .slice(0, 5);
      
      return proMatches.map((game: any) => this.mapOpenDotaGameToMatch(game));
    } catch (error) {
      this.logger.debug('OpenDota live API unavailable, using simulated data');
      return [];
    }
  }

  /**
   * 将 OpenDota 比赛映射为统一格式
   */
  private mapOpenDotaGameToMatch(game: any): EsportsMatchDto {
    const radiantTeam = game.radiant_team || {};
    const direTeam = game.dire_team || {};
    
    // 根据当前比分估算胜率
    const radiantScore = game.radiant_score || 0;
    const direScore = game.dire_score || 0;
    const totalKills = radiantScore + direScore || 1;
    const radiantWinProb = 0.4 + (radiantScore / totalKills) * 0.2;
    
    return {
      id: `dota2_${game.match_id}`,
      game: 'DOTA2',
      league: game.league?.name || 'Pro Match',
      tournament: game.league?.tier === 'premium' ? 'TI / Major' : 'DPC League',
      homeTeam: {
        id: `dota2_team_${radiantTeam.team_id || 'radiant'}`,
        name: radiantTeam.name || 'Radiant',
        shortName: radiantTeam.tag || 'RAD',
        logo: radiantTeam.logo_url || '🟢',
      },
      awayTeam: {
        id: `dota2_team_${direTeam.team_id || 'dire'}`,
        name: direTeam.name || 'Dire',
        shortName: direTeam.tag || 'DIR',
        logo: direTeam.logo_url || '🔴',
      },
      bestOf: game.series_type === 1 ? 3 : game.series_type === 2 ? 5 : 1,
      scheduledAt: new Date(game.game_start * 1000 || Date.now()),
      status: 'LIVE',
      homeScore: game.radiant_series_wins || 0,
      awayScore: game.dire_series_wins || 0,
      homeOdds: this.calculateOdds(radiantWinProb),
      awayOdds: this.calculateOdds(1 - radiantWinProb),
      streamUrl: `https://twitch.tv/dota2`,
    };
  }

  /**
   * 生成即将开始的比赛（模拟）
   */
  private generateUpcomingMatches(): EsportsMatchDto[] {
    const matches: EsportsMatchDto[] = [];
    const now = new Date();
    
    // 生成 2-3 场即将开始的比赛
    const matchCount = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < matchCount; i++) {
      const tournament = this.TOURNAMENTS[Math.floor(Math.random() * this.TOURNAMENTS.length)];
      const shuffledTeams = [...this.PRO_TEAMS].sort(() => Math.random() - 0.5);
      const homeTeam = shuffledTeams[0];
      const awayTeam = shuffledTeams[1];
      
      const scheduledAt = new Date(now.getTime() + (30 + i * 90) * 60 * 1000); // 30分钟后开始
      const bestOf = [1, 3, 5][Math.floor(Math.random() * 3)];
      const homeWinProb = 0.35 + Math.random() * 0.3;
      
      matches.push({
        id: `dota2_upcoming_${Date.now()}_${i}`,
        game: 'DOTA2',
        league: tournament.name,
        tournament: `${tournament.shortName} 2026`,
        homeTeam: {
          id: `dota2_${homeTeam.id}`,
          name: homeTeam.name,
          shortName: homeTeam.shortName,
          logo: homeTeam.logo,
        },
        awayTeam: {
          id: `dota2_${awayTeam.id}`,
          name: awayTeam.name,
          shortName: awayTeam.shortName,
          logo: awayTeam.logo,
        },
        bestOf,
        scheduledAt,
        status: 'UPCOMING',
        homeScore: 0,
        awayScore: 0,
        homeOdds: this.calculateOdds(homeWinProb),
        awayOdds: this.calculateOdds(1 - homeWinProb),
      });
    }
    
    return matches;
  }

  /**
   * 完全模拟的比赛数据
   */
  private generateSimulatedMatches(): EsportsMatchDto[] {
    const matches: EsportsMatchDto[] = [];
    const now = new Date();
    
    // 生成 3-4 场比赛
    const matchCount = 3 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < matchCount; i++) {
      const tournament = this.TOURNAMENTS[Math.floor(Math.random() * this.TOURNAMENTS.length)];
      const shuffledTeams = [...this.PRO_TEAMS].sort(() => Math.random() - 0.5);
      const homeTeam = shuffledTeams[0];
      const awayTeam = shuffledTeams[1];
      
      // 第一场可能是 LIVE
      let status: 'UPCOMING' | 'LIVE' = 'UPCOMING';
      let scheduledAt = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000);
      let homeScore = 0;
      let awayScore = 0;
      
      if (i === 0 && Math.random() > 0.4) {
        status = 'LIVE';
        scheduledAt = new Date(now.getTime() - 45 * 60 * 1000);
        homeScore = Math.floor(Math.random() * 2);
        awayScore = Math.floor(Math.random() * 2);
      }
      
      const bestOf = [1, 3, 5][Math.floor(Math.random() * 3)];
      const homeWinProb = 0.35 + Math.random() * 0.3;
      
      matches.push({
        id: `dota2_sim_${Date.now()}_${i}`,
        game: 'DOTA2',
        league: tournament.name,
        tournament: `${tournament.shortName} 2026`,
        homeTeam: {
          id: `dota2_${homeTeam.id}`,
          name: homeTeam.name,
          shortName: homeTeam.shortName,
          logo: homeTeam.logo,
        },
        awayTeam: {
          id: `dota2_${awayTeam.id}`,
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
        streamUrl: status === 'LIVE' ? 'https://twitch.tv/dota2ti' : undefined,
      });
    }
    
    return matches;
  }

  /**
   * 根据胜率计算赔率
   */
  private calculateOdds(winProbability: number): number {
    const baseOdds = 1 / winProbability;
    const margin = 0.95;
    return Math.round(baseOdds * margin * 100) / 100;
  }
}
