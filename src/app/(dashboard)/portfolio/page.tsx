"use client";

import { useQuery } from "@tanstack/react-query";
import { useLanguageStore } from "../../../stores/language-store";
import { translations } from "../../../lib/translations";
import { useAuth } from "../../../hooks/use-auth";
import { useProfile } from "../../../hooks/use-profile";
import { api } from "../../../lib/api";
import { MarketTrend } from "../../../components/charts/market-trend";
import { ShieldCheck, TrendingUp } from "lucide-react";
import Link from "next/link";

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  amount: number;
  position?: string;
  status: string;
  time: string;
};

function formatActivityTime(time: string) {
  const d = new Date(time);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "刚刚";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  return d.toLocaleDateString();
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const { profile, isLoading: profileLoading } = useProfile(user?.id || "");

  const userId = user?.id || (profile as { id?: string })?.id;
  const { data: recentActivityData, isLoading: activityLoading } = useQuery({
    queryKey: ["userRecentActivity", userId],
    queryFn: () => api.getRecentActivity(userId, 20),
    enabled: !!userId,
    staleTime: 15_000,
  });
  const { data: seasonLevelData, isLoading: seasonLoading } = useQuery({
    queryKey: ["userSeasonLevel", userId],
    queryFn: () => api.getSeasonLevel(userId),
    enabled: !!userId,
    staleTime: 60_000,
  });
  const { data: profitCurveData } = useQuery({
    queryKey: ["userProfitCurve", userId],
    queryFn: () => api.getProfitCurve(userId, 30),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const activities = (recentActivityData?.activities ?? []) as ActivityItem[];
  const seasonLevel = seasonLevelData?.level ?? "—";
  const seasonRank = seasonLevelData?.rank;
  const seasonName = seasonLevelData?.seasonName;
  const curve = (profitCurveData?.curve ?? []) as { date: string; pnl: number; cumulativePnl: number }[];
  const totalCumulativePnl = curve.length > 0 ? curve[curve.length - 1].cumulativePnl : null;

  return (
    <div className="relative overflow-hidden px-6 pb-24 pt-10 md:px-12 lg:px-20">
      <div className="glass rounded-3xl p-8">
        <h1 className="text-3xl font-semibold">{t.portfolio.title}</h1>
        <p className="mt-2 text-sm text-white/60">{t.portfolio.desc}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-xs text-white/40">{t.portfolio.currentPoints}</p>
            <p className="mt-2 text-2xl font-semibold">
              {profileLoading ? "—" : (profile?.pts ?? profile?.points ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-xs text-white/40">{t.portfolio.winRate}</p>
            <p className="mt-2 text-2xl font-semibold">
              {profileLoading ? "—" : profile?.winRate ? `${(Number(profile.winRate) * 100).toFixed(1)}%` : "0%"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-xs text-white/40">{t.portfolio.seasonLevel}</p>
            <p className="mt-2 text-2xl font-semibold">
              {seasonLoading ? "—" : seasonRank != null ? `#${seasonRank} ${seasonLevel}` : seasonLevel}
            </p>
            {seasonName && (
              <p className="mt-1 text-[10px] text-white/30 truncate" title={seasonName}>{seasonName}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <MarketTrend
          title={t.portfolio.profitCurve}
          value={
            totalCumulativePnl != null
              ? `${totalCumulativePnl >= 0 ? "+" : ""}${totalCumulativePnl.toFixed(0)} PTS`
              : "—"
          }
        />
        <MarketTrend title={t.portfolio.exposure} value={t.portfolio.neutral} />
      </div>

      <div className="mt-8 glass rounded-3xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck size={20} className="text-cyan-400" />
            {t.profile?.recent || "最近活动"}
          </h2>
          <Link href="/home" className="text-xs font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300">
            返回首頁
          </Link>
        </div>
        {!userId ? (
          <p className="text-white/40 text-sm py-8 text-center">请先登录后查看最近活动</p>
        ) : activityLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5" />
            ))}
          </div>
        ) : activities.length > 0 ? (
          <ul className="space-y-3">
            {activities.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white/90">{a.title}</p>
                  <p className="text-xs text-white/40">
                    {a.type} · {a.position ?? ""} · {formatActivityTime(a.time)}
                  </p>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <span className="text-sm font-black text-cyan-400">
                    {Number(a.amount).toLocaleString()} PTS
                  </span>
                  <span
                    className={`ml-2 text-[10px] font-bold uppercase ${
                      a.status === "WIN" || a.status === "WON"
                        ? "text-green-400"
                        : a.status === "LOST" || a.status === "LOSE"
                          ? "text-red-400"
                          : "text-white/40"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-white/10">
              <TrendingUp size={32} />
            </div>
            <p className="text-white/30 font-medium tracking-wide">
              {t.common?.noData || "暂无最新动态，快去开启你的第一场预测吧！"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
