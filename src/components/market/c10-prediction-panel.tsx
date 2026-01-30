"use client";

import { useState } from "react";
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";
import { Market, api } from "../../lib/api";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/use-auth";
import { useSocket } from "../providers/socket-provider";
import { useEffect, useMemo } from "react";
import { VolatilityAmplifier } from "./volatility-amplifier";

interface C10PredictionPanelProps {
  market?: Market;
}

export function C10PredictionPanel({ market }: C10PredictionPanelProps) {
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const { user: authUser } = useAuth();
  const { socket } = useSocket();
  const [realtimePrice, setRealtimePrice] = useState<number>(0);
  const [prevPrice, setPrevPrice] = useState<number>(0);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 监听实时价格 - 恢复 indexUpdateMicro 监听以增强实时跳动感，减小节流时间
  useEffect(() => {
    if (socket && mounted) {
      let lastUpdateTime = 0;
      const THROTTLE_MS = 100;
      let prevVal: number | null = null;
      
      const handleUpdate = (data: any) => {
        const now = Date.now();
        if (now - lastUpdateTime >= THROTTLE_MS) {
          lastUpdateTime = now;
          const val = market?.category === 'GOLD' ? data?.gold?.value : data?.c10?.value;
          if (val) {
            setPrevPrice(prevVal || val);
            setRealtimePrice(val);
            prevVal = val;
          }
        }
      };
      socket.on('indexUpdateMicro', handleUpdate);
      return () => { socket.off('indexUpdateMicro', handleUpdate); };
    }
  }, [socket, market?.category, mounted]);

  // 获取用户资料 (包含 Combo 和 Multiplier) - 🆕 改为 30 秒刷新
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", authUser?.id || "guest"],
    queryFn: () => api.getUserProfile(authUser?.id),
    enabled: !!authUser?.id && mounted,
    refetchInterval: 30000, // 30秒（用户资料变化不频繁）
    staleTime: 10000, // 10秒内视为新鲜数据
  });

  // 获取全平台实时活跃订单 (實時交易)
  const { data: activeOrdersData } = useQuery({
    queryKey: ["globalActiveOrders"],
    queryFn: () => api.getGlobalActiveOrders(50),
    enabled: mounted,
    refetchInterval: 5000, // 5秒轮询一次
    staleTime: 2000,
  });

  const activeOrders = activeOrdersData?.success ? activeOrdersData.orders : [];

  // 获取全平台已结算历史订单 (歷史記錄)
  const { data: settledOrdersData } = useQuery({
    queryKey: ["globalSettledOrders"],
    queryFn: () => api.getGlobalSettledOrders(50),
    enabled: mounted,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const settledOrders = settledOrdersData?.success ? settledOrdersData.orders : [];

  // 🆕 恢复获取回合结果历史 (用于展示 K 线走势结果)
  const { data: roundHistoryData } = useQuery({
    queryKey: ["roundHistory", market?.category],
    queryFn: () => api.getRoundHistory(market?.category || 'C10', 20),
    enabled: mounted && (activeTab === "history"),
    refetchInterval: 15000,
  });

  const roundHistory = roundHistoryData?.success ? roundHistoryData.rounds : [];

  if (!mounted) return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-32 rounded-xl bg-white/5" />
      <div className="h-64 rounded-xl bg-white/5" />
    </div>
  );

  return (
    <div className="flex flex-col gap-2 sm:gap-4">
      {/* 🆕 波动率放大器 (视觉增强) */}
      <VolatilityAmplifier 
        currentPrice={realtimePrice || (market?.category === 'GOLD' ? 2700 : 36000)}
        previousPrice={market?.startPrice || prevPrice || (market?.category === 'GOLD' ? 2700 : 36000)}
        market={(market?.category as any) || 'C10'}
      />

      {/* Combo Card */}
      <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-3 sm:p-6 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
        <div className="flex items-center justify-between">
          <div className="relative flex h-14 w-14 sm:h-24 sm:w-24 items-center justify-center rounded-full border border-white/5 bg-white/[0.01]">
            <div className={`absolute inset-0 rounded-full border-2 border-cyan-500/20 ${userProfile?.combo > 0 ? 'animate-pulse' : ''}`}></div>
            <span className={`text-2xl sm:text-6xl font-black ${userProfile?.combo > 0 ? 'text-cyan-500' : 'text-white'}`}>
              {userProfile?.combo || 0}
            </span>
            <div className="absolute -bottom-1 rounded-full bg-white/10 px-2 py-0.5 text-[7px] sm:text-[10px] font-black uppercase text-white/60">
              {t.market.combo}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] sm:text-xs font-black uppercase text-white/40">{t.market.winStreak}</div>
            <div className="mt-0.5 text-[8px] sm:text-[11px] font-bold uppercase text-cyan-500/60">MAX COMBO: {userProfile?.maxCombo || 0}</div>
          </div>
        </div>

        <div className="mt-4 sm:mt-10 grid grid-cols-2 gap-4 border-t border-white/5 pt-3 sm:pt-6">
          <div className="space-y-0.5">
            <p className="text-[7px] sm:text-[11px] font-bold uppercase text-white/20">Next Payout</p>
            <p className="font-mono text-xs sm:text-base font-black text-cyan-500">
              +{((userProfile?.multiplier || 1.0) * 10).toFixed(0)} PTS
            </p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="text-[7px] sm:text-[11px] font-bold uppercase text-white/20">Multiplier</p>
            <p className={`font-mono text-xs sm:text-base font-black ${userProfile?.multiplier > 1.0 ? 'text-yellow-500' : 'text-white'}`}>
              {userProfile?.multiplier?.toFixed(1) || '1.0'}x
            </p>
          </div>
        </div>
      </div>

      {/* Feed List */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-white/5 bg-[#0a0a0a]">
        <div className="flex border-b border-white/5 bg-white/[0.01]">
          {["live", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2 sm:py-4 text-[9px] sm:text-[11px] font-black uppercase tracking-widest ${
                activeTab === tab ? "bg-white/5 text-green-500" : "text-white/20"
              }`}
            >
              {tab === "live" ? t.market.realtime : t.market.history}
            </button>
          ))}
        </div>
        
        <div className="min-h-[200px] sm:min-h-[440px] p-2 sm:p-4 space-y-4 overflow-y-auto no-scrollbar">
          {activeTab === "live" ? (
            activeOrders && activeOrders.length > 0 ? activeOrders.map((order: any, i: number) => (
              <div key={order.id || i} className="flex items-center justify-between border-b border-white/[0.02] py-2.5 last:border-0 hover:bg-white/[0.01] transition-colors px-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    order.position === "NO" || order.position === "AWAY" || order.position === "SHORT" 
                      ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" 
                      : "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"
                  }`} />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] sm:text-xs font-bold text-white/80 truncate">
                        {order.user?.username || (order.user?.address ? order.user.address.slice(0, 6) + '...' + order.user.address.slice(-4) : 'Anonymous')}
                      </span>
                      <span className={`text-[7px] px-1 rounded bg-white/5 text-white/40 font-black uppercase tracking-tighter shrink-0`}>
                        {order.module}
                      </span>
                    </div>
                    <span className="text-[8px] text-white/30 truncate uppercase font-bold mt-0.5">
                      {order.title}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-white/60 font-mono font-bold">{order.amount} PTS</span>
                    <span className="text-[7px] text-white/20 uppercase font-mono mt-0.5">
                      {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border min-w-[50px] text-center ${
                    order.position === "NO" || order.position === "AWAY" || order.position === "SHORT"
                      ? 'text-red-400 border-red-500/20 bg-red-500/5' 
                      : 'text-green-400 border-green-500/20 bg-green-500/5'
                  }`}>
                    {order.position === "NO" || order.position === "SHORT" ? 'SHORT' : order.position === "YES" || order.position === "LONG" ? 'LONG' : order.position}
                  </span>
                </div>
              </div>
            )) : (
              <div className="flex h-32 flex-col items-center justify-center gap-2">
                <div className="h-8 w-[1px] bg-gradient-to-b from-transparent to-white/10"></div>
                <p className="text-[10px] text-white/10 uppercase font-black tracking-widest">{t.common.noData}</p>
              </div>
            )
          ) : (
            <div className="space-y-6">
              {/* 🆕 第一部分：回合走势历史 (K线结果) */}
              {roundHistory && roundHistory.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[8px] font-black text-white/20 uppercase tracking-widest border-b border-white/5 pb-1">{t.market?.indexOutcomes || 'Index_Outcomes'}</div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {roundHistory.slice(0, 10).map((round: any) => (
                      <div key={round.id} className="flex flex-col items-center gap-1">
                        <div className={`w-full h-1 rounded-full ${
                          round.result === 'LONG_WIN' ? 'bg-green-500' : 
                          round.result === 'SHORT_WIN' ? 'bg-red-500' : 'bg-white/20'
                        }`} />
                        <span className="text-[7px] font-mono text-white/40">#{round.roundNumber.toString().slice(-3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 第二部分：訂單歷史 (結算訂單) */}
              <div className="space-y-2">
                <div className="text-[8px] font-black text-white/20 uppercase tracking-widest border-b border-white/5 pb-1">{t.market?.settledOrders || 'Settled_Orders'}</div>
                {settledOrders && settledOrders.length > 0 ? (
                  settledOrders.map((order: any, i: number) => (
                    <div key={order.id || i} className="flex items-center justify-between border-b border-white/[0.02] py-2.5 last:border-0 hover:bg-white/[0.01] transition-colors px-1 opacity-80">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] sm:text-xs font-bold text-white/60 truncate">
                              {order.user?.username || (order.user?.address ? order.user.address.slice(0, 6) + '...' + order.user.address.slice(-4) : 'Anonymous')}
                            </span>
                            <span className="text-[7px] px-1 rounded bg-white/5 text-white/20 font-black uppercase tracking-tighter">
                              {order.module}
                            </span>
                          </div>
                          <span className="text-[8px] text-white/30 truncate uppercase font-bold mt-0.5">
                            {order.title}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-[10px] font-mono font-black ${order.payout > order.amount ? 'text-green-400' : 'text-red-400'}`}>
                            {order.payout > 0 ? `+${order.payout.toFixed(0)}` : `-${order.amount}`} PTS
                          </span>
                          <span className="text-[7px] text-white/20 uppercase font-mono mt-0.5">
                            {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`w-1.5 h-1.5 rounded-full ${order.payout > order.amount ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-20 flex-col items-center justify-center gap-2">
                    <p className="text-[9px] text-white/10 uppercase font-black tracking-widest">{t.common.noData}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}