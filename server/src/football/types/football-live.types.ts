/**
 * 足球直播类型定义
 * 用于实时比赛数据、事件和赔率更新
 */

/**
 * 足球比赛事件类型
 */
export type FootballEventType =
  | 'GOAL' // 进球
  | 'OWN_GOAL' // 乌龙球
  | 'PENALTY' // 点球
  | 'RED_CARD' // 红牌
  | 'YELLOW_CARD' // 黄牌
  | 'SUBSTITUTION' // 换人
  | 'VAR' // VAR 判罚
  | 'MATCH_START' // 比赛开始
  | 'HALFTIME' // 中场休息
  | 'FULLTIME' // 全场结束
  | 'EXTRA_TIME' // 加时赛开始
  | 'PENALTY_SHOOTOUT'; // 点球大战

/**
 * 足球比赛事件
 */
export interface FootballEvent {
  id: string; // 唯一事件ID
  matchId: string; // 比赛ID (football-{fixtureId})
  fixtureId: number; // API-Football fixture ID
  type: FootballEventType; // 事件类型
  timestamp: Date; // 事件发生时间
  minute: number; // 事件发生的分钟数
  team: 'HOME' | 'AWAY'; // 事件发生的队伍
  player: {
    name: string; // 球员名字
    id?: number; // API Football player ID
  };
  detail?: string; // 事件详情（例如：点球、直接任意球等）
  relatedPlayer?: {
    // 相关球员（如换人时的替补球员、助攻者）
    name: string;
    id?: number;
  };
}

/**
 * 比赛实时更新数据
 */
export interface MatchLiveUpdate {
  matchId: string;
  fixtureId: number;
  status: 'UPCOMING' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  elapsed: number | null; // 比赛进行时间（分钟）
  homeScore: number; // 主队进球
  awayScore: number; // 客队进球
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
  league: string;
  venue: string | null;
  scheduledAt: Date;
  updatedAt: Date; // 数据更新时间
}

/**
 * 赔率实时更新
 */
export interface OddsUpdate {
  matchId: string;
  fixtureId: number;
  homeOdds: number; // 主胜赔率
  drawOdds: number; // 平局赔率
  awayOdds: number; // 客胜赔率
  updatedAt: Date;
}

/**
 * 下注池实时统计
 */
export interface BettingPoolStats {
  matchId: string;
  fixtureId: number;
  homeBetPool: number; // 主胜下注总额
  drawBetPool: number; // 平局下注总额
  awayBetPool: number; // 客胜下注总额
  homeBetCount: number; // 主胜下注人数
  drawBetCount: number; // 平局下注人数
  awayBetCount: number; // 客胜下注人数
  totalPool: number; // 总下注额
  updatedAt: Date;
}

/**
 * 比赛直播推送数据（WebSocket）
 */
export interface MatchLivePayload {
  type: 'MATCH_UPDATE' | 'EVENT' | 'ODDS_UPDATE' | 'BETTING_STATS' | 'MATCH_STATUS_CHANGE';
  data: MatchLiveUpdate | FootballEvent | OddsUpdate | BettingPoolStats | { matchId: string; status: string };
  timestamp: Date;
}

/**
 * 实时比赛管理器状态
 */
export interface LiveMatchManager {
  matchId: string;
  fixtureId: number;
  isLive: boolean;
  lastUpdate: Date;
  updateInterval?: NodeJS.Timer; // 定时更新器
  lastScore?: { home: number; away: number };
  lastElapsed?: number;
}
