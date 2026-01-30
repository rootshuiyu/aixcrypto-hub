"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useLanguageStore } from "@/stores/language-store";
import { translations } from "@/lib/translations";
import { motion, AnimatePresence } from "framer-motion";

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
  Zap: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  X: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Loader: () => (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  ),
};

// 状态徽章
const StatusBadge = ({ status, t }: { status: string; t: any }) => {
  const styles: Record<string, string> = {
    UPCOMING: "bg-blue-500/20 text-blue-400",
    ACTIVE: "bg-green-500/20 text-green-400",
    ENDED: "bg-white/10 text-white/40",
  };
  const labels: Record<string, string> = {
    UPCOMING: t.tournaments?.upcoming || "Upcoming",
    ACTIVE: t.tournaments?.active || "Active",
    ENDED: t.tournaments?.ended || "Ended",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${styles[status] || styles.ENDED}`}>
      {labels[status] || status}
    </span>
  );
};

// 锦标赛类型图标
const TypeIcon = ({ type }: { type: string }) => {
  if (type === "DAILY_CHALLENGE") return <span className="text-2xl">🎯</span>;
  if (type === "WEEKEND_CUP") return <span className="text-2xl">🏆</span>;
  if (type === "CHAMPIONSHIP") return <span className="text-2xl">👑</span>;
  return <span className="text-2xl">🎮</span>;
};

export default function TournamentsPage() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "active" | "ended">("all");

  // 获取锦标赛列表
  const { data: tournaments, isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => api.getTournaments(),
    staleTime: 30000,
  });

  // 获取锦标赛排行榜
  const { data: tournamentLeaderboard } = useQuery({
    queryKey: ["tournamentLeaderboard", selectedTournament?.id],
    queryFn: () => api.getTournamentLeaderboard(selectedTournament.id),
    enabled: !!selectedTournament?.id,
  });

  // 加入锦标赛
  const joinMutation = useMutation({
    mutationFn: (tournamentId: string) => api.joinTournament(tournamentId, authUser!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });

  const getTimeRemaining = (startDate: string, endDate: string) => {
    const now = Date.now();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    if (now < start) {
      const diff = start - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      if (days > 0) {
        const template = t.tournaments?.startsInDays || "Starts in {days}d";
        return template.replace("{days}", String(days));
      }
      const template = t.tournaments?.startsInHours || "Starts in {hours}h";
      return template.replace("{hours}", String(hours));
    }
    
    if (now >= end) return t.tournaments?.ended || "Ended";
    
    const diff = end - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) {
      const template = t.tournaments?.daysHoursLeft || "{days}d {hours}h left";
      return template.replace("{days}", String(days)).replace("{hours}", String(hours % 24));
    }
    const template = t.tournaments?.hoursLeft || "{hours}h left";
    return template.replace("{hours}", String(hours));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 过滤锦标赛
  const filteredTournaments = tournaments?.filter((t: any) => {
    if (activeFilter === "all") return true;
    return t.status.toLowerCase() === activeFilter;
  });

  // 解析规则/奖励
  const parseJson = (jsonStr: string | null) => {
    if (!jsonStr) return null;
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">{t.tournaments?.competition || "Competition"}</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-2 flex items-center gap-3">
            <Icons.Trophy />
            {t.tournaments?.title || "Tournaments"}
          </h1>
          <p className="text-sm text-white/40 mt-2">
            {t.tournaments?.desc || "Join tournaments and compete for massive prizes"}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "all", label: t.tournaments?.all || "All" },
            { id: "active", label: t.tournaments?.active || "Active" },
            { id: "upcoming", label: t.tournaments?.upcoming || "Upcoming" },
            { id: "ended", label: t.tournaments?.ended || "Ended" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === filter.id
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/[0.03] text-white/40 border border-white/5 hover:text-white/60"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Tournament Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse h-48 rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : filteredTournaments?.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTournaments.map((tournament: any) => {
              const rewards = parseJson(tournament.rewards);
              const isParticipant = tournament.participants?.some(
                (p: any) => p.userId === authUser?.id
              );

              return (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border bg-gradient-to-br p-6 cursor-pointer transition-all hover:scale-[1.02] ${
                    tournament.status === "ACTIVE"
                      ? "border-green-500/30 from-green-500/5 to-transparent"
                      : tournament.status === "UPCOMING"
                      ? "border-blue-500/30 from-blue-500/5 to-transparent"
                      : "border-white/5 from-white/[0.02] to-transparent"
                  }`}
                  onClick={() => setSelectedTournament(tournament)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <TypeIcon type={tournament.type} />
                      <div>
                        <h3 className="font-bold text-lg text-white">{tournament.name}</h3>
                        <p className="text-xs text-white/40">{tournament.type.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    <StatusBadge status={tournament.status} t={t} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-white/40">{t.tournaments?.prizePool || "Prize Pool"}</p>
                      <p className="text-xl font-bold text-yellow-400">
                        {(tournament.prizePool || 0).toLocaleString()} PTS
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">{t.tournaments?.entryFee || "Entry Fee"}</p>
                      <p className="text-xl font-bold text-white">
                        {tournament.entryFee > 0 ? `${tournament.entryFee} PTS` : (t.tournaments?.free || "Free")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-white/50">
                      <span className="flex items-center gap-1">
                        <Icons.Users />
                        {tournament._count?.participants || 0}/{tournament.maxPlayers}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icons.Clock />
                        {getTimeRemaining(tournament.startDate, tournament.endDate)}
                      </span>
                    </div>
                    {isParticipant && (
                      <span className="text-green-400 text-xs font-bold">{t.tournaments?.joined || "Joined"}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Icons.Trophy />
            <p className="text-white/40 mt-2">{t.tournaments?.noTournaments || "No tournaments found"}</p>
          </div>
        )}

        {/* Tournament Detail Modal */}
        <AnimatePresence>
          {selectedTournament && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
              onClick={() => setSelectedTournament(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0a0a0a] rounded-2xl border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/5 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TypeIcon type={selectedTournament.type} />
                    <div>
                      <h2 className="text-xl font-bold">{selectedTournament.name}</h2>
                      <StatusBadge status={selectedTournament.status} t={t} />
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTournament(null)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Icons.X />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Description */}
                  {selectedTournament.description && (
                    <p className="text-white/60">{selectedTournament.description}</p>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.03]">
                      <p className="text-xs text-white/40">{t.tournaments?.prizePool || "Prize Pool"}</p>
                      <p className="text-lg font-bold text-yellow-400">
                        {(selectedTournament.prizePool || 0).toLocaleString()} PTS
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03]">
                      <p className="text-xs text-white/40">{t.tournaments?.entryFee || "Entry Fee"}</p>
                      <p className="text-lg font-bold">
                        {selectedTournament.entryFee > 0 ? `${selectedTournament.entryFee} PTS` : (t.tournaments?.free || "Free")}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03]">
                      <p className="text-xs text-white/40">{t.tournaments?.participants || "Participants"}</p>
                      <p className="text-lg font-bold">
                        {selectedTournament._count?.participants || 0}/{selectedTournament.maxPlayers}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.03]">
                      <p className="text-xs text-white/40">{t.tournaments?.minLevel || "Min Level"}</p>
                      <p className="text-lg font-bold">{selectedTournament.minLevel || (t.tournaments?.none || "None")}</p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-6 text-sm text-white/60">
                    <span className="flex items-center gap-2">
                      <Icons.Calendar />
                      {formatDate(selectedTournament.startDate)} - {formatDate(selectedTournament.endDate)}
                    </span>
                  </div>

                  {/* Rewards */}
                  {parseJson(selectedTournament.rewards) && (
                    <div>
                      <h3 className="font-bold mb-3 flex items-center gap-2">
                        <Icons.Gift />
                        {t.tournaments?.rewards || "Rewards"}
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries(parseJson(selectedTournament.rewards)).map(([key, value]) => (
                          <div key={key} className="p-3 rounded-xl bg-white/[0.03] text-center">
                            <p className="text-xs text-white/40 capitalize">{key}</p>
                            <p className="font-bold text-yellow-400">{String(value)} PTS</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leaderboard */}
                  {tournamentLeaderboard?.length > 0 && (
                    <div>
                      <h3 className="font-bold mb-3 flex items-center gap-2">
                        <Icons.Trophy />
                        {t.tournaments?.leaderboard || "Leaderboard"}
                      </h3>
                      <div className="space-y-2">
                        {tournamentLeaderboard.slice(0, 10).map((entry: any, index: number) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 text-center font-bold text-white/40">
                                {index + 1}
                              </span>
                              <span className="font-medium">{entry.user?.username || "Anonymous"}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-cyan-400">{entry.score || 0} pts</span>
                              <span className="text-xs text-white/40 ml-2">
                                {entry.wins}W / {entry.losses}L
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Join Button */}
                  {authUser && selectedTournament.status !== "ENDED" && (
                    <button
                      onClick={() => joinMutation.mutate(selectedTournament.id)}
                      disabled={joinMutation.isPending || selectedTournament.participants?.some(
                        (p: any) => p.userId === authUser.id
                      )}
                      className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                        selectedTournament.participants?.some((p: any) => p.userId === authUser.id)
                          ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed"
                          : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                      }`}
                    >
                      {joinMutation.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <Icons.Loader />
                          {t.tournaments?.joining || "Joining..."}
                        </span>
                      ) : selectedTournament.participants?.some((p: any) => p.userId === authUser.id) ? (
                        <span className="flex items-center justify-center gap-2">
                          <Icons.Check />
                          {t.tournaments?.alreadyJoined || "Already Joined"}
                        </span>
                      ) : (
                        `${t.tournaments?.joinTournament || "Join Tournament"} ${selectedTournament.entryFee > 0 ? `(${selectedTournament.entryFee} PTS)` : ""}`
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
