"use client";

import { useQuery } from "@tanstack/react-query";
import { useLanguageStore } from "../../../stores/language-store";
import { translations } from "../../../lib/translations";
import { useAuth } from "../../../hooks/use-auth";
import { useProfile } from "../../../hooks/use-profile";
import { api } from "../../../lib/api";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  TrendingUp, 
  Trophy, 
  Cpu, 
  Target, 
  Wallet, 
  ArrowUpRight,
  ShieldCheck,
  Zap
} from "lucide-react";

// Aceternity UI 组件
import { SparklesCore } from "@/components/aceternity/sparkles";
import { Meteors } from "@/components/aceternity/meteors";
import { GlowingCard } from "@/components/aceternity/glowing-card";
import { FlipWords } from "@/components/aceternity/text-generate";

// 带发光效果的动作卡片
const ActionCard = ({ 
  href, 
  title, 
  subtitle, 
  icon: Icon, 
  color,
  glowColor
}: { 
  href: any; 
  title: string; 
  subtitle: string; 
  icon: any; 
  color: string;
  glowColor?: string;
}) => (
  <Link href={href}>
    <GlowingCard 
      glowColor={glowColor || "rgba(6, 182, 212, 0.4)"}
      containerClassName="h-full"
      className="h-full"
    >
      <motion.div 
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden p-6 h-full"
      >
        {/* 流星效果 - 只在悬停时显示 */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <Meteors number={8} />
        </div>
        
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-${color}/10 text-${color} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-${color}/20`}>
          <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold text-white group-hover:text-white/90">{title}</h3>
        <p className="mt-1 text-sm text-white/40 group-hover:text-white/60">{subtitle}</p>
        
        {/* 装饰性元素 */}
        <div className="absolute top-4 right-4 text-white/10 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
          <ArrowUpRight size={20} />
        </div>
        <div className={`absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-${color}/5 blur-2xl group-hover:bg-${color}/10 transition-all duration-500`} />
      </motion.div>
    </GlowingCard>
  </Link>
);

const StatItem = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm">
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${color}/10 text-${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-white/30">{label}</p>
      <p className="text-lg font-bold text-white leading-tight">{value}</p>
    </div>
  </div>
);

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  amount: number;
  position?: string;
  status: string;
  time: string;
};

export default function DashboardHomePage() {
  const { user, isConnected } = useAuth();
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const { profile, isLoading } = useProfile(user?.id || "");

  const userId = user?.id || (profile as { id?: string })?.id;
  const { data: recentActivityData, isLoading: activityLoading, isError: activityError, refetch: refetchActivity } = useQuery({
    queryKey: ["userRecentActivity", userId],
    queryFn: () => api.getRecentActivity(userId, 10),
    enabled: !!userId,
    staleTime: 15_000,
  });
  const activities = (recentActivityData?.activities ?? []) as ActivityItem[];

  const username = user?.username || "Explorer";

  const dh = t.dashboardHome || {};
  const formatActivityTime = (time: string) => {
    const d = new Date(time);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return dh.justNow ?? "Just now";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}${dh.minutesAgo ?? " min ago"}`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}${dh.hoursAgo ?? " hr ago"}`;
    return d.toLocaleDateString();
  };

  const flipWords = (dh.flipWords as string[]) || ["PREDICTION", "BATTLE", "VICTORY", "PROFIT"];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-transparent">
      {/* 闪烁星星效果 */}
      <div className="absolute inset-0 z-0">
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={30}
          particleColor="#06b6d4"
        />
      </div>

      {/* 流星雨效果 */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Meteors number={15} />
      </div>

      {/* 内容层 */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* 顶部欢迎区 */}
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
              {dh.welcomeBack ?? "WELCOME BACK, "}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent ml-2 uppercase">
                {username}
              </span>
            </h1>
            <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-white/30 sm:text-base flex items-center gap-2">
              {dh.readyFor ?? "Ready for your next "}
              <FlipWords 
                words={flipWords} 
                duration={2000} 
                className="text-cyan-400 font-bold"
              />
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            <StatItem 
              label={dh.points ?? "Points"} 
              value={profile?.points?.toLocaleString() || "0"} 
              icon={Zap} 
              color="yellow-400" 
            />
            <StatItem 
              label={dh.rank ?? "Rank"} 
              value={profile?.rank ? `#${profile.rank}` : (dh.unranked ?? "UNRANKED")} 
              icon={Trophy} 
              color="purple-400" 
            />
          </motion.div>
        </div>

        {/* 快速入口网格 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ActionCard 
              href="/market"
              title={t.sidebar?.market ?? "Markets"}
              subtitle={dh.marketSubtitle ?? "Predict price moves & earn"}
              icon={TrendingUp}
              color="cyan-400"
              glowColor="rgba(6, 182, 212, 0.4)"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <ActionCard 
              href="/playground"
              title={t.sidebar?.playground ?? "AI Arena"}
              subtitle={dh.playgroundSubtitle ?? "Train and battle with AI"}
              icon={Cpu}
              color="purple-400"
              glowColor="rgba(168, 85, 247, 0.4)"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <ActionCard 
              href="/leaderboard"
              title={t.sidebar?.leaderboard ?? "Rankings"}
              subtitle={dh.leaderboardSubtitle ?? "Check global standings"}
              icon={Trophy}
              color="yellow-400"
              glowColor="rgba(250, 204, 21, 0.4)"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <ActionCard 
              href="/tasks"
              title={t.sidebar?.tasks ?? "Quests"}
              subtitle={dh.tasksSubtitle ?? "Complete daily missions"}
              icon={Target}
              color="rose-400"
              glowColor="rgba(251, 113, 133, 0.4)"
            />
          </motion.div>
        </div>

        {/* 底部功能区：个人概览和系统状态 */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* 最近活动 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2 rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-md"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck size={20} className="text-cyan-400" />
                {t.profile?.recent || "最近动态"}
              </h2>
              <Link href="/portfolio" className="text-xs font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300">
                {dh.viewAll ?? "View All →"}
              </Link>
            </div>
            
            <div className="space-y-4">
              {activityLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-white/5" />)}
                </div>
              ) : activityError ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-amber-400/90 text-sm font-medium mb-3">{dh.loadFailed ?? "Load failed. Check network or refresh."}</p>
                  <button
                    type="button"
                    onClick={() => refetchActivity()}
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold uppercase text-white/80 hover:bg-white/10 transition-colors"
                  >
                    {dh.retry ?? "Retry"}
                  </button>
                </div>
              ) : activities.length > 0 ? (
                <ul className="space-y-3">
                  {activities.slice(0, 8).map((a) => (
                    <li key={a.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white/90">{a.title}</p>
                        <p className="text-xs text-white/40">
                          {a.type} · {a.position ?? ""} · {formatActivityTime(a.time)}
                        </p>
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        <span className="text-sm font-black text-cyan-400">{Number(a.amount).toLocaleString()} PTS</span>
                        <span className={`ml-2 text-[10px] font-bold uppercase ${a.status === "WIN" || a.status === "WON" ? "text-green-400" : a.status === "LOST" || a.status === "LOSE" ? "text-red-400" : "text-white/40"}`}>
                          {a.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : !userId ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-white/40 text-sm font-medium">{dh.loginToViewActivity ?? "Please login to view recent activity"}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-white/10">
                    <TrendingUp size={32} />
                  </div>
                  <p className="text-white/30 font-medium tracking-wide">
                    {dh.noActivityYet ?? t.common?.noData ?? "No activity yet. Start your first prediction!"}
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchActivity()}
                    className="mt-4 text-xs font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {dh.refresh ?? "Refresh"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* 账户卡片 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="rounded-3xl border border-white/5 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 p-8 backdrop-blur-md"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Wallet size={20} className="text-purple-400" />
              {t.profile?.connectedAccounts || "账户概览"}
            </h2>
            
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wider text-white/30">{dh.totalBalance ?? "Total Balance"}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{profile?.balance || "0.00"}</span>
                  <span className="text-sm font-bold text-purple-400">USDT</span>
                </div>
              </div>

              <div className="h-px w-full bg-white/5" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">{dh.winRate ?? "Win Rate"}</span>
                  <p className="text-lg font-black text-green-400">{profile?.winRate || "0%"} </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">{dh.activeMarkets ?? "Active Markets"}</span>
                  <p className="text-lg font-black text-cyan-400">{profile?.activePositions || "0"}</p>
                </div>
              </div>

              <Link href="/profile">
                <button className="mt-4 w-full rounded-xl bg-white py-3 text-sm font-black uppercase tracking-widest text-black transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {dh.manageWallet ?? "Manage Wallet"}
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
