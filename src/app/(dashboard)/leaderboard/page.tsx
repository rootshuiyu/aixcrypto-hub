"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguageStore } from "../../../stores/language-store";
import { translations } from "../../../lib/translations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../hooks/use-auth";
import { FloatingOctopus, InkParticles, TentacleWaves } from "@/components/ui/octopus-decorations";
import { SparklesCore } from "@/components/aceternity/sparkles";
import { OctoLeaderboard, OctoSeason, OctoTournament } from "@/components/icons/octopus-icons";

// 章鱼主题图标
const OctoIcons = {
  Crown: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 18l3-8 5 4 2-10 2 10 5-4 3 8H2z" />
      <ellipse cx="12" cy="20" rx="5" ry="2" opacity="0.3" />
      <path d="M7 20c0 1 1 2 2 2" strokeLinecap="round" opacity="0.4" />
      <path d="M17 20c0 1-1 2-2 2" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  Silver: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="10" rx="6" ry="5" />
      <circle cx="10" cy="9" r="1.5" fill="currentColor" />
      <circle cx="14" cy="9" r="1.5" fill="currentColor" />
      <path d="M9 14c-1 2-1 4 0 5" strokeLinecap="round" opacity="0.5" />
      <path d="M12 15c0 2 0 4 0 5" strokeLinecap="round" opacity="0.4" />
      <path d="M15 14c1 2 1 4 0 5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  Bronze: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="10" rx="5" ry="4" />
      <circle cx="10" cy="9" r="1" fill="currentColor" />
      <circle cx="14" cy="9" r="1" fill="currentColor" />
      <path d="M8 13c-1 2 0 4 1 5" strokeLinecap="round" opacity="0.4" />
      <path d="M16 13c1 2 0 4-1 5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="9" rx="6" ry="5" />
      <circle cx="10" cy="8" r="1" fill="currentColor" />
      <circle cx="14" cy="8" r="1" fill="currentColor" />
      <path d="M7 13c-1 2-1 4 0 5" strokeLinecap="round" opacity="0.4" />
      <path d="M17 13c1 2 1 4 0 5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  Trophy: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M5 4H3v4a2 2 0 0 0 2 2" opacity="0.5" />
      <path d="M19 4h2v4a2 2 0 0 1-2 2" opacity="0.5" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" opacity="0.5" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" opacity="0.5" />
    </svg>
  ),
  Gift: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="8" width="18" height="14" rx="1" />
      <path d="M12 8v14M3 12h18" />
      <path d="M12 8c-2-4-6-4-6 0s4 0 6 0 8-4 6 0-6 0-6 0z" />
    </svg>
  ),
  Zap: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
};

