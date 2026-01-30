"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useSocket } from "../providers/socket-provider";
import { useAuth } from "../../hooks/use-auth";
import { createChart, ColorType, IChartApi, ISeriesApi, Time, LineData } from 'lightweight-charts';
import { MarketClosedOverlay } from "./market-closed-overlay";

type ChartMode = 'CANDLE' | 'MINUTE' | 'SECOND';

interface C10PriceChartProps {
  activeTab: 'C10' | 'GOLD';
  onTabChange: (tab: 'C10' | 'GOLD') => void;
  onPriceUpdate?: (price: number, change: number) => void;
}

// 🆕 黄金/C10 默认价格和合理范围
const PRICE_CONFIG = {
  C10: { default: 36000, min: 20000, max: 100000 },
  GOLD: { default: 2700, min: 2000, max: 3500 }, // 黄金约 $2700/oz
};

// 检查价格是否在合理范围内
function isReasonablePrice(price: number, market: 'C10' | 'GOLD'): boolean {
  const config = PRICE_CONFIG[market];
  return price >= config.min && price <= config.max;
}

// 获取安全的基准价格
function getSafeBasePrice(price: number, market: 'C10' | 'GOLD'): number {
  const config = PRICE_CONFIG[market];
  if (price <= 0 || !isReasonablePrice(price, market)) {
    return config.default;
  }
  return price;
}

// 🆕 生成分时/秒时线数据
function generateLineData(historyData: any[], basePrice: number, mode: 'MINUTE' | 'SECOND', market: 'C10' | 'GOLD' = 'C10'): LineData<Time>[] {
  const config = PRICE_CONFIG[market];
  const safeBasePrice = basePrice > 0 ? basePrice : config.default;
  const interval = mode === 'MINUTE' ? 60 : 1; // 分时60秒，秒时1秒
  const count = mode === 'MINUTE' ? 60 : 300; // 分时显示60分钟，秒时显示300秒
  
  // 如果没有历史数据，生成模拟数据
  if (!historyData || historyData.length === 0) {
    const data: LineData<Time>[] = [];
    const now = Math.floor(Date.now() / 1000);
    const alignedNow = Math.floor(now / interval) * interval;
    let price = safeBasePrice;
    // 🆕 增加线图波动率 (原为 0.0001 / 0.0005)
    const volatilityRate = market === 'GOLD' ? 0.0005 : 0.002;

    for (let i = count; i >= 0; i--) {
      const time = (alignedNow - i * interval) as Time;
      const volatility = price * volatilityRate;
      price = price + (Math.random() - 0.5) * volatility * 2;
      data.push({ time, value: parseFloat(price.toFixed(2)) });
    }
    return data;
  }

  // 使用历史数据转换
  const sortedData = [...historyData]
    .filter(item => item.value > 0 && isReasonablePrice(item.value, market))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (sortedData.length === 0) return [];

  const data: LineData<Time>[] = [];
  sortedData.forEach(item => {
    data.push({
      time: (Math.floor(new Date(item.timestamp).getTime() / 1000)) as Time,
      value: item.value
    });
  });

  return data.sort((a, b) => (a.time as number) - (b.time as number))
    .filter((d, i, arr) => i === 0 || (d.time as number) > (arr[i-1].time as number));
}

