"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface ReferralPanelProps {
  userId: string;
  referralCode: string;
}

// 图标组件
const Icons = {
  Copy: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
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
  TrendingUp: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
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
  ChevronRight: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

export function ReferralPanel({ userId, referralCode }: ReferralPanelProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "referrals" | "rewards">("overview");

  // 获取推荐统计
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["referralStats", userId],
    queryFn: () => api.getReferralStats(userId),
    enabled: !!userId,
    staleTime: 30000,
  });

  // 获取推荐列表
  const { data: referralList } = useQuery({
    queryKey: ["referralList", userId],
    queryFn: () => api.getReferralList(userId, 1, 10),
    enabled: !!userId && activeTab === "referrals",
  });

  // 获取奖励记录
  const { data: rewardHistory } = useQuery({
    queryKey: ["referralRewards", userId],
    queryFn: () => api.getReferralRewards(userId, 1, 10),
    enabled: !!userId && activeTab === "rewards",
  });

  const referralLink = typeof window !== "undefined" 
    ? `${window.location.origin}?ref=${referralCode}` 
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address?: string) => {
    if (!address) return "Anonymous";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-6 backdrop-blur-sm">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Icons.Gift />
          Referral Program
        </h3>
        <span className="text-xs text-cyan-500 font-medium px-2 py-1 rounded-full bg-cyan-500/10">
          +100 PTS per invite
        </span>
      </div>

      {/* 推荐链接 */}
      <div className="mb-6">
        <label className="text-xs font-medium uppercase tracking-wider text-white/40 mb-2 block">
          Your Referral Link
        </label>
        <div className="flex gap-2">
          <div className="flex-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 font-mono text-sm text-white/60 truncate">
            {referralLink || "Loading..."}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyLink}
            className={`px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
              copied
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
            }`}
          >
            {copied ? <Icons.Check /> : <Icons.Copy />}
          </motion.button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 text-white/40 mb-2">
            <Icons.Users />
            <span className="text-xs font-medium uppercase tracking-wider">Total Referrals</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {statsLoading ? "..." : stats?.totalReferrals || 0}
          </p>
          <p className="text-xs text-white/30 mt-1">
            +{stats?.monthlyReferrals || 0} this month
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 text-white/40 mb-2">
            <Icons.TrendingUp />
            <span className="text-xs font-medium uppercase tracking-wider">Total Earned</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400">
            {statsLoading ? "..." : (stats?.totalRewards || 0).toLocaleString()} PTS
          </p>
          <p className="text-xs text-white/30 mt-1">
            +{(stats?.monthlyRewards || 0).toLocaleString()} this month
          </p>
        </div>
      </div>

      {/* 奖励说明 */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/5">
        <p className="text-xs font-medium text-white/60 mb-2">Reward Structure:</p>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-white/40">New user signup</span>
            <span className="text-cyan-400 font-medium">+{stats?.rewardRates?.SIGNUP_BONUS || 100} PTS</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">First bet bonus</span>
            <span className="text-cyan-400 font-medium">+{stats?.rewardRates?.FIRST_BET_BONUS || 50} PTS</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Activity bonus</span>
            <span className="text-cyan-400 font-medium">+{stats?.rewardRates?.ACTIVITY_BONUS || 10} PTS</span>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex border-b border-white/5 mb-4">
        {["overview", "referrals", "rewards"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === tab
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-white/30 hover:text-white/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 标签页内容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="min-h-[200px]"
        >
          {activeTab === "overview" && (
            <div className="space-y-3">
              <p className="text-sm text-white/50 mb-4">
                Invite friends and earn PTS rewards! Share your link and start earning.
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-lg bg-white/[0.02]">
                  <p className="text-lg font-bold text-white">{stats?.totalReferrals || 0}</p>
                  <p className="text-[10px] text-white/30 uppercase">Invited</p>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02]">
                  <p className="text-lg font-bold text-cyan-400">{stats?.totalRewards || 0}</p>
                  <p className="text-[10px] text-white/30 uppercase">PTS Earned</p>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02]">
                  <p className="text-lg font-bold text-purple-400">{stats?.monthlyReferrals || 0}</p>
                  <p className="text-[10px] text-white/30 uppercase">This Month</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "referrals" && (
            <div className="space-y-2">
              {referralList?.referrals?.length > 0 ? (
                referralList.referrals.map((referral: any) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {referral.username || formatAddress(referral.address)}
                      </p>
                      <p className="text-xs text-white/30">
                        Joined {formatDate(referral.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-cyan-400">
                        +{referral.rewardsGenerated || 0} PTS
                      </p>
                      <p className="text-xs text-white/30">
                        {referral.totalBattles || 0} battles
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Icons.Users />
                  <p className="text-sm text-white/30 mt-2">No referrals yet</p>
                  <p className="text-xs text-white/20">Share your link to start earning!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "rewards" && (
            <div className="space-y-2">
              {rewardHistory?.rewards?.length > 0 ? (
                rewardHistory.rewards.map((reward: any) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {reward.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-white/30">
                        from {reward.referee?.username || formatAddress(reward.referee?.address)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">+{reward.amount} PTS</p>
                      <p className="text-xs text-white/30">{formatDate(reward.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Icons.Gift />
                  <p className="text-sm text-white/30 mt-2">No rewards yet</p>
                  <p className="text-xs text-white/20">Invite friends to earn rewards!</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
