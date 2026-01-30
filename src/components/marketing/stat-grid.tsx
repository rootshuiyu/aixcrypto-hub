"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Skeleton } from "../ui/skeleton";
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";

interface Stats {
  activeUsers: number;
  totalTVL: number;
  totalMarkets: number;
  medianWinRate: number;
  volume24h: number;
  totalBets: number;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return `$${num.toFixed(0)}`;
}

function formatCount(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

export function StatGrid() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.getPublicStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("loadFailed");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // 骨架屏 Loading 状态
  if (loading && !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <Skeleton className="h-3 w-24 mb-4" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
    );
  }

  // 错误状态使用默认数据
  const displayStats = stats || {
    activeUsers: 0,
    totalTVL: 0,
    totalMarkets: 0,
    medianWinRate: 50,
    volume24h: 0,
    totalBets: 0,
  };

  const statItems = [
    { label: t.stats?.activePredictors ?? "Active Predictors", value: formatCount(displayStats.activeUsers) },
    { label: t.stats?.totalTVL ?? "Total TVL", value: formatNumber(displayStats.totalTVL) },
    { label: t.stats?.aiSignalCoverage ?? "AI Signal Coverage", value: `${displayStats.totalMarkets}${t.stats?.marketsCount ?? ""}` },
    { label: t.stats?.medianWinRate ?? "Median Win Rate", value: `${displayStats.medianWinRate}%` },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat) => (
        <div key={stat.label} className="glass rounded-2xl p-5 transition-all hover:scale-[1.02]">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">{stat.label}</p>
          <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
          {error && <p className="mt-1 text-xs text-red-400/60">{t.stats?.loadFailed ?? "Load failed"}</p>}
        </div>
      ))}
    </div>
  );
}
