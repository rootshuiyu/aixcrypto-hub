"use client";

import { useLanguageStore } from "../../../stores/language-store";
import { translations } from "../../../lib/translations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../hooks/use-auth";
import { IndustrialAgentCard } from "../../../components/playground/industrial-agent-card";
import { useUIStore } from "../../../stores/ui-store";
import Link from "next/link";
import { FloatingOctopus, InkParticles, TentacleWaves } from "@/components/ui/octopus-decorations";
import { SparklesCore } from "@/components/aceternity/sparkles";
import { OctoPlayground } from "@/components/icons/octopus-icons";
import { OctopusLoader } from "@/components/ui/octopus-loader";

// 章鱼主题图标
const OctoIcons = {
  Crypto: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="12" rx="8" ry="6" />
      <circle cx="10" cy="11" r="1" fill="currentColor" />
      <circle cx="14" cy="11" r="1" fill="currentColor" />
      <path d="M8 16c-1 1 0 2 1 3" strokeLinecap="round" opacity="0.4" />
      <path d="M16 16c1 1 0 2-1 3" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  Gold: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 17h20L19 7H5L2 17z" />
      <ellipse cx="12" cy="19" rx="4" ry="2" opacity="0.3" />
    </svg>
  ),
  Brain: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="10" rx="7" ry="6" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
      <circle cx="15" cy="9" r="1.5" fill="currentColor" />
      <path d="M7 15c-2 1-3 3-2 5" strokeLinecap="round" opacity="0.4" />
      <path d="M17 15c2 1 3 3 2 5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  Robot: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="8" width="14" height="10" rx="2" />
      <ellipse cx="12" cy="12" rx="5" ry="3" opacity="0.3" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 8V5M9 5h6" />
      <path d="M5 16c-1 1 0 2 1 3" strokeLinecap="round" opacity="0.4" />
      <path d="M19 16c1 1 0 2-1 3" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  Bolt: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  TrendUp: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="18" cy="8" rx="4" ry="3" opacity="0.2" />
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  ),
  TrendDown: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="18" cy="16" rx="4" ry="3" opacity="0.2" />
      <path d="M23 18l-9.5-9.5-5 5L1 6" />
      <path d="M17 18h6v-6" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="12" rx="9" ry="7" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Market: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="10" rx="6" ry="5" />
      <circle cx="10" cy="9" r="1" fill="currentColor" />
      <circle cx="14" cy="9" r="1" fill="currentColor" />
      <path d="M3 18l4-6 4 4 4-8 4 6" opacity="0.5" />
      <path d="M8 14c-1 2 0 4 1 5" strokeLinecap="round" opacity="0.4" />
      <path d="M16 14c1 2 0 4-1 5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
};

// 大章鱼对战动画
const BattleOctopus = ({ isWin }: { isWin: boolean }) => (
  <motion.svg
    className={`w-24 h-24 ${isWin ? 'text-green-400' : 'text-red-400'}`}
    viewBox="0 0 100 100"
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring" }}
  >
    <defs>
      <linearGradient id="battleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={isWin ? "#22c55e" : "#ef4444"} />
        <stop offset="100%" stopColor={isWin ? "#10b981" : "#dc2626"} />
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="40" rx="25" ry="20" fill="url(#battleGrad)" opacity="0.2" />
    <ellipse cx="50" cy="40" rx="25" ry="20" stroke="url(#battleGrad)" strokeWidth="2" fill="none" />
    <circle cx="42" cy="38" r="5" fill="white" />
    <circle cx="58" cy="38" r="5" fill="white" />
    <circle cx="42" cy="38" r="2.5" fill="#1a1a1a" />
    <circle cx="58" cy="38" r="2.5" fill="#1a1a1a" />
    {isWin ? (
      <path d="M42 50 Q 50 58, 58 50" stroke="url(#battleGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    ) : (
      <path d="M42 55 Q 50 48, 58 55" stroke="url(#battleGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    )}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <motion.path
        key={i}
        d={`M ${28 + i * 8} 58 Q ${26 + i * 8} 75, ${22 + i * 9} 90`}
        stroke="url(#battleGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity={0.4 + (i % 3) * 0.15}
        animate={isWin ? {
          d: [
            `M ${28 + i * 8} 58 Q ${26 + i * 8} 75, ${22 + i * 9} 90`,
            `M ${28 + i * 8} 58 Q ${32 + i * 8} 70, ${28 + i * 9} 85`,
            `M ${28 + i * 8} 58 Q ${26 + i * 8} 75, ${22 + i * 9} 90`,
          ],
        } : {
          d: [
            `M ${28 + i * 8} 58 Q ${26 + i * 8} 75, ${22 + i * 9} 90`,
            `M ${28 + i * 8} 58 Q ${24 + i * 8} 78, ${20 + i * 9} 92`,
            `M ${28 + i * 8} 58 Q ${26 + i * 8} 75, ${22 + i * 9} 90`,
          ],
        }}
        transition={{ duration: 1 + i * 0.1, repeat: Infinity }}
      />
    ))}
  </motion.svg>
);