// 章鱼领奖台卡片
const OctoPodiumCard = ({ user, rank, isCurrentUser, t }: any) => {
  const rankStyles: Record<number, { color: string; bg: string; glow: string; size: string }> = {
    1: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', glow: 'shadow-[0_0_50px_rgba(250,204,21,0.2)]', size: 'md:-translate-y-6' },
    2: { color: 'text-slate-400', bg: 'bg-slate-400/10', glow: '', size: '' },
    3: { color: 'text-amber-700', bg: 'bg-amber-700/10', glow: '', size: '' },
  };
  const style = rankStyles[rank] || rankStyles[3];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: rank === 1 ? 0.2 : rank === 2 ? 0.1 : 0.3, type: "spring" }}
      className={`relative group bg-gradient-to-b from-white/[0.05] to-transparent border rounded-3xl p-6 lg:p-8 text-center transition-all hover:border-cyan-500/30 ${
        rank === 1 
          ? `md:order-2 ${style.size} ring-2 ring-yellow-400/30 ${style.glow} border-yellow-400/20` 
          : rank === 2 
            ? 'md:order-1 border-white/10' 
            : 'md:order-3 border-white/10'
      } ${isCurrentUser ? 'ring-2 ring-purple-500/50' : ''}`}
    >
      {isCurrentUser && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-purple-500/20 rounded-full">
          <span className="text-[8px] font-black uppercase text-purple-400">{t?.leaderboard?.you || "You"}</span>
        </div>
      )}

      {/* 排名徽章 */}
      <motion.div 
        className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${style.bg} ${style.color} border border-white/10 backdrop-blur-xl`}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {rank}
      </motion.div>

      {/* 章鱼头像 */}
      <motion.div 
        className="w-20 h-20 mx-auto mb-6 relative"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <svg className="w-full h-full" viewBox="0 0 80 80" fill="none">
          <defs>
            <linearGradient id={`podiumGrad${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={rank === 1 ? "#fbbf24" : rank === 2 ? "#94a3b8" : "#b45309"} />
              <stop offset="100%" stopColor={rank === 1 ? "#f59e0b" : rank === 2 ? "#64748b" : "#92400e"} />
            </linearGradient>
          </defs>
          <ellipse cx="40" cy="30" rx="22" ry="18" fill={`url(#podiumGrad${rank})`} opacity="0.2" />
          <ellipse cx="40" cy="30" rx="22" ry="18" stroke={`url(#podiumGrad${rank})`} strokeWidth="2" fill="none" />
          <circle cx="33" cy="28" r="5" fill="white" />
          <circle cx="47" cy="28" r="5" fill="white" />
          <circle cx="33" cy="28" r="2.5" fill="#1a1a1a" />
          <circle cx="47" cy="28" r="2.5" fill="#1a1a1a" />
          <circle cx="31" cy="26" r="1.5" fill="white" opacity="0.8" />
          <circle cx="45" cy="26" r="1.5" fill="white" opacity="0.8" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.path
              key={i}
              d={`M ${18 + i * 8} 45 Q ${16 + i * 8} 60, ${12 + i * 10} 75`}
              stroke={`url(#podiumGrad${rank})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity={0.4 + (i % 3) * 0.15}
              animate={{
                d: [
                  `M ${18 + i * 8} 45 Q ${16 + i * 8} 60, ${12 + i * 10} 75`,
                  `M ${18 + i * 8} 45 Q ${20 + i * 8} 60, ${16 + i * 10} 75`,
                  `M ${18 + i * 8} 45 Q ${16 + i * 8} 60, ${12 + i * 10} 75`,
                ],
              }}
              transition={{ duration: 2 + i * 0.2, repeat: Infinity }}
            />
          ))}
        </svg>
        {rank === 1 && (
          <motion.div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 text-yellow-400"
            animate={{ y: [0, -3, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <OctoIcons.Crown />
          </motion.div>
        )}
      </motion.div>

      <h3 className="text-lg font-black tracking-tight text-white mb-2 truncate px-4">
        {user.username || 'Anonymous'}
      </h3>
      
      <div className="flex flex-col items-center">
        <p className={`text-2xl font-black ${style.color}`}>
          {Math.floor(user.score || user.pts).toLocaleString()}
          <span className="text-[10px] text-white/40 ml-1">PTS</span>
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t.leaderboard?.winRate || "Win Rate"}:</span>
          <span className="text-[11px] font-black text-green-500">{user.winRate || '0.0%'}</span>
        </div>
      </div>
    </motion.div>
  );
};

// 章鱼排行行
const OctoLeaderboardRow = ({ user, rank, isCurrentUser }: any) => (
  <motion.tr 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: (rank - 4) * 0.03 }}
    className={`group transition-colors ${
      isCurrentUser 
        ? 'bg-purple-500/10 hover:bg-purple-500/15' 
        : 'hover:bg-white/[0.02]'
    }`}
  >
    <td className="px-6 py-5">
      <span className={`text-sm font-black transition-colors ${
        isCurrentUser ? 'text-purple-400' : 'text-white/20 group-hover:text-cyan-400'
      }`}>
        {rank}
      </span>
    </td>
    <td className="px-6 py-5">
      <div className="flex items-center gap-4">
        <motion.div 
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isCurrentUser 
              ? 'bg-purple-500/20 text-purple-400' 
              : 'bg-cyan-500/10 text-cyan-400/60'
          }`}
          whileHover={{ scale: 1.1 }}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <ellipse cx="12" cy="10" rx="5" ry="4" />
            <circle cx="10" cy="9" r="1" fill="currentColor" />
            <circle cx="14" cy="9" r="1" fill="currentColor" />
            <path d="M8 13c-1 1 0 2 1 3" strokeLinecap="round" opacity="0.4" />
            <path d="M16 13c1 1 0 2-1 3" strokeLinecap="round" opacity="0.4" />
          </svg>
        </motion.div>
        <span className={`text-sm font-black truncate ${isCurrentUser ? 'text-purple-400' : 'text-white'}`}>
          {user.username || 'Anonymous'}
          {isCurrentUser && <span className="ml-2 text-[8px] text-purple-400/60">(You)</span>}
        </span>
      </div>
    </td>
    <td className="px-6 py-5">
      <span className="text-xs font-black text-green-500/80">{user.winRate || '0.0%'}</span>
    </td>
    <td className="px-6 py-5 text-right">
      <span className={`text-sm font-mono font-black ${isCurrentUser ? 'text-purple-400' : 'text-cyan-400'}`}>
        {Math.floor(user.score || user.pts).toLocaleString()}
        <span className="text-[9px] text-white/30 ml-1">PTS</span>
      </span>
    </td>
  </motion.tr>
);

