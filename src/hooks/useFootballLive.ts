'use client';

import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * 足球直播 WebSocket 连接 Hook
 * 用于订阅实时比赛数据、事件和赔率更新
 */

export interface MatchLiveUpdate {
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
}

export interface FootballEvent {
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
}

export interface OddsUpdate {
  matchId: string;
  fixtureId: number;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  updatedAt: Date;
}

export interface BettingPoolStats {
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
}

export interface FootballLiveHookCallbacks {
  onMatchUpdate?: (update: MatchLiveUpdate) => void;
  onEvent?: (event: FootballEvent) => void;
  onOddsUpdate?: (odds: OddsUpdate) => void;
  onBettingStats?: (stats: BettingPoolStats) => void;
  onStatusChange?: (change: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

let globalSocket: Socket | null = null;

/**
 * 使用足球直播 WebSocket 连接
 * @param callbacks 各种事件的回调函数
 */
export function useFootballLive(callbacks?: FootballLiveHookCallbacks) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 连接到 WebSocket 服务器
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

    if (!socketRef.current) {
      const socket = io(wsUrl, {
        query: {
          userId: 'football-viewer', // 可以替换为真实的用户 ID
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;
      globalSocket = socket;

      // 连接成功
      socket.on('connect', () => {
        console.log('✅ Football Live WebSocket connected');
        callbacks?.onConnect?.();
      });

      // 比赛实时更新
      socket.on('footballMatchLiveUpdate', (update: MatchLiveUpdate) => {
        console.log('📊 Match live update:', update);
        callbacks?.onMatchUpdate?.(update);
      });

      // 比赛事件（进球、红牌等）
      socket.on('footballEvent', (event: FootballEvent) => {
        console.log('⚽ Football event:', event);
        callbacks?.onEvent?.(event);
      });

      // 赔率更新
      socket.on('footballOddsUpdate', (odds: OddsUpdate) => {
        console.log('💰 Odds update:', odds);
        callbacks?.onOddsUpdate?.(odds);
      });

      // 下注池统计
      socket.on('footballBettingStats', (stats: BettingPoolStats) => {
        console.log('📈 Betting stats:', stats);
        callbacks?.onBettingStats?.(stats);
      });

      // 比赛状态变化
      socket.on('footballMatchStatusChange', (change: any) => {
        console.log('🔄 Match status change:', change);
        callbacks?.onStatusChange?.(change);
      });

      // 断开连接
      socket.on('disconnect', () => {
        console.log('❌ Football Live WebSocket disconnected');
        callbacks?.onDisconnect?.();
      });

      // 连接错误
      socket.on('connect_error', (error: any) => {
        console.error('⚠️ Football Live WebSocket error:', error);
        callbacks?.onError?.(error.message);
      });
    }

    return () => {
      // 清理（可选：不断开连接，以便在多个组件间共享）
      // socketRef.current?.disconnect();
    };
  }, [callbacks]);

  const subscribeToMatch = useCallback((matchId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribeToMatch', { matchId });
    }
  }, []);

  const unsubscribeFromMatch = useCallback((matchId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribeFromMatch', { matchId });
    }
  }, []);

  const addEvent = useCallback(
    (matchId: string, event: Omit<FootballEvent, 'id' | 'timestamp'>) => {
      if (socketRef.current) {
        socketRef.current.emit('addFootballEvent', { matchId, event });
      }
    },
    [],
  );

  return {
    socket: socketRef.current,
    subscribeToMatch,
    unsubscribeFromMatch,
    addEvent,
  };
}

/**
 * 获取全局 Socket 实例
 */
export function getFootballSocket(): Socket | null {
  return globalSocket;
}

/**
 * 手动连接/重连 WebSocket
 */
export function connectFootballSocket() {
  if (!globalSocket || !globalSocket.connected) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    globalSocket = io(wsUrl, {
      query: {
        userId: 'football-viewer',
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return globalSocket;
}

/**
 * 断开 WebSocket 连接
 */
export function disconnectFootballSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
}
