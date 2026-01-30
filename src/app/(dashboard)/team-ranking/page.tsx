"use client";

import { useLanguageStore } from "../../../stores/language-store";
import { translations } from "../../../lib/translations";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { motion } from "framer-motion";
import { useAuth } from "../../../hooks/use-auth";

// 科技感图标组件库
const Icons = {
  Crown: ({ className }: { className?: string }) => (
    <svg className={`w-8 h-8 ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
      <path d="M12 21h-7a1 1 0 0 1-1-1v-1l3-2h10l3 2v1a1 1 0 0 1-1 1h-7z" opacity="0.3" />
      <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  Silver: ({ className }: { className?: string }) => (
    <svg className={`w-8 h-8 ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" opacity="0.3" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" opacity="0.5" />
    </svg>
  ),
  Bronze: ({ className }: { className?: string }) => (
    <svg className={`w-8 h-8 ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7l1.5 3h3.5l-2.5 2 1 3.5-3.5-2-3.5 2 1-3.5-2.5-2h3.5L12 7z" opacity="0.5" />
    </svg>
  ),
  Users: ({ className }: { className?: string }) => (
    <svg className={`w-5 h-5 ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" opacity="0.5" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" opacity="0.3" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" opacity="0.3" />
    </svg>
  ),
  Trophy: ({ className }: { className?: string }) => (
    <svg className={`w-5 h-5 ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 8H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3M17 8h3a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3" opacity="0.5" />
    </svg>
  ),
  Fire: ({ className }: { className?: string }) => (
    <svg className={`w-4 h-4 ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  TrendingUp: ({ className }: { className?: string }) => (
    <svg className={`w-4 h-4 ${className || ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  )
};

// Skeleton 加载组件
function TeamRankingSkeleton() {
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

export default function TeamRankingPage() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const { user: authUser } = useAuth();

  // 获取团队排行榜 - 使用 team leaderboard API
  const { data: teamLeaderboard, isLoading, error } = useQuery({
    queryKey: ["teamLeaderboard"],
    queryFn: () => api.getTeamLeaderboard?.(100) || Promise.resolve([]),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return <TeamRankingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load team leaderboard</p>
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

  const currentUserTeamRank = teamLeaderboard?.findIndex((entry: any) => 
    entry.members?.some((m: any) => m.userId === authUser?.id)
  ) ?? -1;
  const currentUserTeam = currentUserTeamRank >= 0 ? teamLeaderboard[currentUserTeamRank] : null;

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
            {t.leaderboard?.teamTitle || "团队排行榜"}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase mb-2 sm:mb-4">
            {t.leaderboard?.teamRanking || "Team Ranking"}
          </h1>
          <p className="text-sm sm:text-base text-white/50 max-w-2xl">
            {t.leaderboard?.teamDesc || "查看 S1 Arena 中的团队排名和表现"}
          </p>
        </div>

        {/* Current Team Card */}
        {currentUserTeam && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 sm:mb-12 rounded-2xl sm:rounded-[32px] border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent p-6 sm:p-8 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-purple-500/30 border-2 border-purple-500/50">
                  {getRankIcon(currentUserTeamRank) || (
                    <span className="text-2xl sm:text-3xl font-black">#{currentUserTeamRank + 1}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs sm:text-sm uppercase tracking-widest text-white/40 mb-1">
                    {t.leaderboard?.yourTeam || "Your Team"}
                  </p>
                  <p className="text-xl sm:text-2xl font-black">
                    {currentUserTeam.name || "Unknown Team"}
                  </p>
                  <p className="text-sm sm:text-base text-white/60 mt-1">
                    {currentUserTeam.members?.length || 0} {t.leaderboard?.members || "members"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 sm:gap-8">
                <div className="text-center">
                  <p className="text-xs sm:text-sm uppercase tracking-widest text-white/40 mb-1">
                    {t.leaderboard?.totalPts || "Total PTS"}
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-green-400">
                    {currentUserTeam.totalPts?.toLocaleString() || "0"}
                  </p>
                </div>
                {currentUserTeam.winRate !== undefined && (
                  <div className="text-center">
                    <p className="text-xs sm:text-sm uppercase tracking-widest text-white/40 mb-1">
                      {t.leaderboard?.winRate || "Win Rate"}
                    </p>
                    <p className="text-xl sm:text-2xl font-black">
                      {(currentUserTeam.winRate * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Team Leaderboard Table */}
        <div className="bg-white/5 border border-white/5 rounded-2xl sm:rounded-[40px] overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-white/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                {t.leaderboard?.topTeams || "Top Teams"}
              </h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/40">
                <Icons.TrendingUp />
                <span>{t.leaderboard?.updated || "Updated"} {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-2">
              {teamLeaderboard?.slice(0, 100).map((team: any, index: number) => {
                const isCurrentUserTeam = team.members?.some((m: any) => m.userId === authUser?.id);
                return (
                  <motion.div
                    key={team.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`flex items-center gap-4 rounded-xl p-4 transition-all ${
                      isCurrentUserTeam
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

                    {/* Team Icon */}
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center border border-white/10">
                        <Icons.Users />
                      </div>
                    </div>

                    {/* Team Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-bold truncate">
                        {team.name || `Team #${index + 1}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-white/30">
                          {team.members?.length || 0} {t.leaderboard?.members || "members"}
                        </p>
                        {team.leader && (
                          <>
                            <span className="text-white/20">•</span>
                            <p className="text-xs text-white/30 truncate">
                              {t.leaderboard?.leader || "Leader"}: {team.leader.username || team.leader.name}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 sm:gap-8 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-widest text-white/40 mb-1">
                          {t.leaderboard?.totalPts || "Total PTS"}
                        </p>
                        <p className="text-sm sm:text-base font-black text-green-400">
                          {team.totalPts?.toLocaleString() || "0"}
                        </p>
                      </div>
                      {team.winRate !== undefined && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs uppercase tracking-widest text-white/40 mb-1">
                            {t.leaderboard?.winRate || "Win Rate"}
                          </p>
                          <p className="text-sm sm:text-base font-black">
                            {(team.winRate * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {(!teamLeaderboard || teamLeaderboard.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icons.Trophy className="w-16 h-16 text-white/10 mb-4" />
                <p className="text-sm sm:text-base text-white/40">
                  {t.leaderboard?.noData || "No team ranking data available"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}