// Loading骨架
function LeaderboardSkeleton() {
  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-4 w-32 bg-white/5 rounded mb-4 animate-pulse" />
        <div className="h-12 w-64 bg-white/5 rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-8 animate-pulse">
              <div className="w-20 h-20 rounded-full bg-white/10 mx-auto mb-6" />
              <div className="h-5 w-24 bg-white/10 mx-auto mb-2 rounded" />
              <div className="h-8 w-20 bg-white/10 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"global" | "season" | "tournaments">("global");

  // 全局排行榜
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => api.getLeaderboard(),
    refetchInterval: 60000,
  });

  // 当前活跃赛季
  const { data: activeSeason, isLoading: seasonLoading } = useQuery({
    queryKey: ["activeSeason"],
    queryFn: () => api.getActiveSeason(),
    staleTime: 60000,
  });

  // 赛季排行榜
  const { data: seasonLeaderboard, isLoading: seasonLeaderboardLoading } = useQuery({
    queryKey: ["seasonLeaderboard", activeSeason?.id],
    queryFn: () => api.getSeasonLeaderboard(activeSeason.id),
    enabled: !!activeSeason?.id && activeTab === "season",
  });

  // 锦标赛列表
  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => api.getTournaments(),
    staleTime: 30000,
    enabled: activeTab === "tournaments",
  });

  // 加入锦标赛
  const joinMutation = useMutation({
    mutationFn: (tournamentId: string) => api.joinTournament(tournamentId, authUser!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });

  // 计算剩余时间（支持多语言）
  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return t.leaderboard?.ended || "Ended";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) {
      const template = t.leaderboard?.daysHours || "{days}d {hours}h";
      return template.replace("{days}", String(days)).replace("{hours}", String(hours));
    }
    const template = t.leaderboard?.hoursLeft || "{hours}h left";
    return template.replace("{hours}", String(hours));
  };

  if (isLoading && activeTab === "global") return <LeaderboardSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-white">
        <motion.svg 
          className="w-24 h-24 text-red-500/50 mb-6"
          viewBox="0 0 80 80"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <ellipse cx="40" cy="35" rx="20" ry="15" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="35" cy="33" r="3" fill="currentColor" />
          <circle cx="45" cy="33" r="3" fill="currentColor" />
          <path d="M35 42 Q 40 38, 45 42" stroke="currentColor" strokeWidth="2" fill="none" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M ${25 + i * 8} 48 Q ${23 + i * 8} 60, ${20 + i * 10} 70`}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
            />
          ))}
        </motion.svg>
        <p className="text-lg font-bold text-white/60 mb-4">{t.leaderboard?.failed || "Failed to load leaderboard"}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-cyan-500 rounded-lg text-sm font-bold hover:bg-cyan-600 transition-colors"
        >
          {t.leaderboard?.retry || "Retry"}
        </button>
      </div>
    );
  }

  const top3 = leaderboard?.slice(0, 3) || [];
  const others = leaderboard?.slice(3) || [];
  const currentUserRank = authUser?.id ? leaderboard?.findIndex((u: any) => u.id === authUser.id) : -1;
  const currentUserData = currentUserRank !== undefined && currentUserRank >= 0 ? leaderboard?.[currentUserRank] : null;

  return (
    <div className="min-h-screen bg-transparent text-white relative overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <SparklesCore
          background="transparent"
          minSize={0.3}
          maxSize={0.8}
          particleDensity={20}
          particleColor="#a855f7"
          className="opacity-40"
        />
        <InkParticles count={30} />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/15 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/15 blur-[120px] rounded-full" />
      </div>
      <TentacleWaves />
      
      <FloatingOctopus className="absolute top-20 right-10 opacity-20 hidden xl:block" size="lg" color="purple" />
      <FloatingOctopus className="absolute top-1/2 left-5 opacity-15 hidden lg:block" size="md" color="cyan" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <motion.span 
              className="text-purple-400"
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <OctoLeaderboard className="w-8 h-8" />
            </motion.span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400">{t.leaderboard?.octopusHallOfFame || "Octopus Hall of Fame"}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight">
            {t.leaderboard?.eliteLeaderboard || "Elite Leaderboard"}
          </h1>
          <p className="mt-4 text-sm text-white/40 max-w-lg">
            {t.leaderboard?.pageDesc || "The mightiest octopi of the prediction seas. Will you claim your throne?"}
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {[
            { id: "global", label: t.leaderboard?.globalRankings || "Global Rankings", icon: <OctoLeaderboard className="w-4 h-4" /> },
            { id: "season", label: t.leaderboard?.season || "Season", icon: <OctoSeason className="w-4 h-4" /> },
            { id: "tournaments", label: t.leaderboard?.tournaments || "Tournaments", icon: <OctoTournament className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                  : 'bg-white/[0.03] text-white/40 border border-white/5 hover:text-white/60 hover:border-white/10'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-cyan-400' : ''}>{tab.icon}</span>
              {tab.label}
              {tab.id === "season" && activeSeason && (
                <span className="ml-1 px-2 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded-full">Live</span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Active Season Banner (when on season tab) */}
        {activeTab === "season" && activeSeason && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 relative rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-purple-500/5 to-pink-500/10 p-6 overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full"
              >
                <span className="text-[10px] font-black uppercase text-green-400">{t.leaderboard?.activeSeason || "Active Season"}</span>
              </motion.div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <motion.span 
                    className="text-cyan-400"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <OctoSeason className="w-6 h-6" />
                  </motion.span>
                  <h3 className="text-2xl font-black text-white">{activeSeason.name}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                  <span className="flex items-center gap-1">
                    <OctoIcons.Calendar />
                    {new Date(activeSeason.startDate).toLocaleDateString()} - {new Date(activeSeason.endDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400">
                    <OctoIcons.Clock />
                    {getTimeRemaining(activeSeason.endDate)}
                  </span>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{t.leaderboard?.prizePool || "Prize Pool"}</p>
                <p className="text-3xl font-black text-yellow-400">{(activeSeason.prizePool || 0).toLocaleString()} PTS</p>
              </div>
            </div>

            {/* 触手装饰 */}
            <svg className="absolute bottom-0 left-0 w-32 h-16 text-cyan-500/10" viewBox="0 0 120 60" preserveAspectRatio="none">
              <path d="M0 60 Q 30 40, 60 50 T 120 40" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>
          </motion.div>
        )}

        {/* Tournaments Tab Content */}
        {activeTab === "tournaments" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            {tournamentsLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : tournaments && tournaments.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {tournaments.map((tournament: any) => {
                  const isParticipant = tournament.participants?.some((p: any) => p.userId === authUser?.id);
                  const isActive = tournament.status === "ACTIVE";
                  const isUpcoming = tournament.status === "UPCOMING";
                  
                  return (
                    <motion.div
                      key={tournament.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative rounded-2xl border p-6 transition-all hover:scale-[1.02] ${
                        isActive
                          ? 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent'
                          : isUpcoming
                          ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent'
                          : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      {/* 状态徽章 */}
                      <div className="absolute top-4 right-4">
                        <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-full ${
                          isActive ? 'bg-green-500/20 text-green-400' :
                          isUpcoming ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/40'
                        }`}>
                          {isActive ? (t.leaderboard?.active || "Active") : 
                           isUpcoming ? (t.leaderboard?.upcoming || "Upcoming") : 
                           (t.leaderboard?.ended || "Ended")}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="text-cyan-400"
                        >
                          <OctoTournament className="w-6 h-6" />
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-black text-white">{tournament.name}</h3>
                          <p className="text-xs text-white/40">{tournament.type?.replace(/_/g, " ")}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-white/40">{t.leaderboard?.prizePool || "Prize Pool"}</p>
                          <p className="text-xl font-black text-yellow-400">{(tournament.prizePool || 0).toLocaleString()} PTS</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-white/40">{t.leaderboard?.entry || "Entry"}</p>
                          <p className="text-xl font-black text-white">{tournament.entryFee > 0 ? `${tournament.entryFee} PTS` : (t.leaderboard?.free || 'Free')}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-white/50">
                          <span className="flex items-center gap-1">
                            <OctoIcons.Users />
                            {tournament._count?.participants || 0}/{tournament.maxPlayers}
                          </span>
                          <span className="flex items-center gap-1">
                            <OctoIcons.Clock />
                            {getTimeRemaining(tournament.endDate)}
                          </span>
                        </div>
                        
                        {authUser && tournament.status !== "ENDED" && (
                          <button
                            onClick={() => !isParticipant && joinMutation.mutate(tournament.id)}
                            disabled={isParticipant || joinMutation.isPending}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                              isParticipant
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                            }`}
                          >
                            {isParticipant ? `✓ ${t.leaderboard?.joined || 'Joined'}` : joinMutation.isPending ? (t.leaderboard?.joining || 'Joining...') : (t.leaderboard?.join || 'Join')}
                          </button>
                        )}
                      </div>

                      {/* 触手装饰 */}
                      <svg className="absolute bottom-0 right-0 w-16 h-10 text-white/5" viewBox="0 0 60 40">
                        <path d="M60 40 Q 45 25, 35 35 T 15 40" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/[0.02] border border-white/10 rounded-2xl">
                <OctoTournament className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <p className="text-lg font-bold text-white/40">{t.leaderboard?.noTournamentsAvailable || "No tournaments available"}</p>
                <p className="text-sm text-white/20 mt-1">{t.leaderboard?.checkBackLater || "Check back later for upcoming competitions"}</p>
              </div>
            )}

            {/* 查看更多链接 */}
            <div className="mt-6 text-center">
              <Link
                href="/tournaments"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:border-cyan-500/30 transition-all"
              >
                <OctoTournament className="w-4 h-4" />
                {t.leaderboard?.viewAllTournaments || "View All Tournaments"}
              </Link>
            </div>
          </motion.div>
        )}

        {/* Leaderboard Content (Global or Season) */}
        {(activeTab === "global" || activeTab === "season") && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* 当前用户排名 */}
              {authUser && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <OctoIcons.User />
                      </motion.div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          {t.leaderboard?.yourRank || "Your"} {activeTab === "season" ? (t.leaderboard?.season || "Season") : (t.leaderboard?.globalRankings || "Global")}
                        </p>
                        <p className="text-2xl font-black text-white">
                          {(() => {
                            const data = activeTab === "season" ? seasonLeaderboard : leaderboard;
                            const rank = data?.findIndex((u: any) => u.id === authUser.id || u.userId === authUser.id);
                            return rank !== undefined && rank >= 0 ? `#${rank + 1}` : (t.leaderboard?.notRanked || "Not Ranked");
                          })()}
                        </p>
                      </div>
                    </div>
                    {currentUserData && (
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">{t.leaderboard?.score || "Score"}</p>
                          <p className="text-lg font-black text-purple-400">{Math.floor(currentUserData.score || currentUserData.pts || currentUserData.totalPts || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">{t.leaderboard?.winRate || "Win Rate"}</p>
                          <p className="text-lg font-black text-green-500">{currentUserData.winRate || '0.0%'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Loading State */}
              {(activeTab === "season" && seasonLeaderboardLoading) && (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              )}

              {/* No Active Season */}
              {activeTab === "season" && !seasonLoading && !activeSeason && (
                <div className="text-center py-16 bg-white/[0.02] border border-white/10 rounded-2xl">
                  <OctoSeason className="w-12 h-12 mx-auto text-white/20 mb-4" />
                  <p className="text-lg font-bold text-white/40">{t.leaderboard?.noActiveSeason || "No Active Season"}</p>
                  <p className="text-sm text-white/20 mt-1">{t.season?.checkBackLater || "Check back later for the next season"}</p>
                  <Link
                    href="/season"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white/60 hover:text-white transition-all"
                  >
                    {t.leaderboard?.viewSeasonDetails || "View Season History"}
                  </Link>
                </div>
              )}

              {/* Top 3 Podium */}
              {(() => {
                const data = activeTab === "season" ? seasonLeaderboard : leaderboard;
                const top3 = data?.slice(0, 3) || [];
                return top3.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
                    {[top3[1], top3[0], top3[2]].filter(Boolean).map((user: any, i: number) => {
                      const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
                      const userData = activeTab === "season" ? { 
                        ...user, 
                        username: user.user?.username || user.username,
                        score: user.totalPts || user.score || user.pts,
                        id: user.userId || user.id 
                      } : user;
                      return (
                        <OctoPodiumCard 
                          key={userData.id}
                          user={userData}
                          rank={rank}
                          isCurrentUser={authUser?.id === userData.id || authUser?.id === user.userId}
                          t={t}
                        />
                      );
                    })}
                  </div>
                );
              })()}

              {/* Rest of Rankings */}
              {(() => {
                const data = activeTab === "season" ? seasonLeaderboard : leaderboard;
                const others = data?.slice(3) || [];
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden"
                  >
                    <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
                      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                        {activeTab === "season" ? (t.leaderboard?.seasonStandings || "Season Standings") : (t.leaderboard?.globalStandings || "Global Standings")}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-cyan-400">{t.leaderboard?.live || "Live"}</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[500px]">
                        <thead>
                          <tr className="text-left text-[10px] font-black uppercase tracking-widest text-white/20 border-b border-white/5">
                            <th className="px-6 py-4">{t.leaderboard?.rankColumn || "# Rank"}</th>
                            <th className="px-6 py-4">{t.leaderboard?.octopus || "Octopus"}</th>
                            <th className="px-6 py-4">{t.leaderboard?.winRate || "Win Rate"}</th>
                            <th className="px-6 py-4 text-right">{activeTab === "season" ? (t.leaderboard?.seasonStandings || "Season PTS") : (t.leaderboard?.score || "Score")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                          {others.length > 0 ? others.map((user: any, index: number) => {
                            const userData = activeTab === "season" ? { 
                              ...user, 
                              username: user.user?.username || user.username,
                              score: user.totalPts || user.score || user.pts,
                              id: user.userId || user.id 
                            } : user;
                            return (
                              <OctoLeaderboardRow 
                                key={userData.id}
                                user={userData}
                                rank={index + 4}
                                isCurrentUser={authUser?.id === userData.id || authUser?.id === user.userId}
                              />
                            );
                          }) : (
                            <tr>
                              <td colSpan={4} className="px-8 py-20 text-center text-white/20 font-black uppercase tracking-widest text-xs">
                                {t.leaderboard?.noRankingsYet || "No rankings yet"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Season Page Link */}
              {activeTab === "season" && activeSeason && (
                <div className="mt-6 text-center">
                  <Link
                    href="/season"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:border-cyan-500/30 transition-all"
                  >
                    <OctoIcons.Gift />
                    {t.leaderboard?.viewSeasonRewards || "View Season Rewards & Details"}
                  </Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
