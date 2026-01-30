"use client";

import { useEffect, useState } from "react";
import { api, Market } from "../../lib/api";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(1)}K`;
  }
  return `$${volume.toFixed(0)}`;
}

function formatTimeLeft(endTime: string | Date): string {
  const end = new Date(endTime);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return "已结束";
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} 天后`;
  if (hours > 0) return `${hours} 小时后`;
  return `${minutes} 分钟后`;
}

// 骨架屏组件
function MarketSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1">
          <Skeleton className="h-3 w-16 mb-3" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="text-right">
          <Skeleton className="h-3 w-12 mb-2" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function MarketPreview() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoading(true);
        const data = await api.getMarkets();
        const sorted = data
          .filter(m => m.status === 'ACTIVE')
          .sort((a, b) => (b.totalPool || 0) - (a.totalPool || 0))
          .slice(0, 3);
        setMarkets(sorted);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch markets:", err);
        setError("loadFailed");
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
    const interval = setInterval(fetchMarkets, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass rounded-3xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/50">{t.marketPreview?.hotMarkets ?? "Hot Markets"}</p>
          <h2 className="mt-2 text-2xl font-semibold">{t.marketPreview?.s1ArenaPicks ?? "S1 Arena Picks"}</h2>
        </div>
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs text-white/70 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          {t.marketPreview?.liveUpdate ?? "Live"}
        </span>
      </div>

      <div className="mt-8 space-y-6">
        {/* Loading 骨架屏 */}
        {loading && markets.length === 0 && (
          <>
            <MarketSkeleton />
            <MarketSkeleton />
            <MarketSkeleton />
          </>
        )}

        {/* 错误状态 */}
        {error && markets.length === 0 && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-center">
            <p className="text-sm text-red-400">{t.stats?.loadFailed ?? "Load failed"}</p>
            <p className="text-xs text-white/40 mt-2">{t.marketPreview?.tryLater ?? "Try again later"}</p>
          </div>
        )}

        {!loading && !error && markets.length === 0 && (
          <div className="rounded-2xl border border-white/10 p-5 text-center">
            <p className="text-sm text-white/50">{t.marketPreview?.noActiveMarkets ?? "No active markets"}</p>
            <p className="text-xs text-white/30 mt-2">{t.marketPreview?.comingSoon ?? "Coming soon"}</p>
          </div>
        )}

        {/* 市场列表 */}
        {markets.map((market) => {
          const yesProbability = market.yesProbability ?? 0.5;
          const noProbability = market.noProbability ?? 0.5;
          const volume = market.totalPool || market.volume || 0;
          
          return (
            <div key={market.id} className="rounded-2xl border border-white/10 p-5 transition-all hover:border-white/20 hover:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-white/40">{market.category} · {market.timeframe}</p>
                  <p className="mt-2 text-lg font-semibold">{market.title}</p>
                </div>
                <div className="text-right text-xs text-white/60">
                  <p>{t.marketPreview?.poolLabel ?? "Pool"}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{formatVolume(volume)}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs text-white/60">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-neon-purple" />
                    YES / LONG
                  </span>
                  <span>{Math.round(yesProbability * 100)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500" 
                    style={{ width: `${yesProbability * 100}%` }} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-neon-pink" />
                    NO / SHORT
                  </span>
                  <span>{Math.round(noProbability * 100)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-500" 
                    style={{ width: `${noProbability * 100}%` }} 
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-white/50">
                <span>截止 {formatTimeLeft(market.resolutionTime || market.endTime || new Date())}</span>
                <Link 
                  href="/market"
                  className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 hover:text-white hover:border-white/40 transition-all"
                >
                  {t.marketPreview?.enterMarket ?? "Enter Market"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* 查看更多按钮 */}
      {markets.length > 0 && (
        <div className="mt-6 text-center">
          <Link 
            href="/market"
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            {t.marketPreview?.viewAllMarkets ?? "View all markets →"}
          </Link>
        </div>
      )}
    </div>
  );
}
