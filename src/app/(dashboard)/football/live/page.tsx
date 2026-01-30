'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { LiveMatchCard } from '@/components/football/live-match-card';
import { MatchEvents } from '@/components/football/match-events';
import { LiveOddsDisplay } from '@/components/football/live-odds-display';
import { BettingStats } from '@/components/football/betting-stats';
import {
  useFootballLive,
  MatchLiveUpdate,
  FootballEvent,
  OddsUpdate,
  BettingPoolStats,
} from '@/hooks/useFootballLive';

/**
 * 足球直播主页面
 * 显示所有直播和即将开始的比赛，以及实时数据更新
 */
export default function FootballLivePage() {
  const [liveMatches, setLiveMatches] = useState<Map<string, MatchLiveUpdate>>(new Map());
  const [events, setEvents] = useState<Map<string, FootballEvent[]>>(new Map());
  const [odds, setOdds] = useState<Map<string, OddsUpdate>>(new Map());
  const [bettingStats, setBettingStats] = useState<Map<string, BettingPoolStats>>(new Map());
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<'HOME' | 'DRAW' | 'AWAY' | null>(null);

  // 初始化 WebSocket 连接
  const { socket, subscribeToMatch } = useFootballLive({
    onMatchUpdate: useCallback((update: MatchLiveUpdate) => {
      setLiveMatches((prev) => new Map(prev).set(update.matchId, update));
      
      // 自动选择第一场直播比赛
      if (!selectedMatch && update.status === 'LIVE') {
        setSelectedMatch(update.matchId);
      }
    }, [selectedMatch]),

    onEvent: useCallback((event: FootballEvent) => {
      setEvents((prev) => {
        const newEvents = new Map(prev);
        const matchEvents = newEvents.get(event.matchId) || [];
        newEvents.set(event.matchId, [...matchEvents, event]);
        return newEvents;
      });
    }, []),

    onOddsUpdate: useCallback((oddsUpdate: OddsUpdate) => {
      setOdds((prev) => new Map(prev).set(oddsUpdate.matchId, oddsUpdate));
    }, []),

    onBettingStats: useCallback((stats: BettingPoolStats) => {
      setBettingStats((prev) => new Map(prev).set(stats.matchId, stats));
    }, []),

    onConnect: useCallback(() => {
      setIsConnected(true);
      console.log('✅ Connected to Football Live');
    }, []),

    onDisconnect: useCallback(() => {
      setIsConnected(false);
      console.log('❌ Disconnected from Football Live');
    }, []),

    onError: useCallback((error: string) => {
      console.error('❌ Football Live Error:', error);
    }, []),
  });

  // 获取所有直播比赛
  const getActiveMatches = useCallback(() => {
    return Array.from(liveMatches.values()).sort((a, b) => {
      // LIVE 优先，然后是 UPCOMING，最后是 FINISHED
      const statusOrder = { LIVE: 0, HALFTIME: 1, UPCOMING: 2, FINISHED: 3 };
      const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 999;
      const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 999;

      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });
  }, [liveMatches]);

  const activeMatches = getActiveMatches();
  const currentMatch = selectedMatch ? liveMatches.get(selectedMatch) : activeMatches[0];
  const currentEvents = selectedMatch ? events.get(selectedMatch) || [] : [];
  const currentOdds = selectedMatch ? odds.get(selectedMatch) || null : null;
  const currentStats = selectedMatch ? bettingStats.get(selectedMatch) || null : null;

  const handleBetClick = useCallback(() => {
    if (!currentMatch) return;
    // 这里可以跳转到下注页面或打开下注模态框
    console.log('Placing bet on:', currentMatch.matchId, 'Prediction:', selectedPrediction);
  }, [currentMatch, selectedPrediction]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* 顶部连接状态 */}
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-black/80 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-bold">
            ⚽ Football Live <span className="text-lg">Broadcasting</span>
          </h1>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 左侧：比赛列表 */}
          <div className="space-y-4 lg:col-span-1">
            <h2 className="text-lg font-bold">📋 All Matches ({activeMatches.length})</h2>
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {activeMatches.length === 0 ? (
                <div className="rounded-lg border border-gray-500/30 bg-gray-500/5 p-6 text-center">
                  <p className="text-sm text-gray-500">No live matches at the moment</p>
                </div>
              ) : (
                activeMatches.map((match) => (
                  <button
                    key={match.matchId}
                    onClick={() => setSelectedMatch(match.matchId)}
                    className={`w-full transition-opacity duration-200 ${
                      selectedMatch === match.matchId ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                    }`}
                  >
                    <LiveMatchCard match={match} />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 右侧：详细视图 */}
          {currentMatch ? (
            <div className="space-y-6 lg:col-span-2">
              {/* 当前比赛详细卡片 */}
              <div>
                <h2 className="mb-3 text-lg font-bold">🎯 Match Details</h2>
                <LiveMatchCard 
                  match={currentMatch} 
                  onBetClick={handleBetClick}
                />
              </div>

              {/* 赔率和下注 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h2 className="mb-3 text-lg font-bold">💰 Odds</h2>
                  <LiveOddsDisplay
                    odds={currentOdds}
                    matchId={currentMatch.matchId}
                    onSelect={setSelectedPrediction}
                  />
                </div>
                <div>
                  <h2 className="mb-3 text-lg font-bold">📊 Betting Pool</h2>
                  <BettingStats stats={currentStats} />
                </div>
              </div>

              {/* 比赛事件流 */}
              <div>
                <h2 className="mb-3 text-lg font-bold">📝 Match Events ({currentEvents.length})</h2>
                <MatchEvents events={currentEvents} matchId={currentMatch.matchId} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-gray-500/30 bg-gray-500/5 p-12 lg:col-span-2">
              <p className="text-lg text-gray-500">Select a match to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* 底部信息提示 */}
      <div className="border-t border-gray-800 bg-black/80 backdrop-blur-md px-4 py-4">
        <div className="mx-auto max-w-7xl text-center text-xs text-gray-500">
          <p>🔄 Updates in real-time • 📱 Mobile friendly • 🔐 Secure betting</p>
        </div>
      </div>
    </div>
  );
}
