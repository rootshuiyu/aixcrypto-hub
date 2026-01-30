"use client";

import { useMemo, useEffect, useState } from "react";
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";

interface VolatilityAmplifierProps {
  currentPrice: number;
  previousPrice: number;
  market: 'C10' | 'GOLD';
  showBar?: boolean;
}

/**
 * 波动率放大器组件
 * 将黄金的微小价格变动（如 0.02%）放大显示为更明显的视觉效果
 */
export function VolatilityAmplifier({ 
  currentPrice, 
  previousPrice, 
  market,
  showBar = true 
}: VolatilityAmplifierProps) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const [animatedValue, setAnimatedValue] = useState(0);

  // 计算实际波动率
  const volatility = useMemo(() => {
    if (!previousPrice || previousPrice === 0) return 0;
    return ((currentPrice - previousPrice) / previousPrice) * 100;
  }, [currentPrice, previousPrice]);

  // 🆕 黄金市场放大系数更高（因为波动更小）
  const amplificationFactor = market === 'GOLD' ? 50 : 10;
  const amplifiedVolatility = volatility * amplificationFactor;

  // 动画效果
  useEffect(() => {
    const target = Math.min(Math.abs(amplifiedVolatility), 100);
    const step = (target - animatedValue) / 10;
    
    const timer = setInterval(() => {
      setAnimatedValue(prev => {
        const next = prev + step;
        if (Math.abs(next - target) < 0.1) {
          clearInterval(timer);
          return target;
        }
        return next;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [amplifiedVolatility]);

  const isPositive = volatility >= 0;
  const isGold = market === 'GOLD';

  // 根据波动率决定颜色强度
  const getIntensityColor = () => {
    const absVol = Math.abs(amplifiedVolatility);
    if (isGold) {
      if (absVol > 50) return 'from-amber-400 to-amber-600';
      if (absVol > 25) return 'from-amber-300 to-amber-500';
      return 'from-amber-200/50 to-amber-400/50';
    } else {
      if (absVol > 50) return isPositive ? 'from-green-400 to-green-600' : 'from-red-500 to-red-700';
      if (absVol > 25) return isPositive ? 'from-green-300 to-green-500' : 'from-red-400 to-red-600';
      return isPositive ? 'from-green-200/50 to-green-400/50' : 'from-red-200/50 to-red-400/50';
    }
  };

  const pulseSpeed = Math.max(0.5, 2 - Math.abs(amplifiedVolatility) / 50);

  return (
    <div className={`rounded-lg p-3 ${
      isGold 
        ? 'bg-gradient-to-br from-amber-950/30 to-emerald-950/30 border border-amber-800/20' 
        : 'bg-white/5 border border-white/10'
    } text-white`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className={`w-2 h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
            style={{
              animation: `pulse ${pulseSpeed}s infinite`,
              boxShadow: `0 0 ${Math.min(10, Math.abs(amplifiedVolatility / 5))}px ${isPositive ? '#22c55e' : '#ef4444'}`
            }}
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
            {isGold ? `🥇 ${t.market?.volatility?.gold || 'Gold Volatility'}` : `📊 ${t.market?.volatility?.crypto || 'C10 Volatility'}`}
          </span>
        </div>
        <span className="text-[9px] text-white/30">
          {amplificationFactor}{t.market?.volatility?.amp || 'x Amp'}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-2xl font-black tabular-nums ${
          isPositive 
            ? (isGold ? 'text-amber-400' : 'text-green-500') 
            : 'text-red-500'
        }`}>
          {isPositive ? '+' : ''}{amplifiedVolatility.toFixed(1)}%
        </span>
        <span className="text-xs text-white/30">
          ({isPositive ? '+' : ''}{volatility.toFixed(4)}% {t.market?.volatility?.actual || 'actual'})
        </span>
      </div>

      {showBar && (
        <div className="relative h-3 bg-black/40 rounded-full overflow-hidden">
          <div 
            className={`absolute inset-0 bg-gradient-to-r ${getIntensityColor()} opacity-20 animate-pulse`}
          />
          <div 
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getIntensityColor()} rounded-full transition-all duration-300`}
            style={{ 
              width: `${animatedValue}%`,
            }}
          />
          <div className="absolute top-0 left-1/2 w-px h-full bg-white/20" />
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-[9px] text-white/30 font-bold uppercase">
        <span>{t.market?.volatility?.low || 'Low'}</span>
        <span>{t.market?.volatility?.medium || 'Medium'}</span>
        <span>{t.market?.volatility?.high || 'High'}</span>
      </div>
    </div>
  );
}
