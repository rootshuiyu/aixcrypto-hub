import { Injectable, Logger } from '@nestjs/common';
import { EsportsMatchDto } from '../esports.service';

/**
 * CS2 模拟数据服务
 * 由于没有免费的 CS2 API，使用模拟数据
 * 
 * 未来可接入：
 * - PandaScore (付费)
 * - HLTV API (非官方)
 * - Liquipedia API
 */
@Injectable()
export class CS2SimulatorService {
  private readonly logger = new Logger(CS2SimulatorService.name);
  
  // CS2 热门队伍
  private readonly PRO_TEAMS = [
    { id: 'navi', name: "Natus Vincere", shortName: 'NAVI', logo: '⚡', region: 'CIS', ranking: 1 },
    { id: 'faze', name: 'FaZe Clan', shortName: 'FaZe', logo: '🔥', region: 'EU', ranking: 2 },
    { id: 'g2', name: 'G2 Esports', shortName: 'G2', logo: '🎮', region: 'EU', ranking: 3 },
    { id: 'vitality', name: 'Team Vitality', shortName: 'VIT', logo: '🐝', region: 'EU', ranking: 4 },
    { id: 'spirit', name: 'Team Spirit', shortName: 'Spirit', logo: '👻', region: 'CIS', ranking: 5 },
    { id: 'heroic', name: 'Heroic', shortName: 'Heroic', logo: '🛡️', region: 'EU', ranking: 6 },
    { id: 'mouz', name: 'MOUZ', shortName: 'MOUZ', logo: '🖱️', region: 'EU', ranking: 7 },
    { id: 'astralis', name: 'Astralis', shortName: 'Astralis', logo: '⭐', region: 'EU', ranking: 8 },
    { id: 'cloud9', name: 'Cloud9', shortName: 'C9', logo: '☁️', region: 'NA', ranking: 9 },
    { id: 'liquid', name: 'Team Liquid', shortName: 'Liquid', logo: '💧', region: 'NA', ranking: 10 },
  ];

  private readonly TOURNAMENTS = [
    { id: 'major', name: 'CS2 Major', tier: 'S', prizePool: 1250000 },
    { id: 'blast', name: 'BLAST Premier', tier: 'S', prizePool: 500000 },
    { id: 'esl', name: 'ESL Pro League', tier: 'S', prizePool: 750000 },
    { id: 'iem', name: 'IEM Katowice', tier: 'S', prizePool: 1000000 },
    { id: 'rmr', name: 'RMR Tournament', tier: 'A', prizePool: 100000 },
  ];

  private readonly STAGES = [
    'Group Stage',
    'Playoffs',
    'Quarter-Finals',
    'Semi-Finals',
    'Grand Finals',
  ];

  // 缓存生成的比赛，避免每次刷新都变
  private cachedMatches: EsportsMatchDto[] = [];
  private lastCacheTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  constructor() {}

  /**
   * 生成 CS2 比赛数据
   */
  async generateMatches(): Promise<EsportsMatchDto[]> {
    const now = Date.now();
    
    // 使用缓存
    if (this.cachedMatches.length > 0 && now - this.lastCacheTime < this.CACHE_DURATION) {
      // 更新 LIVE 比赛的比分
      return this.updateLiveMatchScores(this.cachedMatches);
    }
    
    this.logger.log('Generating new CS2 match data');
    this.cachedMatches = this.generateNewMatches();
    this.lastCacheTime = now;
    
    return this.cachedMatches;
  }

