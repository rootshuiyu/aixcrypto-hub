"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "../../lib/api";
import { useSocket } from "../providers/socket-provider";
import { useQuery } from "@tanstack/react-query";

interface AMMPriceChartProps {
  roundId: string;
  height?: number;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function AMMPriceChart({ roundId, height = 200 }: AMMPriceChartProps) {
  const { socket } = useSocket();
  const [mounted, setMounted] = useState(false);
  const [realtimeCandles, setRealtimeCandles] = useState<CandleData[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取历史 K 线数据
  const { data: candlesData } = useQuery({
    queryKey: ["ammCandles", roundId],
    queryFn: () => api.getAMMCandles(roundId, '5s', 50),
    enabled: mounted && !!roundId,
    refetchInterval: 10000, // 优化：从 5 秒改为 10 秒
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  // 获取交易记录
  const { data: tradesData } = useQuery({
    queryKey: ["ammTrades", roundId],
    queryFn: () => api.getAMMTrades(roundId, 50),
    enabled: mounted && !!roundId,
    refetchInterval: 5000, // 优化：从 2 秒改为 5 秒
    staleTime: 2000,
    refetchOnWindowFocus: false,
  });

  // WebSocket 监听价格更新
  useEffect(() => {
    if (!socket || !mounted) return;

    const handlePriceUpdate = (data: any) => {
      if (data.roundId === roundId) {
        const now = Math.floor(Date.now() / 5000) * 5000; // 5秒对齐
        
        setRealtimeCandles(prev => {
          const lastCandle = prev[prev.length - 1];
          if (lastCandle && lastCandle.time === now) {
            // 更新当前蜡烛
            return [
              ...prev.slice(0, -1),
              {
                ...lastCandle,
                high: Math.max(lastCandle.high, data.yesPrice),
                low: Math.min(lastCandle.low, data.yesPrice),
                close: data.yesPrice,
              }
            ];
          } else {
            // 创建新蜡烛
            const newCandle: CandleData = {
              time: now,
              open: data.yesPrice,
              high: data.yesPrice,
              low: data.yesPrice,
              close: data.yesPrice,
              volume: 0,
            };
            return [...prev.slice(-49), newCandle];
          }
        });
      }
    };

    socket.on('ammPriceUpdate', handlePriceUpdate);
    return () => {
      socket.off('ammPriceUpdate', handlePriceUpdate);
    };
  }, [socket, roundId, mounted]);

  // 合并历史和实时数据
  const allCandles = useMemo(() => {
    const historical = candlesData?.candles?.map((c: any) => ({
      time: new Date(c.startTime).getTime(),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    })) || [];

    // 去重并排序
    const combined = [...historical, ...realtimeCandles];
    const unique = combined.reduce((acc, curr) => {
      const exists = acc.find((c: CandleData) => c.time === curr.time);
      if (!exists) {
        acc.push(curr);
      } else if (curr.time === exists.time) {
        // 更新为最新数据
        Object.assign(exists, curr);
      }
      return acc;
    }, [] as CandleData[]);

    return unique.sort((a: CandleData, b: CandleData) => a.time - b.time).slice(-50);
  }, [candlesData, realtimeCandles]);

  // 计算图表尺寸
  const chartWidth = 100; // 百分比
  const candleWidth = 100 / Math.max(allCandles.length, 1);

  // 计算价格范围
  const prices = allCandles.flatMap((c: CandleData) => [c.high, c.low]);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0.4;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0.6;
  const priceRange = maxPrice - minPrice || 0.1;
  const padding = priceRange * 0.1;

  // 价格到 Y 坐标的转换
  const priceToY = (price: number) => {
    const effectiveMin = minPrice - padding;
    const effectiveMax = maxPrice + padding;
    const effectiveRange = effectiveMax - effectiveMin;
    return ((effectiveMax - price) / effectiveRange) * height;
  };

  // 获取当前价格
  const currentPrice = allCandles.length > 0 ? allCandles[allCandles.length - 1].close : 0.5;
  const prevPrice = allCandles.length > 1 ? allCandles[allCandles.length - 2].close : currentPrice;
  const priceChange = currentPrice - prevPrice;
  const priceChangePercent = prevPrice > 0 ? (priceChange / prevPrice) * 100 : 0;

  if (!mounted) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-4 animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded mb-2" />
        <div className="h-48 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-4 space-y-3">
      {/* 标题 + 当前价格 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
            看涨价格走势
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-mono font-bold text-white">
              ${currentPrice.toFixed(4)}
            </span>
            <span className={`text-sm font-mono ${
              priceChange >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] text-green-500/80 uppercase font-bold">5s</span>
        </div>
      </div>

      {/* K 线图 */}
      <div className="relative" style={{ height: `${height}px` }}>
        {/* 网格线 */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <div key={ratio} className="flex items-center">
              <div className="flex-1 border-t border-white/5" />
              <span className="text-[8px] text-white/30 ml-1 w-10 text-right">
                ${((maxPrice + padding) - (priceRange + 2 * padding) * ratio).toFixed(3)}
              </span>
            </div>
          ))}
        </div>

        {/* 蜡烛图 */}
        <svg 
          className="absolute inset-0 pointer-events-none" 
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
        >
          {allCandles.map((candle: CandleData, i: number) => {
            const x = (i / allCandles.length) * 100;
            const width = candleWidth * 0.8;
            const isGreen = candle.close >= candle.open;
            const color = isGreen ? '#22c55e' : '#ef4444';

            const highY = priceToY(candle.high);
            const lowY = priceToY(candle.low);
            const openY = priceToY(candle.open);
            const closeY = priceToY(candle.close);
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.abs(closeY - openY) || 1;

            return (
              <g key={i}>
                {/* 影线 */}
                <line
                  x1={x + width / 2}
                  y1={highY}
                  x2={x + width / 2}
                  y2={lowY}
                  stroke={color}
                  strokeWidth="0.3"
                />
                {/* 实体 */}
                <rect
                  x={x}
                  y={bodyTop}
                  width={width}
                  height={bodyHeight}
                  fill={color}
                  rx="0.2"
                />
              </g>
            );
          })}
        </svg>

        {/* 当前价格线 */}
        <div 
          className="absolute left-0 right-0 border-t border-dashed border-yellow-500/50 pointer-events-none"
          style={{ top: `${priceToY(currentPrice)}px` }}
        >
          <span className="absolute right-0 -top-2 text-[8px] text-yellow-400 bg-[#0a0a0a] px-1">
            ${currentPrice.toFixed(4)}
          </span>
        </div>
      </div>

      {/* 最近交易 */}
      {tradesData?.trades && tradesData.trades.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
            RECENT_TRADES
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {tradesData.trades.slice(0, 5).map((trade: any) => (
              <div key={trade.id} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    trade.tradeType === 'BUY' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {trade.tradeType}
                  </span>
                  <span className={trade.side === 'YES' ? 'text-green-400' : 'text-red-400'}>
                    {trade.side === 'YES' ? '看涨' : '看跌'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <span>{trade.shares.toFixed(2)} 份</span>
                  <span>@${trade.price.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
