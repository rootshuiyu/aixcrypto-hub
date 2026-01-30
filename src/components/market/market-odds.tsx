"use client";

import { useState, useEffect } from "react";
import { Market } from "../../lib/api";
import { useSocket } from "../providers/socket-provider";

interface MarketOddsProps {
  market?: Market;
  roundId?: string;  // AMM 回合 ID
}

export function MarketOdds({ market, roundId }: MarketOddsProps) {
  const { socket } = useSocket();
  const [mounted, setMounted] = useState(false);
  
  // 实时价格状态（AMM 模式）
  const [livePrice, setLivePrice] = useState<{
    yesPrice: number;
    noPrice: number;
    yesReserve: number;
    noReserve: number;
    totalVolume: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // WebSocket 监听价格更新
  useEffect(() => {
    if (!socket || !mounted) return;

    const handleMarketOddsUpdate = (data: any) => {
      if (market && data.marketId === market.id) {
        // 市场模式：转换为价格格式
        setLivePrice({
          yesPrice: data.yesProbability || 0.5,
          noPrice: data.noProbability || 0.5,
          yesReserve: data.yesPool || 0,
          noReserve: data.noPool || 0,
          totalVolume: data.totalPool || 0,
        });
      }
    };

    const handleAMMPriceUpdate = (data: any) => {
      if (roundId && data.roundId === roundId) {
        setLivePrice({
          yesPrice: data.yesPrice,
          noPrice: data.noPrice,
          yesReserve: data.yesReserve,
          noReserve: data.noReserve,
          totalVolume: data.totalVolume,
        });
      }
    };

    socket.on('marketOddsUpdate', handleMarketOddsUpdate);
    socket.on('ammPriceUpdate', handleAMMPriceUpdate);

    return () => {
      socket.off('marketOddsUpdate', handleMarketOddsUpdate);
      socket.off('ammPriceUpdate', handleAMMPriceUpdate);
    };
  }, [socket, market, roundId, mounted]);

  // 计算显示数据
  let displayData = {
    yesPrice: 0.5,
    noPrice: 0.5,
    yesReserve: 0,
    noReserve: 0,
    totalVolume: 0,
  };

  if (livePrice) {
    displayData = livePrice;
  } else if (market) {
    displayData = {
      yesPrice: market.yesProbability ?? 0.5,
      noPrice: market.noProbability ?? 0.5,
      yesReserve: market.yesPool ?? 0,
      noReserve: market.noPool ?? 0,
      totalVolume: market.totalPool ?? ((market.yesPool ?? 0) + (market.noPool ?? 0)),
    };
  }

  const { yesPrice, noPrice, yesReserve, noReserve, totalVolume } = displayData;
  
  // 计算赔率（1 / price）
  const yesOdds = yesPrice > 0 ? 1 / yesPrice : 1;
  const noOdds = noPrice > 0 ? 1 / noPrice : 1;

  // 骨架屏
  if (!mounted) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-4 space-y-4 animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded" />
        <div className="h-16 bg-white/5 rounded" />
        <div className="h-16 bg-white/5 rounded" />
      </div>
    );
  }

  // 计算赔率变化动画类
  const getOddsChangeClass = (odds: number) => {
    if (odds >= 2.0) return 'text-yellow-400';
    if (odds >= 1.5) return 'text-white';
    return 'text-white/60';
  };

  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-4 space-y-4">
      {/* 标题 + 实时指示器 */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
          {roundId ? 'AMM_PRICES' : 'MARKET_ODDS'}
        </div>
        {livePrice && (
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] text-green-500/80 uppercase font-bold">Live</span>
          </div>
        )}
      </div>

      {/* 看涨方向 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-green-500 font-bold">▲ 看涨</span>
            <span className="text-[9px] text-white/30">({Math.round(yesPrice * 100)}%)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-[10px]">
              ${yesPrice.toFixed(4)}
            </span>
            <span className={`font-mono font-bold text-lg transition-all duration-300 ${getOddsChangeClass(yesOdds)}`}>
              {yesOdds.toFixed(2)}x
            </span>
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(5, yesPrice * 100)}%` }}
          />
        </div>
      </div>

      {/* 看跌方向 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold">▼ 看跌</span>
            <span className="text-[9px] text-white/30">({Math.round(noPrice * 100)}%)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-[10px]">
              ${noPrice.toFixed(4)}
            </span>
            <span className={`font-mono font-bold text-lg transition-all duration-300 ${getOddsChangeClass(noOdds)}`}>
              {noOdds.toFixed(2)}x
            </span>
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(5, noPrice * 100)}%` }}
          />
        </div>
      </div>

      {/* 总池信息 + 市场共识提示 */}
      <div className="pt-3 border-t border-white/5 space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/40 uppercase">Total Volume</span>
          <span className="text-white font-mono font-bold">
            {totalVolume.toLocaleString()} PTS
          </span>
        </div>
        
        {/* 市场共识提示 */}
        {totalVolume > 0 && (
          <div className="text-[9px] text-white/30 text-center">
            {yesPrice > 0.6 
              ? `Market consensus: ${Math.round(yesPrice * 100)}% bullish` 
              : noPrice > 0.6
                ? `Market consensus: ${Math.round(noPrice * 100)}% bearish`
                : 'Market is balanced'}
          </div>
        )}
      </div>
    </div>
  );
}
