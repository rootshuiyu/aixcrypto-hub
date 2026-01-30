"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// 图标组件
const Icons = {
  Trophy: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M5 4H3v4a2 2 0 0 0 2 2" />
      <path d="M19 4h2v4a2 2 0 0 1-2 2" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Gift: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Star: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Medal: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
};

// 排名徽章
const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-sm font-bold text-white/40">#{rank}</span>;
};

export default function SeasonPage() {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"leaderboard" | "myStats" | "rewards">("leaderboard");

  // 获取当前活跃赛季
  const { data: activeSeason, isLoading: seasonLoading } = useQuery({
    queryKey: ["activeSeason"],
    queryFn: () => api.getActiveSeason(),
    staleTime: 60000,
  });

  // 获取赛季排行榜
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["seasonLeaderboard", activeSeason?.id],
    queryFn: () => api.getSeasonLeaderboard(activeSeason.id),
    enabled: !!activeSeason?.id,
  });

  // 获取历史赛季
  const { data: seasonList } = useQuery({
    queryKey: ["seasonList"],
    queryFn: () => api.getSeasonList(),
    staleTime: 300000,
  });

  // 计算剩余时间
  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // 解析奖励配置
  const parseRewards = (rewardsJson: string | null) => {
    if (!rewardsJson) return null;
    try {
      return JSON.parse(rewardsJson);
    } catch {
      return null;
    }
  };

  const rewards = parseRewards(activeSeason?.rewards);

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Competition</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-2 flex items-center gap-3">
            <Icons.Trophy />
            Season Rankings
          </h1>
          <p className="text-sm text-white/40 mt-2">
            Compete with other traders and climb the leaderboard
          </p>
        </div>

        {/* Active Season Card */}
        {seasonLoading ? (
          <div className="animate-pulse h-48 rounded-2xl bg-white/5 mb-8" />
        ) : activeSeason ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/5 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase">
                    Active
                  </span>
                  <span className="text-xs text-white/40">{activeSeason.type}</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{activeSeason.name}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/50">
                  <span className="flex items-center gap-1">
                    <Icons.Calendar />
                    {formatDate(activeSeason.startDate)} - {formatDate(activeSeason.endDate)}
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Icons.Clock />
                    {getTimeRemaining(activeSeason.endDate)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40 uppercase tracking-wider">Prize Pool</p>
                <p className="text-3xl font-black text-yellow-400">
                  {(activeSeason.prizePool || 0).toLocaleString()} PTS
                </p>
              </div>
            </div>

            {/* Reward Tiers */}
            {rewards && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Top Rewards</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(rewards).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="p-3 rounded-xl bg-white/[0.03] text-center">
                      <p className="text-xs text-white/40 capitalize">{key.replace("_", " ")}</p>
                      <p className="text-lg font-bold text-cyan-400">{String(value)} PTS</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center mb-8">
            <Icons.Trophy />
            <p className="text-white/40 mt-2">No active season</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/5 mb-6">
          {[
            { id: "leaderboard", label: "Leaderboard" },
            { id: "myStats", label: "My Stats" },
            { id: "rewards", label: "Rewards" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab.id
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-white/30 hover:text-white/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {leaderboardLoading ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 rounded-xl bg-white/5" />
                  ))}
                </div>
              ) : leaderboard?.length > 0 ? (
                <div className="rounded-2xl border border-white/5 overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-4 p-4 bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-white/40">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-5">Player</div>
                    <div className="col-span-2 text-center">Battles</div>
                    <div className="col-span-2 text-center">Win Rate</div>
                    <div className="col-span-2 text-right">Points</div>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-white/5">
                    {leaderboard.map((entry: any, index: number) => {
                      const isCurrentUser = entry.userId === authUser?.id;
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors ${
                            isCurrentUser ? "bg-cyan-500/5" : ""
                          }`}
                        >
                          <div className="col-span-1">
                            <RankBadge rank={entry.rank || index + 1} />
                          </div>
                          <div className="col-span-5 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
                              {(entry.user?.username || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className={`font-medium ${isCurrentUser ? "text-cyan-400" : "text-white"}`}>
                                {entry.user?.username || "Anonymous"}
                                {isCurrentUser && <span className="ml-2 text-xs text-cyan-400/60">(You)</span>}
                              </p>
                            </div>
                          </div>
                          <div className="col-span-2 text-center">
                            <p className="text-white/60">{entry.totalBattles || 0}</p>
                          </div>
                          <div className="col-span-2 text-center">
                            <p className={`font-medium ${
                              (entry.winRate || 0) >= 60 ? "text-green-400" :
                              (entry.winRate || 0) >= 40 ? "text-yellow-400" : "text-red-400"
                            }`}>
                              {((entry.winRate || 0) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="col-span-2 text-right">
                            <p className="font-bold text-cyan-400">{(entry.totalPts || 0).toLocaleString()}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Icons.Users />
                  <p className="text-white/40 mt-2">No rankings yet</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "myStats" && (
            <motion.div
              key="myStats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {authUser ? (
                <>
                  {/* User Season Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Your Rank", value: leaderboard?.findIndex((e: any) => e.userId === authUser.id) + 1 || "-", color: "text-white" },
                      { label: "Total Battles", value: leaderboard?.find((e: any) => e.userId === authUser.id)?.totalBattles || 0, color: "text-white" },
                      { label: "Wins", value: leaderboard?.find((e: any) => e.userId === authUser.id)?.wins || 0, color: "text-green-400" },
                      { label: "Season PTS", value: leaderboard?.find((e: any) => e.userId === authUser.id)?.totalPts || 0, color: "text-cyan-400" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Potential Reward */}
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <Icons.Gift />
                      <h3 className="text-lg font-bold">Potential Reward</h3>
                    </div>
                    <p className="text-white/60 text-sm">
                      Based on your current rank, you could earn up to{" "}
                      <span className="text-yellow-400 font-bold">
                        {rewards?.["1st"] || 5000} PTS
                      </span>{" "}
                      at the end of this season!
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-white/40">Connect your wallet to view your stats</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "rewards" && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="grid gap-4">
                {[
                  { rank: "1st Place", reward: rewards?.["1st"] || 5000, icon: "🥇" },
                  { rank: "2nd Place", reward: rewards?.["2nd"] || 3000, icon: "🥈" },
                  { rank: "3rd Place", reward: rewards?.["3rd"] || 1000, icon: "🥉" },
                  { rank: "Top 10", reward: rewards?.["top10"] || 500, icon: "🏅" },
                  { rank: "Top 50", reward: rewards?.["top50"] || 100, icon: "⭐" },
                ].map((tier) => (
                  <div
                    key={tier.rank}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{tier.icon}</span>
                      <span className="font-medium text-white">{tier.rank}</span>
                    </div>
                    <span className="text-xl font-bold text-yellow-400">{tier.reward.toLocaleString()} PTS</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-xs text-white/40">
                  Rewards are distributed automatically at the end of each season.
                  Rankings are based on total points earned during the season period.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Past Seasons */}
        {seasonList && seasonList.length > 1 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icons.Calendar />
              Past Seasons
            </h3>
            <div className="grid gap-3">
              {seasonList.filter((s: any) => s.status === "ENDED").slice(0, 5).map((season: any) => (
                <div
                  key={season.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div>
                    <p className="font-medium text-white">{season.name}</p>
                    <p className="text-xs text-white/40">
                      {formatDate(season.startDate)} - {formatDate(season.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/40">Prize Pool</p>
                    <p className="font-bold text-yellow-400">{(season.prizePool || 0).toLocaleString()} PTS</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link to Tournaments */}
        <div className="mt-8 text-center">
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-white/10 text-white font-medium hover:border-white/20 transition-colors"
          >
            <Icons.Trophy />
            View Tournaments
          </Link>
        </div>
      </div>
    </div>
  );
}
