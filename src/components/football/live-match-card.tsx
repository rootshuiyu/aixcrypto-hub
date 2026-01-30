'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MatchLiveUpdate } from '@/hooks/useFootballLive';

interface LiveMatchCardProps {
  match: MatchLiveUpdate;
  onBetClick?: () => void;
}

/**
 * 足球直播比赛卡片
 * 显示实时比分、进度、球队信息
 */
export function LiveMatchCard({ match, onBetClick }: LiveMatchCardProps) {
  const [isHighlighted, setIsHighlighted] = useState(false);

  // 比分变化时高亮效果
  useEffect(() => {
    setIsHighlighted(true);
    const timer = setTimeout(() => setIsHighlighted(false), 500);
    return () => clearTimeout(timer);
  }, [match.homeScore, match.awayScore]);

  const getStatusColor = () => {
    switch (match.status) {
      case 'LIVE':
        return 'bg-red-500/20 border-red-500/50 animate-pulse';
      case 'HALFTIME':
        return 'bg-yellow-500/20 border-yellow-500/50';
      case 'UPCOMING':
        return 'bg-blue-500/20 border-blue-500/50';
      case 'FINISHED':
        return 'bg-gray-500/20 border-gray-500/50';
      default:
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusLabel = () => {
    switch (match.status) {
      case 'LIVE':
        return `⚽ LIVE (${match.elapsed || 0}')`;
      case 'HALFTIME':
        return '⏸️ HT';
      case 'UPCOMING':
        return '📅 UPCOMING';
      case 'FINISHED':
        return '✅ FT';
      default:
        return match.status;
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div
      className={`
        relative rounded-lg border-2 p-4 transition-all duration-300
        ${getStatusColor()}
        ${isHighlighted ? 'shadow-lg shadow-yellow-400/50' : ''}
      `}
    >
      {/* 状态标签 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs font-semibold">
            <span className={match.status === 'LIVE' ? 'animate-pulse' : ''}>
              {getStatusLabel()}
            </span>
          </div>
          <span className="text-xs font-medium text-gray-400">{match.league}</span>
        </div>
        <span className="text-xs text-gray-500">{formatTime(match.scheduledAt)}</span>
      </div>

      {/* 球队与比分 */}
      <div className="mb-4 grid grid-cols-3 items-center gap-3">
        {/* 主队 */}
        <div className="flex flex-col items-center gap-2">
          {match.homeTeam.logo && (
            <Image
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              width={40}
              height={40}
              className="rounded"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3E%3C/svg%3E';
              }}
            />
          )}
          <p className="line-clamp-2 text-center text-xs font-semibold">{match.homeTeam.name}</p>
        </div>

        {/* 比分 */}
        <div className="flex flex-col items-center gap-1">
          <div className={`flex gap-2 text-3xl font-bold ${isHighlighted ? 'text-yellow-400' : 'text-white'}`}>
            <span>{match.homeScore}</span>
            <span className="text-lg text-gray-400">-</span>
            <span>{match.awayScore}</span>
          </div>
          {match.elapsed !== null && (
            <p className="text-xs text-gray-400">{match.elapsed}'</p>
          )}
        </div>

        {/* 客队 */}
        <div className="flex flex-col items-center gap-2">
          {match.awayTeam.logo && (
            <Image
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              width={40}
              height={40}
              className="rounded"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3E%3C/svg%3E';
              }}
            />
          )}
          <p className="line-clamp-2 text-center text-xs font-semibold">{match.awayTeam.name}</p>
        </div>
      </div>

      {/* 球场信息 */}
      {match.venue && (
        <div className="mb-3 text-center text-xs text-gray-400">
          <span className="inline-block rounded bg-white/5 px-2 py-1">{match.venue}</span>
        </div>
      )}

      {/* 下注按钮 */}
      <button
        onClick={onBetClick}
        className={`
          w-full rounded-lg py-2 font-semibold transition-all duration-200
          ${
            match.status === 'LIVE'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/50'
              : match.status === 'UPCOMING'
                ? 'bg-blue-500/30 text-blue-300 hover:bg-blue-500/40'
                : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
          }
        `}
        disabled={match.status !== 'LIVE' && match.status !== 'UPCOMING'}
      >
        {match.status === 'LIVE' ? '🎯 Bet Now' : 'Place Bet'}
      </button>

      {/* 更新时间 */}
      <div className="mt-2 text-center text-xs text-gray-500">
        Updated: {formatTime(match.updatedAt)}
      </div>
    </div>
  );
}
