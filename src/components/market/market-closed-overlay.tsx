"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";

interface MarketClosedOverlayProps {
  market: 'GOLD' | 'C10';
  onMarketChange?: (market: 'C10') => void;
}

export function MarketClosedOverlay({ market, onMarketChange }: MarketClosedOverlayProps) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const [countdown, setCountdown] = useState<string>('');

  const { data: marketStatus } = useQuery({
    queryKey: ["marketStatus", market],
    queryFn: () => api.getGoldMarketStatus(),
    enabled: market === 'GOLD',
    refetchInterval: 60000, // 每分钟刷新
  });

  // 倒计时更新
  useEffect(() => {
    if (!marketStatus?.nextOpenTime) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const openTime = new Date(marketStatus.nextOpenTime!).getTime();
      const diff = openTime - now;

      if (diff <= 0) {
        setCountdown('Opening soon...');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [marketStatus?.nextOpenTime]);

  // 只在黄金市场休市时显示
  if (market !== 'GOLD' || marketStatus?.isOpen !== false) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      {/* 金色边框装饰 */}
      <div className="absolute inset-4 border border-amber-900/30 rounded-xl pointer-events-none" />
      
      {/* 角落装饰 */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-amber-600/50 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-600/50 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-600/50 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-amber-600/50 rounded-br-lg" />

      <div className="text-center px-8 text-white">
        {/* 金条图标 */}
        <div className="mb-6 relative">
          <div className="w-24 h-24 mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg transform rotate-12 opacity-80" />
            <div className="absolute inset-2 bg-gradient-to-br from-amber-300 to-amber-500 rounded-lg transform rotate-6" />
            <div className="absolute inset-4 bg-gradient-to-br from-amber-200 to-amber-400 rounded-lg flex items-center justify-center">
              <span className="text-3xl">🏆</span>
            </div>
          </div>
          {/* 休市标识 */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-red-600 rounded-full">
            <span className="text-[10px] font-black uppercase tracking-widest text-white">CLOSED</span>
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 mb-2">
          {t.market.closed.goldTitle}
        </h2>
        <p className="text-sm text-white/50 mb-6 max-w-xs mx-auto">
          {t.market.closed.goldDesc}
        </p>

        {/* 倒计时 */}
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/60 mb-2">
            {t.market.closed.opensIn}
          </p>
          <div className="text-3xl sm:text-4xl font-black font-mono text-amber-400 tracking-wider">
            {countdown || '--:--:--'}
          </div>
        </div>

        {/* CTA 按钮 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onMarketChange?.('C10')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg text-sm font-bold text-white hover:scale-105 transition-transform shadow-lg shadow-purple-500/30"
          >
            {t.market.closed.switchToCrypto}
          </button>
          <Link
            href="/playground"
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            {t.market.closed.tryPlayground}
          </Link>
        </div>

        {/* 底部信息 */}
        <div className="mt-8 pt-4 border-t border-white/5">
          <p className="text-[10px] text-white/30 uppercase tracking-widest">
            {t.market.closed.hours}
          </p>
        </div>
      </div>
    </div>
  );
}
