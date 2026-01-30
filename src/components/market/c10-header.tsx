"use client";

import { useEffect, useState } from "react";
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";
import type { Market } from "../../lib/api";

interface C10MarketHeaderProps {
  market?: Market;
  isLoading?: boolean;
}

export function C10MarketHeader({ market, isLoading }: C10MarketHeaderProps) {
  const [heights, setHeights] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];

  useEffect(() => {
    setMounted(true);
    const count = window.innerWidth < 640 ? 12 : 24;
    setHeights(Array.from({ length: count }, () => 20 + Math.random() * 40));
    const interval = setInterval(() => {
      setHeights(prev => prev.map(() => 20 + Math.random() * 40));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3">
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-4xl font-black tracking-tighter text-white uppercase italic leading-none">
          {isLoading ? (t.market?.syncing || "SYNCING...") : (market?.title || "C10 INDEX")}
        </h1>
        <div className="text-[8px] sm:text-xs font-bold text-white/20 uppercase tracking-[0.3em] mt-1 space-y-1">
          {market ? (
            <>
              <p>{t.market?.pool || 'Pool'}: {market.totalPool ?? market.poolSize ?? 0} PTS</p>
              {market.yesProbability !== undefined && (
                <p className="text-[7px] sm:text-[10px]">
                  YES: {Math.round((market.yesProbability ?? 0) * 100)}% | 
                  NO: {Math.round((market.noProbability ?? 0) * 100)}%
                </p>
              )}
            </>
          ) : (
            <p>{t.market?.quantumTerminal || 'Quantum Terminal'}</p>
          )}
        </div>
      </div>

      <div className="flex h-12 sm:h-24 items-end gap-1 px-2">
        {heights.map((h, i) => (
          <div key={i} className="flex flex-col items-center w-2 sm:w-4">
            <div 
              className="w-full bg-gradient-to-t from-purple-500/20 to-cyan-400 rounded-t-[1px]"
              style={{ height: `${h}%`, transition: 'height 1s ease' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