const AGENT_LIMITS: Record<string, { min: number; max: number; multiplier: number }> = {
  'EASY': { min: 0, max: 100, multiplier: 1.0 },
  'MEDIUM': { min: 50, max: 500, multiplier: 1.2 },
  'HARD': { min: 200, max: 2000, multiplier: 1.5 },
  'MASTER': { min: 500, max: 10000, multiplier: 2.0 }
};

const MARKET_TYPES = [
  { id: 'C10', nameKey: 'cryptoIndex', icon: <OctoIcons.Crypto /> },
  { id: 'GOLD', nameKey: 'goldIndex', icon: <OctoIcons.Gold /> },
];

const TIMEFRAMES = [
  { id: '10M', name: '10 Min' },
  { id: '30M', name: '30 Min' },
  { id: '1H', name: '1 Hour' },
];

export default function PlaygroundPage() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { showNotification } = useUIStore();
  
  // 状态 - 必须在所有条件返回之前声明
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedAgentLevel, setSelectedAgentLevel] = useState<string>('EASY');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [showStrategyPanel, setShowStrategyPanel] = useState(false);
  const [activeHotkey, setActiveHotkey] = useState<string | null>(null);
  const [lastBattleResult, setLastBattleResult] = useState<any>(null);
  const [selectedMarketType, setSelectedMarketType] = useState<string>('C10');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('10M');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPick, setPendingPick] = useState<'YES' | 'NO' | null>(null);

  // 🆕 功能开关检查 - 必须在条件返回之前
  const { data: featureEnabled, isLoading: featureLoading } = useQuery({
    queryKey: ['featureFlag', 'playground'],
    queryFn: () => api.getFeatureFlag('playground'),
    staleTime: 60000,
  });

  // 快捷键 effect - 必须在条件返回之前
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 's') {
        const type = key === 'w' ? 'LONG' : 'SHORT';
        const btn = document.querySelector(`[data-hotkey="${type}"]`) as HTMLButtonElement;
        if (btn && selectedAgent) {
          setActiveHotkey(type);
          setTimeout(() => setActiveHotkey(null), 150);
          btn.click();
        } else {
          showNotification(t.playground.selectAiFirst, 'INFO');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAgent, showNotification, t]);

  const { data: agents, isLoading: isAgentsLoading, error: agentsError } = useQuery({
    queryKey: ["agents", authUser?.id],
    queryFn: () => api.getAgents(authUser?.id),
    enabled: !!authUser?.id || true,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", authUser?.id],
    queryFn: () => api.getUserProfile(authUser?.id),
    enabled: !!authUser?.id,
  });

  const { data: battleStats } = useQuery({
    queryKey: ["battleStats", authUser?.id],
    queryFn: () => api.getBattleStats(authUser?.id),
    enabled: !!authUser?.id,
  });

  const { data: recentBattles } = useQuery({
    queryKey: ["recentBattles", authUser?.id || "guest"],
    queryFn: () => api.getRecentBattles(authUser?.id),
    enabled: !!authUser?.id,
  });

  const battleMutation = useMutation({
    mutationFn: (data: { agentId: string, userPick: 'YES' | 'NO', amount: number }) => 
      api.startBattle({ userId: authUser?.id!, ...data, language: currentLanguage }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recentBattles", authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["battleStats", authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks", authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["userProfile", authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["agents", authUser?.id] });
      setLastBattleResult(data);
      setShowConfirmModal(false);
      setPendingPick(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || "Failed to start battle";
      showNotification(`${t.common.error}: ${message}`, 'ERROR');
      setShowConfirmModal(false);
      setPendingPick(null);
    }
  });

  // ==========================================
  // 🆕 功能开关检查 - 所有 hooks 之后进行条件返回
  // ==========================================
  if (featureLoading) {
    return (
      <div className="relative flex h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
        <div className="absolute inset-0">
          <SparklesCore background="transparent" minSize={0.3} maxSize={0.8} particleDensity={15} particleColor="#8b5cf6" />
        </div>
        <OctopusLoader size="md" text="Loading..." />
      </div>
    );
  }

  if (featureEnabled === false) {
    return (
      <div className="relative flex flex-col h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
        <div className="absolute inset-0 overflow-hidden">
          <SparklesCore background="transparent" minSize={0.3} maxSize={0.8} particleDensity={10} particleColor="#6b7280" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center p-8"
        >
          {/* 休眠章鱼 */}
          <motion.svg
            className="w-32 h-32 mx-auto mb-6 text-gray-500"
            viewBox="0 0 100 100"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <ellipse cx="50" cy="40" rx="30" ry="22" fill="currentColor" opacity="0.3" />
            <ellipse cx="50" cy="40" rx="28" ry="20" stroke="currentColor" fill="none" strokeWidth="2" />
            <path d="M38 38 L48 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M52 38 L62 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <text x="70" y="30" fill="currentColor" fontSize="10" opacity="0.5">Z</text>
            <text x="75" y="22" fill="currentColor" fontSize="8" opacity="0.3">z</text>
            <text x="78" y="16" fill="currentColor" fontSize="6" opacity="0.2">z</text>
            {[0, 1, 2, 3, 4].map(i => (
              <motion.path
                key={i}
                d={`M${30 + i * 10} 55 Q${25 + i * 10} 75 ${30 + i * 10} 85`}
                stroke="currentColor"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                opacity={0.3}
              />
            ))}
          </motion.svg>
          
          <h1 className="text-3xl font-black text-gray-400 mb-3">
            {t.playground?.maintenance || 'Feature Under Maintenance'}
          </h1>
          <p className="text-gray-500 mb-6 max-w-md">
            {t.playground?.maintenanceDesc || 'AI Battle feature is temporarily disabled. Please try again later or visit other pages.'}
          </p>
          
          <Link href="/market">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl"
            >
              {t.playground?.goToMarket || 'Go to Market'}
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }
  // ==========================================

  const handleSelectAgent = (agentId: string) => {
    const agent = agents?.find((a: any) => a.id === agentId);
    setSelectedAgent(agentId);
    setSelectedAgentLevel(agent?.level || 'EASY');
    setShowStrategyPanel(true);
    setLastBattleResult(null);
    const limit = AGENT_LIMITS[agent?.level || 'EASY'];
    setBetAmount(limit.min || 10);
  };

  const requestBattle = (pick: 'YES' | 'NO') => {
    setPendingPick(pick);
    setShowConfirmModal(true);
  };

  const confirmBattle = () => {
    if (!selectedAgent || !pendingPick) return;
    battleMutation.mutate({ agentId: selectedAgent, userPick: pendingPick, amount: betAmount });
  };

  const getBetOptions = () => {
    const limit = AGENT_LIMITS[selectedAgentLevel];
    const options = [10, 50, 100, 200, 500, 1000, 2000, 5000];
    return options.filter(amt => amt >= limit.min && amt <= limit.max);
  };

  const stats = [
    { label: t.playground.stats.winRate, value: battleStats?.winRate ? `${battleStats.winRate}%` : "0%", color: "text-cyan-400" },
    { label: t.playground.stats.activePositions, value: battleStats?.totalBattles ?? "0", color: "text-purple-400" },
    { label: t.playground.stats.totalPnl, value: battleStats?.netProfit != null ? `${battleStats.netProfit > 0 ? '+' : ''}${battleStats.netProfit}` : "0", color: (battleStats?.netProfit ?? 0) >= 0 ? "text-green-400" : "text-red-400" },
    { label: t.playground.stats.roi, value: battleStats?.roi ? `${battleStats.roi}%` : "0%", color: "text-yellow-400" }
  ];

  const selectedAgentData = agents?.find((a: any) => a.id === selectedAgent);

  return (
    <div className="min-h-screen bg-transparent text-white relative overflow-hidden">
      {/* 章鱼主题背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <SparklesCore
          background="transparent"
          minSize={0.3}
          maxSize={0.8}
          particleDensity={15}
          particleColor="#06b6d4"
          className="opacity-30"
        />
        <InkParticles count={25} />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/15 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/15 blur-[120px] rounded-full" />
      </div>
      <TentacleWaves />
      
      <FloatingOctopus className="absolute top-20 right-10 opacity-20 hidden xl:block" size="lg" color="cyan" />
      <FloatingOctopus className="absolute bottom-40 left-10 opacity-15 hidden lg:block" size="md" color="purple" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 lg:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <motion.span 
              className="text-cyan-400"
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <OctoPlayground className="w-8 h-8" />
            </motion.span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">{t.playground?.arenaSubtitle || "Octopus Battle Arena"}</span>
            <span className="bg-gradient-to-r from-cyan-500 to-purple-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white rounded">
              {t.playground.openBeta}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase">
            {t.playground.title}
          </h1>
          <p className="mt-3 text-sm text-white/40">
            {t.playground?.pageDesc || "Challenge our AI octopi in the prediction arena!"}
          </p>
        </motion.div>

        {/* Battle Result */}
        <AnimatePresence mode="wait">
          {lastBattleResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-10 overflow-hidden"
            >
              <div className={`border-2 rounded-3xl overflow-hidden ${
                lastBattleResult.winner === 'USER' 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : lastBattleResult.winner === 'AGENT'
                    ? 'border-red-500/50 bg-red-500/5'
                    : 'border-white/20 bg-white/5'
              }`}>
                <div className={`px-6 py-3 flex items-center justify-between ${
                  lastBattleResult.winner === 'USER' ? 'bg-green-500/10' : lastBattleResult.winner === 'AGENT' ? 'bg-red-500/10' : 'bg-white/5'
                }`}>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                    {t.playground?.battleResult || "Battle Result"}
                  </span>
                  <button onClick={() => setLastBattleResult(null)} className="text-white/40 hover:text-white">✕</button>
                </div>

                <div className="p-8 flex flex-col lg:flex-row gap-8 items-center">
                  <div className="flex-shrink-0 text-center">
                    <BattleOctopus isWin={lastBattleResult.winner === 'USER'} />
                    <p className={`text-3xl font-black uppercase mt-4 ${
                      lastBattleResult.winner === 'USER' ? 'text-green-400' : lastBattleResult.winner === 'AGENT' ? 'text-red-400' : 'text-white/60'
                    }`}>
                      {lastBattleResult.winner === 'USER' ? t.playground.winnerLabel : lastBattleResult.winner === 'AGENT' ? t.playground.defeatLabel : t.playground.drawLabel}
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                      {lastBattleResult.reward > 0 
                        ? `+${lastBattleResult.reward} PTS` 
                        : lastBattleResult.winner === 'AGENT' 
                          ? `-${lastBattleResult.amount} PTS`
                          : (t.playground?.noChange || 'No change')}
                    </p>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <motion.div 
                        className="h-12 w-12 shrink-0 border-2 border-cyan-500/30 bg-cyan-500/10 rounded-xl flex items-center justify-center"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <OctoIcons.Robot />
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">{lastBattleResult.agent?.name}</p>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                          <p className="text-sm text-white/80 italic leading-relaxed">
                            "{lastBattleResult.reasoning?.includes(']:') ? lastBattleResult.reasoning.split(']:')[1]?.trim() : lastBattleResult.reasoning}"
                          </p>
                          {lastBattleResult.priceChange !== null && (
                            <div className="mt-4 flex gap-4 text-[10px]">
                              <span className="text-white/30">{t.playground?.priceChangeLabel || "Price Change"}:</span>
                              <span className={lastBattleResult.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {lastBattleResult.priceChange >= 0 ? '+' : ''}{lastBattleResult.priceChange.toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative group bg-white/[0.03] border border-white/10 rounded-2xl p-5 overflow-hidden hover:border-cyan-500/30 transition-all"
            >
              <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 100 100">
                <circle cx="80" cy="80" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="80" cy="80" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
              <p className="text-[9px] font-bold uppercase text-white/40 tracking-widest">{stat.label}</p>
              <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* AI Selection */}
        <div className="mb-10">
          <div className="mb-6 flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-cyan-400"
            >
              <OctoIcons.Brain />
            </motion.div>
            <h2 className="text-xl font-black uppercase tracking-tight">{t.playground.select}</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent"></div>
          </div>
          
          {agentsError ? (
            <div className="text-center py-12 border border-red-500/30 bg-red-500/5 rounded-2xl">
              <p className="text-red-400 font-bold mb-4">{t.common.error}</p>
              <button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["agents"] })}
                className="px-6 py-2 bg-cyan-500 text-white text-sm font-bold rounded-xl hover:bg-cyan-600 transition-colors"
              >
                {t.playground?.retry || "Retry"}
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {isAgentsLoading ? (
                [1,2,3,4].map(i => (
                  <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                ))
              ) : (
                agents?.map((ai: any) => (
                  <IndustrialAgentCard 
                    key={ai.id}
                    agent={ai}
                    isSelected={selectedAgent === ai.id}
                    isLocked={ai.isLocked}
                    requirement={ai.requirement}
                    onSelect={handleSelectAgent}
                    onConfirm={() => {}}
                    t={t}
                    userWins={userProfile?.totalWins || 0}
                    userPts={userProfile?.pts || 0}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Battle Panel */}
        {showStrategyPanel && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 border-2 border-cyan-500/30 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-3xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-cyan-500/20 bg-cyan-500/5 px-6 py-4">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                <motion.div 
                  className="h-2 w-2 rounded-full bg-cyan-400"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                {t.playground?.initiateBattle || "Initiate Battle"}
                <span className="text-cyan-400 font-mono text-sm ml-2">// {selectedAgentLevel}</span>
              </h3>
              <button onClick={() => setShowStrategyPanel(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Market & Timeframe */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">{t.playground?.marketLabel || "Market"}</p>
                    <div className="flex gap-2">
                      {MARKET_TYPES.map(market => (
                        <button
                          key={market.id}
                          onClick={() => setSelectedMarketType(market.id)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold border rounded-xl transition-all ${
                            selectedMarketType === market.id
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                              : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                          }`}
                        >
                          {market.icon}
                          <span>{market.id}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">{t.playground?.timeframeLabel || "Timeframe"}</p>
                    <div className="flex gap-2">
                      {TIMEFRAMES.map(tf => (
                        <button
                          key={tf.id}
                          onClick={() => setSelectedTimeframe(tf.id)}
                          className={`flex-1 py-3 text-xs font-mono font-bold border rounded-xl transition-all ${
                            selectedTimeframe === tf.id
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                              : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                          }`}
                        >
                          {tf.id}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bet Amount */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4 flex justify-between">
                    <span>{t.playground?.betAmount || "Bet Amount"}</span>
                    <span className="text-cyan-400 font-mono">{t.playground?.available || "Available"}: {userProfile?.pts?.toLocaleString() || 0} PTS</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getBetOptions().map(amt => (
                      <motion.button
                        key={amt}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setBetAmount(amt)}
                        disabled={userProfile?.pts < amt}
                        className={`px-4 py-3 text-sm font-mono font-black border rounded-xl transition-all ${
                          betAmount === amt 
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 border-transparent text-white' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:border-cyan-500/30 disabled:opacity-20'
                        }`}
                      >
                        {amt}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Battle Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  onClick={() => requestBattle('YES')}
                  disabled={battleMutation.isPending}
                  data-hotkey="LONG"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative h-40 border-2 rounded-2xl transition-all flex flex-col items-center justify-center gap-3 ${
                    activeHotkey === 'LONG' 
                    ? 'bg-green-500 border-white scale-[1.02]' 
                    : 'border-green-500/30 bg-green-500/5 hover:bg-green-500/20 hover:border-green-500/50'
                  }`}
                >
                  <div className={`absolute top-3 right-3 text-[10px] font-black uppercase ${activeHotkey === 'LONG' ? 'text-white' : 'text-green-500/40'}`}>
                    (W)
                  </div>
                  <motion.div
                    animate={activeHotkey === 'LONG' ? { y: [0, -5, 0] } : {}}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  >
                    <OctoIcons.TrendUp />
                  </motion.div>
                  <span className={`text-2xl font-black uppercase ${activeHotkey === 'LONG' ? 'text-white' : 'text-green-400'}`}>{t.playground?.longBtn || "LONG"}</span>
                </motion.button>
                
                <motion.button
                  onClick={() => requestBattle('NO')}
                  disabled={battleMutation.isPending}
                  data-hotkey="SHORT"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative h-40 border-2 rounded-2xl transition-all flex flex-col items-center justify-center gap-3 ${
                    activeHotkey === 'SHORT' 
                    ? 'bg-red-500 border-white scale-[1.02]' 
                    : 'border-red-500/30 bg-red-500/5 hover:bg-red-500/20 hover:border-red-500/50'
                  }`}
                >
                  <div className={`absolute top-3 right-3 text-[10px] font-black uppercase ${activeHotkey === 'SHORT' ? 'text-white' : 'text-red-500/40'}`}>
                    (S)
                  </div>
                  <motion.div
                    animate={activeHotkey === 'SHORT' ? { y: [0, 5, 0] } : {}}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  >
                    <OctoIcons.TrendDown />
                  </motion.div>
                  <span className={`text-2xl font-black uppercase ${activeHotkey === 'SHORT' ? 'text-white' : 'text-red-400'}`}>{t.playground?.shortBtn || "SHORT"}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Battles */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-purple-400"
              >
                <OctoIcons.Clock />
              </motion.div>
              <h2 className="text-xl font-black uppercase tracking-tight">{t.playground.recent}</h2>
            </div>
            
            <Link 
              href="/market"
              className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/10 rounded-xl transition-all group"
            >
              <motion.div
                className="text-cyan-400"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <OctoIcons.Market />
              </motion.div>
              <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-cyan-400">
                {t.playground?.marketLabel || "Market"}
              </span>
            </Link>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
            {recentBattles?.length > 0 ? (
              <div className="divide-y divide-white/5">
                {recentBattles.map((battle: any, index: number) => (
                  <motion.div 
                    key={battle.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col md:flex-row gap-4 p-5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-4 md:w-1/3">
                      <motion.div 
                        className="h-12 w-12 shrink-0 border border-cyan-500/30 bg-cyan-500/10 rounded-xl flex items-center justify-center"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <OctoIcons.Robot />
                      </motion.div>
                      <div>
                        <p className="text-sm font-black text-white truncate">
                          vs {battle.agent?.name}
                        </p>
                        <p className="text-[9px] text-white/30">
                          {new Date(battle.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-1 items-center gap-6">
                      <div className="border-l border-white/10 pl-4">
                        <p className="text-[9px] text-white/30 uppercase">{t.playground?.yourPick || "Your Pick"}</p>
                        <p className={`text-sm font-black ${(battle.marketResult ?? (battle.priceChange != null ? (battle.priceChange >= 0 ? 'YES' : 'NO') : null)) === battle.userPick ? 'text-green-400' : 'text-red-400'}`}>
                          {battle.userPick}
                        </p>
                      </div>
                      {battle.priceChange !== null && (
                        <div className="border-l border-white/10 pl-4">
                          <p className="text-[9px] text-white/30 uppercase">{t.playground?.price || "Price"}</p>
                          <p className={`text-sm font-mono font-black ${battle.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {battle.priceChange >= 0 ? '+' : ''}{battle.priceChange?.toFixed(2)}%
                          </p>
                        </div>
                      )}
                    </div>

                    <div className={`px-4 py-2 rounded-xl text-center text-[10px] font-black uppercase ${
                      battle.winner === 'USER' 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                        : battle.winner === 'AGENT' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                          : 'bg-white/5 text-white/40 border border-white/10'
                    }`}>
                      {battle.winner === 'USER' ? (t.playground?.victory || 'Victory') : battle.winner === 'AGENT' ? (t.playground?.defeat || 'Defeat') : (t.playground?.draw || 'Draw')}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <motion.svg 
                  className="w-20 h-20 text-white/10 mb-4"
                  viewBox="0 0 80 80"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <ellipse cx="40" cy="35" rx="20" ry="15" stroke="currentColor" strokeWidth="2" fill="none" />
                  <circle cx="35" cy="33" r="3" fill="currentColor" />
                  <circle cx="45" cy="33" r="3" fill="currentColor" />
                  <path d="M35 42 Q 40 38, 45 42" stroke="currentColor" strokeWidth="2" fill="none" />
                </motion.svg>
                <p className="text-sm text-white/30">{t.playground.noHistory}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md border-2 border-cyan-500/30 bg-[#0a0a0a] rounded-3xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-cyan-400"
                >
                  <OctoIcons.Bolt />
                </motion.div>
                <h3 className="text-lg font-black uppercase tracking-tight">{t.playground?.confirmBattle || "Confirm Battle"}</h3>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-[10px] font-bold uppercase text-white/30">{t.playground?.opponent || "Opponent"}</span>
                  <span className="text-sm font-black text-cyan-400">{selectedAgentData?.name}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-[10px] font-bold uppercase text-white/30">{t.playground?.bet || "Bet"}</span>
                  <span className="text-sm font-mono font-black text-white">{betAmount} PTS</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-[10px] font-bold uppercase text-white/30">{t.playground?.yourPick || "Your Pick"}</span>
                  <span className={`text-sm font-black ${pendingPick === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                    {pendingPick === 'YES' ? `${t.playground?.longBtn || 'LONG'} ↑` : `${t.playground?.shortBtn || 'SHORT'} ↓`}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setShowConfirmModal(false); setPendingPick(null); }}
                  disabled={battleMutation.isPending}
                  className="flex-1 py-3 text-xs font-bold uppercase bg-white/5 border border-white/10 text-white/40 rounded-xl hover:bg-white/10 transition-colors"
                >
                  {t.playground?.cancelBattle || "Cancel"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmBattle}
                  disabled={battleMutation.isPending}
                  className="flex-1 py-3 text-xs font-bold uppercase bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl flex items-center justify-center gap-2"
                >
                  {battleMutation.isPending ? (
                    <motion.div
                      className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    t.playground?.battleBtn || 'Battle!'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
