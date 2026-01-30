"use client";

import { useLanguageStore } from "../../../stores/language-store";
import { translations } from "../../../lib/translations";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { motion } from "framer-motion";
import { useAuth } from "../../../hooks/use-auth";
import { LeaderboardIcons as Icons } from "../../../components/ui/leaderboard-icons";

// Skeleton 加载组件
function PersonalRankingSkeleton() {
  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="h-4 w-32 bg-white/5 rounded mb-4 animate-pulse" />
        <div className="h-12 w-64 bg-white/5 rounded mb-4 animate-pulse" />
        <div className="h-4 w-96 bg-white/5 rounded mb-8 animate-pulse" />
        <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-white/5">
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-white/5 last:border-0 animate-pulse">
                <div className="h-4 w-8 bg-white/10 rounded" />
                <div className="h-8 w-8 rounded-full bg-white/10" />
                <div className="h-4 w-32 bg-white/10 rounded" />
                <div className="ml-auto h-4 w-20 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PersonalRankingPage() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const { user: authUser } = useAuth();

  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ["personalLeaderboard"],
    queryFn: () => api.getLeaderboard(100),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return <PersonalRankingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load leaderboard</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentUserRank = leaderboard?.findIndex((entry: any) => entry.userId === authUser?.id) ?? -1;
  const currentUserEntry = currentUserRank >= 0 ? leaderboard[currentUserRank] : null;

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Icons.Crown className="text-yellow-500" />;
    if (rank === 1) return <Icons.Silver className="text-gray-400" />;
    if (rank === 2) return <Icons.Bronze className="text-orange-600" />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 0) return "text-yellow-500";
    if (rank === 1) return "text-gray-400";
    if (rank === 2) return "text-orange-600";
    return "text-white/60";
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-white/40 mb-2 sm:mb-4">
            {t.leaderboard?.personalTitle || "个人排行榜"}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase mb-2 sm:mb-4">
            {t.leaderboard?.personalRanking || "Personal Ranking"}
          </h1>
          <p className="text-sm sm:text-base text-white/50 max-w-2xl">
            {t.leaderboard?.personalDesc || "查看您在 S1 Arena 中的个人排名和表现"}
          </p>
        </div>

        {/* Current User Card */}
        {currentUserEntry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 sm:mb-12 rounded-2xl sm:rounded-[32px] border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent p-6 sm:p-8 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-purple-500/30 border-2 border-purple-500/50">
                  {getRankIcon(currentUserRank) || (
                    <span className="text-2xl sm:text-3xl font-black">{currentUserRank + 1}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs sm:text-sm uppercase tracking-widest text-white/40 mb-1">
                    {t.leaderboard?.yourRank || "Your Rank"}
                  </p>
                  <p className="text-xl sm:text-2xl font-black">
                    #{currentUserRank + 1}
                  </p>
                  <p className="text-sm sm:text-base text-white/60 mt-1">
                    {currentUserEntry.username || currentUserEntry.name || "Unknown"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 sm:gap-8">
                <div className="text-center">
                  <p className="text-xs sm:text-sm uppercase tracking-widest text-white/40 mb-1">
                    {t.leaderboard?.roi || "ROI"}
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-green-400">
                    {currentUserEntry.roi || "0%"}
                  </p>
                </div>
                {currentUserEntry.streak && (
                  <div className="text-center">
                    <p className="text-xs sm:text-sm uppercase tracking-widest text-white/40 mb-1">
                      {t.leaderboard?.streak || "Streak"}
                    </p>
                    <div className="flex items-center gap-1">
                      <Icons.Fire className="text-orange-500" />
                      <p className="text-xl sm:text-2xl font-black">
                        {currentUserEntry.streak}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white/5 border border-white/5 rounded-2xl sm:rounded-[40px] overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-white/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                {t.leaderboard?.topPlayers || "Top Players"}
              </h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/40">
                <Icons.TrendingUp />
                <span>{t.leaderboard?.updated || "Updated"} {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-2">
              {leaderboard?.slice(0, 100).map((entry: any, index: number) => {
                const isCurrentUser = entry.userId === authUser?.id;
                return (
                  <motion.div
                    key={entry.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`flex items-center gap-4 rounded-xl p-4 transition-all ${
                      isCurrentUser
                        ? "bg-purple-500/20 border-2 border-purple-500/50"
                        : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]"
                    }`}
                  >
                    {/* Rank */}
                    <div className={`flex-shrink-0 w-8 sm:w-12 text-center ${getRankColor(index)}`}>
                      {getRankIcon(index) ? (
                        <div className="flex justify-center">{getRankIcon(index)}</div>
                      ) : (
                        <span className="text-sm sm:text-base font-black">#{index + 1}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center border border-white/10">
                        <Icons.User />
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-bold truncate">
                        {entry.username || entry.name || `User #${index + 1}`}
                      </p>
                      {entry.address && (
                        <p className="text-xs text-white/30 font-mono truncate">
                          {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 sm:gap-8 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-widest text-white/40 mb-1">
                          {t.leaderboard?.roi || "ROI"}
                        </p>
                        <p className="text-sm sm:text-base font-black text-green-400">
                          {entry.roi || "0%"}
                        </p>
                      </div>
                      {entry.streak && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs uppercase tracking-widest text-white/40 mb-1">
                            {t.leaderboard?.streak || "Streak"}
                          </p>
                          <div className="flex items-center gap-1 justify-end">
                            <Icons.Fire className="text-orange-500" />
                            <p className="text-sm sm:text-base font-black">
                              {entry.streak}
                            </p>
                          </div>
                        </div>
                      )}
                      {entry.pts !== undefined && (
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-widest text-white/40 mb-1">
                            {t.common?.points || "PTS"}
                          </p>
                          <p className="text-sm sm:text-base font-black">
                            {entry.pts?.toLocaleString() || "0"}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {(!leaderboard || leaderboard.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icons.Trophy className="w-16 h-16 text-white/10 mb-4" />
                <p className="text-sm sm:text-base text-white/40">
                  {t.leaderboard?.noData || "No ranking data available"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}