  /**
   * 生成新的比赛列表
   */
  private generateNewMatches(): EsportsMatchDto[] {
    const matches: EsportsMatchDto[] = [];
    const now = new Date();
    
    // 生成 4-6 场比赛
    const matchCount = 4 + Math.floor(Math.random() * 3);
    
    // 随机选择一个锦标赛
    const tournament = this.TOURNAMENTS[Math.floor(Math.random() * this.TOURNAMENTS.length)];
    
    for (let i = 0; i < matchCount; i++) {
      // 根据排名选择对手（排名接近的队伍更可能对战）
      const homeTeamIndex = Math.floor(Math.random() * this.PRO_TEAMS.length);
      let awayTeamIndex = homeTeamIndex;
      while (awayTeamIndex === homeTeamIndex) {
        // 偏向选择排名相近的队伍
        const offset = Math.floor(Math.random() * 4) - 2; // -2 到 +2
        awayTeamIndex = Math.max(0, Math.min(this.PRO_TEAMS.length - 1, homeTeamIndex + offset));
        if (awayTeamIndex === homeTeamIndex) {
          awayTeamIndex = (homeTeamIndex + 1) % this.PRO_TEAMS.length;
        }
      }
      
      const homeTeam = this.PRO_TEAMS[homeTeamIndex];
      const awayTeam = this.PRO_TEAMS[awayTeamIndex];
      
      // 决定比赛状态和时间
      let status: 'UPCOMING' | 'LIVE' = 'UPCOMING';
      let scheduledAt: Date;
      let homeScore = 0;
      let awayScore = 0;
      
      if (i === 0 && Math.random() > 0.3) {
        // 第一场 70% 概率是 LIVE
        status = 'LIVE';
        scheduledAt = new Date(now.getTime() - (20 + Math.random() * 40) * 60 * 1000);
        // 随机比分
        const mapsDone = Math.floor(Math.random() * 2);
        if (mapsDone > 0) {
          homeScore = Math.floor(Math.random() * (mapsDone + 1));
          awayScore = mapsDone - homeScore;
        }
      } else {
        // 间隔 30 分钟到 2 小时
        const minutesLater = 30 + i * 45 + Math.floor(Math.random() * 30);
        scheduledAt = new Date(now.getTime() + minutesLater * 60 * 1000);
      }
      
      // 根据排名计算胜率
      const rankDiff = awayTeam.ranking - homeTeam.ranking;
      const homeWinProb = 0.5 + rankDiff * 0.03; // 每差一名约 3% 胜率差异
      const clampedProb = Math.max(0.2, Math.min(0.8, homeWinProb));
      
      // 随机选择赛制
      const bestOf = [1, 3][Math.floor(Math.random() * 2)]; // 通常是 BO1 或 BO3
      const stage = this.STAGES[Math.min(i, this.STAGES.length - 1)];
      
      matches.push({
        id: `cs2_${tournament.id}_${Date.now()}_${i}`,
        game: 'CS2',
        league: tournament.name,
        tournament: `${tournament.name} 2026 - ${stage}`,
        homeTeam: {
          id: `cs2_${homeTeam.id}`,
          name: homeTeam.name,
          shortName: homeTeam.shortName,
          logo: homeTeam.logo,
        },
        awayTeam: {
          id: `cs2_${awayTeam.id}`,
          name: awayTeam.name,
          shortName: awayTeam.shortName,
          logo: awayTeam.logo,
        },
        bestOf,
        scheduledAt,
        status,
        homeScore,
        awayScore,
        homeOdds: this.calculateOdds(clampedProb),
        awayOdds: this.calculateOdds(1 - clampedProb),
        streamUrl: status === 'LIVE' ? 'https://twitch.tv/esl_csgo' : undefined,
      });
    }
    
    return matches;
  }

  /**
   * 更新 LIVE 比赛的比分（模拟比赛进展）
   */
  private updateLiveMatchScores(matches: EsportsMatchDto[]): EsportsMatchDto[] {
    return matches.map(match => {
      if (match.status === 'LIVE') {
        // 小概率更新比分
        if (Math.random() < 0.1) { // 10% 概率
          const winner = Math.random() > 0.5 ? 'home' : 'away';
          if (winner === 'home') {
            match.homeScore = Math.min(match.homeScore + 1, Math.ceil(match.bestOf / 2));
          } else {
            match.awayScore = Math.min(match.awayScore + 1, Math.ceil(match.bestOf / 2));
          }
          
          // 检查比赛是否结束
          const winThreshold = Math.ceil(match.bestOf / 2);
          if (match.homeScore >= winThreshold || match.awayScore >= winThreshold) {
            match.status = 'FINISHED';
          }
        }
        
        // 动态调整赔率
        const totalMaps = match.homeScore + match.awayScore;
        if (totalMaps > 0) {
          const homeAdvantage = (match.homeScore - match.awayScore) / match.bestOf;
          const baseProb = 0.5 + homeAdvantage * 0.3;
          const clampedProb = Math.max(0.15, Math.min(0.85, baseProb));
          match.homeOdds = this.calculateOdds(clampedProb);
          match.awayOdds = this.calculateOdds(1 - clampedProb);
        }
      }
      
      return match;
    });
  }

  /**
   * 根据胜率计算赔率
   */
  private calculateOdds(winProbability: number): number {
    const baseOdds = 1 / winProbability;
    const margin = 0.95; // 95% 返还率
    return Math.round(baseOdds * margin * 100) / 100;
  }
}