export function C10PriceChart({ activeTab, onTabChange, onPriceUpdate }: C10PriceChartProps) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const { socket } = useSocket();
  const { user: authUser } = useAuth();
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  
  const [mounted, setMounted] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [chartMode, setChartMode] = useState<ChartMode>('SECOND');
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [priceChange, setPriceChange] = useState({ value: 0, percent: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🆕 历史数据只用于初始化图表，实时更新依赖 WebSocket
  const { data: historyData, refetch } = useQuery({
    queryKey: ["indexHistory", activeTab],
    queryFn: () => api.getIndexHistory(activeTab, 100),
    enabled: mounted,
    refetchInterval: 60000, // 改为 60 秒（实时更新通过 WebSocket）
    staleTime: 30000, // 30 秒内视为新鲜数据，不重复请求
  });

  // WebSocket 实时更新 - 监听两种事件
  useEffect(() => {
    if (socket && mounted) {
      // 优化：减小节流时间到 100ms，确保“实时跳动”感
      let lastUpdateTime = 0;
      const THROTTLE_MS = 100; 
      
      const handleUpdate = (data: any) => {
        const now = Date.now();
        if (now - lastUpdateTime >= THROTTLE_MS) {
          lastUpdateTime = now;
          setRealtimeData(data);
        }
      };
      
      // 🆕 优化：同时监听主要更新和更频繁的微更新，恢复实时采集
      console.log('🎧 K-line chart: Setting up WebSocket listeners');
      socket.on('indexUpdate', handleUpdate);
      socket.on('indexUpdateMicro', handleUpdate);
      return () => {
        console.log('🔌 K-line chart: Cleaning up WebSocket listeners');
        socket.off('indexUpdate', handleUpdate);
        socket.off('indexUpdateMicro', handleUpdate);
      };
    }
  }, [socket, mounted]);

  // 计算当前价格
  const currentPrice = useMemo(() => {
    if (!mounted) return activeTab === 'C10' ? 36000 : 2700;
    const base = activeTab === 'C10' 
      ? (realtimeData?.c10?.value || historyData?.[0]?.value || 36000)
      : (realtimeData?.gold?.value || historyData?.[0]?.value || 2700);
    return base;
  }, [realtimeData, historyData, activeTab, mounted]);

  // 🆕 线图数据
  const lineData = useMemo(() => {
    if (!mounted) return [];
    return generateLineData(historyData || [], 0, chartMode as 'MINUTE' | 'SECOND', activeTab);
  }, [historyData, activeTab, mounted, chartMode]);

  // 计算价格变化
  useEffect(() => {
    if (mounted && lineData.length >= 2) {
      const firstPoint = lineData[0];
      const lastPoint = lineData[lineData.length - 1];
      const change = lastPoint.value - firstPoint.value;
      const changePercent = (change / firstPoint.value) * 100;
      setPriceChange({ value: change, percent: changePercent });
    }
  }, [lineData, mounted]);

  // 🆕 价格更新回调 - 传递给父组件
  useEffect(() => {
    if (mounted && onPriceUpdate && currentPrice > 0) {
      onPriceUpdate(currentPrice, priceChange.percent);
    }
  }, [currentPrice, priceChange.percent, mounted, onPriceUpdate]);

  // 图表是否已初始化的标志
  const chartInitializedRef = useRef(false);

  // 初始化图表 - 依赖 mounted 和 activeTab
  useEffect(() => {
    if (!chartContainerRef.current || !mounted) return;

    // 🆕 黄金专用"黑金/墨绿"主题 + 增强对比度
    const isGold = activeTab === 'GOLD';
    const themeColor = isGold ? '#D4AF37' : '#8b5cf6'; // 金色 vs 紫色
    // 🆕 增强颜色对比度，让涨跌更明显
    const upColor = isGold ? '#FFD700' : '#10b981';    // 更亮的金色涨 vs 更亮的绿色涨
    const downColor = isGold ? '#CD853F' : '#f87171'; // 更明显的棕色跌 vs 更亮的红色跌
    const gridColor = isGold ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255, 255, 255, 0.06)'; // 增强网格线可见度
    const textColor = isGold ? 'rgba(212, 175, 55, 0.8)' : 'rgba(255, 255, 255, 0.7)'; // 增强文字可见度

    // 清除旧图表
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      lineSeriesRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 300, // 增加回退值防止首帧抖动
      height: chartContainerRef.current.clientHeight || 200,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: textColor,
        fontFamily: "'Inter', 'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { 
          color: gridColor,
          style: 1, // 实线
          visible: true,
        },
        horzLines: { 
          color: gridColor,
          style: 1, // 实线
          visible: true,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: themeColor,
          width: 2, // 🆕 增加宽度，让十字线更明显
          style: 0, // 实线
          labelBackgroundColor: themeColor,
          labelVisible: true, // 确保标签可见
        },
        horzLine: {
          color: themeColor,
          width: 2, // 🆕 增加宽度
          style: 0, // 实线
          labelBackgroundColor: themeColor,
          labelVisible: true, // 确保标签可见
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.15)', // 增强边框可见度
        scaleMargins: {
          top: 0.05,    // 🆕 压缩顶部边距，让起伏占满屏幕
          bottom: 0.05, // 🆕 压缩底部边距
        },
        entireTextOnly: false,
        ticksVisible: true, // 确保价格标签可见
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.15)', // 增强边框可见度
        timeVisible: true,
        secondsVisible: chartMode === 'SECOND',
        barSpacing: 8, // 🆕 增加蜡烛间距，让每根蜡烛更明显
        minBarSpacing: 4, // 🆕 增加最小间距
        rightOffset: 5,
        fixLeftEdge: false,
        fixRightEdge: true, // 固定右边缘，显示最新数据
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    });

    // 🆕 添加分时/秒时线系列
    const lineSeries = chart.addAreaSeries({
      lineColor: themeColor,
      topColor: isGold ? 'rgba(212, 175, 55, 0.3)' : 'rgba(139, 92, 246, 0.3)',
      bottomColor: 'rgba(0, 0, 0, 0)',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    lineSeries.applyOptions({
      priceLineVisible: true,
      lastValueVisible: true,
    });

    lineSeriesRef.current = lineSeries as any;

    chartRef.current = chart;
    chartInitializedRef.current = true;
    setChartReady(true);

    // 添加成交量提示
    lineSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.1,
        bottom: 0.2,
      },
    });

    // 自适应大小 - 使用 ResizeObserver 替代 window.resize 以获得更精准的响应
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      chartRef.current.applyOptions({ width, height });
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      chartInitializedRef.current = false;
      setChartReady(false);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        lineSeriesRef.current = null;
      }
    };
  }, [activeTab, mounted, chartMode]);

  // 🆕 跟踪图表中最后一条数据的时间
  const lastDataTimeRef = useRef<number>(0);
  
  // 🆕 跟踪价格线引用，用于实时更新
  const priceLineRef = useRef<any>(null);

  // 🆕 单独的 useEffect 处理数据更新
  useEffect(() => {
    if (!chartInitializedRef.current) return;

    if (lineSeriesRef.current && lineData.length > 0) {
      lineSeriesRef.current.setData(lineData);
      chartRef.current?.timeScale().fitContent();
      
      const lastPoint = lineData[lineData.length - 1];
      if (lastPoint) {
        lastDataTimeRef.current = typeof lastPoint.time === 'number' ? lastPoint.time : 0;
      }
    }
  }, [lineData, chartMode]);

  // 实时更新最新线图数据
  useEffect(() => {
    if (!realtimeData || !chartReady) return;

    const series = lineSeriesRef.current;
    if (!series) return;

    const currentValue = activeTab === 'C10' ? realtimeData?.c10?.value : realtimeData?.gold?.value;
    if (!currentValue || currentValue <= 0) return;

    // 价格合理性检查
    const config = PRICE_CONFIG[activeTab];
    if (currentValue < config.min || currentValue > config.max) return;

    const now = Math.floor(Date.now() / 1000);
    
    // 线图模式
    const interval = chartMode === 'MINUTE' ? 60 : 1;
    const bucketStart = Math.floor(now / interval) * interval;
    
    if (bucketStart < lastDataTimeRef.current) return;

    series.update({
      time: bucketStart as Time,
      value: currentValue,
    } as any);
    
    lastDataTimeRef.current = bucketStart;

    // 🆕 更新价格线位置 - 实时显示当前价格
    const isGold = activeTab === 'GOLD';
    const themeColor = isGold ? '#D4AF37' : '#8b5cf6';
    if (priceLineRef.current) {
      try { series.removePriceLine(priceLineRef.current); } catch (e) {}
    }
    try {
      priceLineRef.current = series.createPriceLine({
        price: currentValue,
        color: themeColor,
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: chartMode === 'MINUTE' ? '分时价格' : '秒时价格',
      });
    } catch (e) {}
  }, [realtimeData, activeTab, chartReady, chartMode]);

  // 切换时重新获取数据
  useEffect(() => {
    refetch();
  }, [activeTab, refetch]);

  const isPositive = priceChange.percent >= 0;
  // 🆕 黄金专用颜色类
  const isGoldTab = activeTab === 'GOLD';
  const themeColor = isGoldTab ? 'text-amber-400' : 'text-purple-400';
  const themeBg = isGoldTab ? 'bg-gradient-to-br from-[#1a1a1a] via-[#1f1f14] to-[#1a1a1a]' : 'bg-[#0a0a0a]';
  const themeBorder = isGoldTab ? 'border-amber-900/30' : 'border-white/5';

  return (
    <div className={`rounded-xl border ${themeBorder} ${themeBg} p-3 sm:p-6 relative overflow-hidden w-full min-w-0`}>
      {/* 🆕 黄金市场休市覆盖层 */}
      <MarketClosedOverlay market={activeTab} onMarketChange={onTabChange} />

      {/* 背景动效 - 黄金使用墨绿+金色渐变 */}
      <div className="absolute inset-0 opacity-30">
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl ${
          isGoldTab ? 'bg-amber-500/10' : 'bg-purple-500/10'
        }`} />
        <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl ${
          isGoldTab ? 'bg-emerald-900/20' : 'bg-blue-500/10'
        }`} />
        {/* 🆕 黄金专属：金色流光效果 */}
        {isGoldTab && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-pulse" />
        )}
      </div>

      {/* 顶部信息区 */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4 relative z-10">
        <div className="flex-1 min-w-0">
          {/* 切换按钮 */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex rounded-lg p-1 border ${
              isGoldTab 
                ? 'bg-gradient-to-r from-amber-950/30 to-emerald-950/30 border-amber-800/30' 
                : 'bg-white/5 border-white/10'
            }`}>
              <button 
                onClick={() => onTabChange('C10')} 
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activeTab === 'C10' 
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' 
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                C10 Index
              </button>
              <button 
                onClick={() => onTabChange('GOLD')} 
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activeTab === 'GOLD' 
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-lg shadow-amber-500/40' 
                    : 'text-white/40 hover:text-amber-400/60'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>🥇</span>
                  <span>GOLD</span>
                </span>
              </button>
            </div>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Live</span>
            </span>
          </div>
          
          {/* 价格显示 */}
          <div className="flex items-baseline gap-3">
            <span className={`text-3xl sm:text-5xl font-black tracking-tighter tabular-nums ${themeColor}`}>
              {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-white/30 uppercase">USD</span>
          </div>

          {/* 价格变化 */}
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{priceChange.value.toFixed(2)}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isPositive ? '↑' : '↓'} {Math.abs(priceChange.percent).toFixed(2)}%
            </span>
            <span className="text-xs text-white/30">1h</span>
          </div>
        </div>

        {/* 右侧信息 */}
        <div className="flex items-start sm:items-end justify-between sm:flex-col gap-2">
          <div className="text-right">
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Protocol_v4</p>
            <p className="text-[8px] text-white/20">Chainlink Oracle</p>
          </div>
          <div className="flex gap-1">
            {[1,2,3,4].map(i => (
              <div 
                key={i} 
                className={`h-4 w-1 rounded-full ${
                  i <= 3 ? 'bg-green-500' : 'bg-white/10'
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 🆕 图表区域 - 增强视觉效果 */}
      <div className="relative h-[200px] sm:h-[360px] w-full z-10 min-w-0 rounded-lg overflow-hidden border border-white/10 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent">
        {/* 加载指示器 */}
        {(!chartReady || lineData.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              <span className="text-xs text-white/40">Loading Chart...</span>
            </div>
          </div>
        )}
        {/* 🆕 添加微妙的背景网格效果 */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />
        <div 
          ref={chartContainerRef} 
          className="w-full h-full relative z-10"
        />
      </div>

      {/* 底部统计 */}
      <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-white/5 relative z-10 gap-y-4">
        <div className="flex gap-4 sm:gap-8 flex-wrap">
          <div className="min-w-[80px] sm:min-w-[100px]">
            <p className="text-[9px] text-white/30 uppercase mb-0.5">24h High</p>
            <p className="text-xs sm:text-sm font-bold text-green-400 tabular-nums">
              {(currentPrice * 1.008).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="min-w-[80px] sm:min-w-[100px]">
            <p className="text-[9px] text-white/30 uppercase mb-0.5">24h Low</p>
            <p className="text-xs sm:text-sm font-bold text-red-400 tabular-nums">
              {(currentPrice * 0.992).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="min-w-[100px] sm:min-w-[120px]">
            <p className="text-[9px] text-white/30 uppercase mb-0.5">{t.market?.volume24h || '24h Volume'}</p>
            <p className="text-xs sm:text-sm font-bold text-white/60 tabular-nums">
              {/* 修复：使用稳定的成交量显示，防止 Math.random 导致的剧烈抖动 */}
              ${Math.floor(3456789 + (currentPrice % 100) * 100).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="text-[9px] text-white/30">{t.market?.chartType || 'Chart Type'}:</span>
          <div className="flex rounded bg-white/5 p-0.5">
            {[
              { id: 'MINUTE', label: t.market?.minuteChart || '分时', sub: '1m' },
              { id: 'SECOND', label: t.market?.secondChart || '秒时', sub: '1s' }
            ].map(mode => (
              <button 
                key={mode.id}
                onClick={() => setChartMode(mode.id as ChartMode)}
                className={`px-2 py-0.5 text-[9px] font-bold rounded flex flex-col items-center min-w-[32px] transition-all ${
                  chartMode === mode.id ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
                }`}
              >
                <span>{mode.label}</span>
                <span className="text-[7px] opacity-50">{mode.sub}</span>
              </button>
            ))}
          </div>
          <span className="text-[9px] text-white/30 ml-2">{t.market?.timeframe || 'Timeframe'}:</span>
          <div className="flex rounded bg-white/5 p-0.5">
            {['1m', '5m', '15m', '1h'].map(tf => (
              <button 
                key={tf}
                className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                  tf === '1m' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}