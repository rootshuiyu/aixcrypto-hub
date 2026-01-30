import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');
  private onlineUsers: Map<string, string> = new Map(); // userId -> socketId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.onlineUsers.set(userId, client.id);
      client.join(userId); // 🆕 确保用户加入个人房间，以便 server.to(userId) 发送私有消息
      this.logger.log(`User connected: ${userId} (Socket: ${client.id})`);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.onlineUsers.entries()) {
      if (socketId === client.id) {
        this.onlineUsers.delete(userId);
        this.logger.log(`User disconnected: ${userId}`);
        break;
      }
    }
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  // 广播任务更新
  emitTaskUpdate(userId: string, task: any) {
    this.server.emit(`taskUpdate:${userId}`, task);
  }

  // 广播下注成功
  emitBetSuccess(userId: string, bet: any) {
    this.server.emit(`betSuccess:${userId}`, bet);
  }

  // 广播对战结果
  emitBattleResult(userId: string, battle: any) {
    this.server.emit(`battleResult:${userId}`, battle);
  }

  // 广播余额变化
  emitBalanceUpdate(userId: string, pts: number) {
    this.server.emit(`balanceUpdate:${userId}`, pts);
  }

  // 全局系统广播
  broadcastSystemMessage(type: string, message: string) {
    this.server.emit('systemBroadcast', { type, message, timestamp: new Date() });
  }

  // ============================================
  // 回合制预测系统事件
  // ============================================

  // 广播回合更新（状态变化、资金池变化等）
  emitRoundUpdate(roundData: {
    category: string;
    roundNumber: number;
    status: string;
    openPrice?: number;
    closePrice?: number;
    highPrice?: number;
    lowPrice?: number;
    result?: string;
    longPool: number;
    shortPool: number;
    longBetCount: number;
    shortBetCount: number;
    startTime: Date;
    endTime: Date;
    lockTime: Date;
  }) {
    this.server.emit('roundUpdate', roundData);
    this.logger.debug(`Round update broadcast: #${roundData.roundNumber} [${roundData.status}]`);
  }

  // 广播新下注（Live Feed）
  emitNewBet(betData: {
    category: string;
    roundNumber: number;
    address: string;
    position: string;
    amount: number;
    timestamp: Date;
  }) {
    this.server.emit('newBet', betData);
  }

  // 广播回合结算结果
  emitRoundSettled(settlementData: {
    category: string;
    roundNumber: number;
    result: string;
    openPrice: number;
    closePrice: number;
    priceChange: number;
    longWinners: number;
    shortWinners: number;
    totalPayout: number;
  }) {
    this.server.emit('roundSettled', settlementData);
    this.logger.log(`Round #${settlementData.roundNumber} settled: ${settlementData.result}`);
  }

  // 广播倒计时（每秒推送）
  emitCountdown(category: string, countdown: number, status: string) {
    this.server.emit('roundCountdown', { category, countdown, status });
  }

  // 广播用户资料更新
  emitUserProfileUpdate(userId: string, data: any) {
    this.server.emit('systemBroadcast', { 
      type: 'USER_PROFILE_UPDATE', 
      userId, 
      data,
      timestamp: new Date() 
    });
  }

  // 向特定用户推送下注结果
  emitBetResult(userId: string, result: {
    roundNumber: number;
    position: string;
    amount: number;
    result: string;
    payout: number;
    newCombo: number;
    newMultiplier: number;
  }) {
    this.server.emit(`betResult:${userId}`, result);
  }

  // ============================================
  // 足球直播事件
  // ============================================

  /**
   * 广播比赛实时更新（比分、进度）
   */
  emitMatchLiveUpdate(liveUpdate: {
    matchId: string;
    fixtureId: number;
    status: string;
    elapsed: number | null;
    homeScore: number;
    awayScore: number;
    homeTeam: { id: number; name: string; logo: string };
    awayTeam: { id: number; name: string; logo: string };
    league: string;
    venue: string | null;
    scheduledAt: Date;
    updatedAt: Date;
  }) {
    this.server.emit('footballMatchLiveUpdate', liveUpdate);
    this.logger.debug(
      `Football match live update: ${liveUpdate.homeTeam.name} ${liveUpdate.homeScore}-${liveUpdate.awayScore} ${liveUpdate.awayTeam.name} [${liveUpdate.elapsed}']`,
    );
  }

  /**
   * 广播比赛事件（进球、红牌、换人等）
   */
  emitFootballEvent(event: {
    id: string;
    matchId: string;
    fixtureId: number;
    type: string;
    timestamp: Date;
    minute: number;
    team: 'HOME' | 'AWAY';
    player: { name: string; id?: number };
    detail?: string;
    relatedPlayer?: { name: string; id?: number };
  }) {
    this.server.emit('footballEvent', event);
    this.logger.debug(
      `Football event: [${event.type}] ${event.player.name} (${event.minute}') at ${event.matchId}`,
    );
  }

  /**
   * 广播赔率更新
   */
  emitOddsUpdate(oddsUpdate: {
    matchId: string;
    fixtureId: number;
    homeOdds: number;
    drawOdds: number;
    awayOdds: number;
    updatedAt: Date;
  }) {
    this.server.emit('footballOddsUpdate', oddsUpdate);
  }

  /**
   * 广播下注池统计
   */
  emitBettingStatsUpdate(stats: {
    matchId: string;
    fixtureId: number;
    homeBetPool: number;
    drawBetPool: number;
    awayBetPool: number;
    homeBetCount: number;
    drawBetCount: number;
    awayBetCount: number;
    totalPool: number;
    updatedAt: Date;
  }) {
    this.server.emit('footballBettingStats', stats);
  }

  /**
   * 广播比赛状态变化（开始、中场、结束）
   */
  emitMatchStatusChange(statusChange: {
    matchId: string;
    fixtureId: number;
    newStatus: string;
    previousStatus: string;
    timestamp: Date;
  }) {
    this.server.emit('footballMatchStatusChange', statusChange);
    this.logger.log(
      `Football match status change: ${statusChange.previousStatus} -> ${statusChange.newStatus} (${statusChange.matchId})`,
    );
  }
}

