"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useMarkets } from "@/hooks/use-markets";
import { C10MarketHeader } from "@/components/market/c10-header";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// 动态导入 K 线图组件（禁用 SSR，因为 lightweight-charts 不支持服务端渲染）
const C10PriceChart = dynamic(
  () => import("@/components/market/c10-price-chart").then(mod => mod.C10PriceChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] rounded-xl border border-white/5 bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-xs text-white/40">Loading Chart...</span>
        </div>
      </div>
    )
  }
);

// 动态导入 AMM 组件
const AMMTradingPanel = dynamic(
  () => import("@/components/market/amm-trading-panel").then(mod => mod.AMMTradingPanel),
  { ssr: false }
);
const AMMPriceChart = dynamic(
  () => import("@/components/market/amm-price-chart").then(mod => mod.AMMPriceChart),
  { ssr: false }
);

import { AiAnalystPanel } from "@/components/market/ai-analyst-panel";
import { C10PredictionPanel } from "@/components/market/c10-prediction-panel";
import { C10Components } from "@/components/market/c10-components";
import { SimpleTradingPanel } from "@/components/market/simple-trading-panel";
import { MarketOdds } from "@/components/market/market-odds";
import { BacktestPanel } from "@/components/market/backtest-panel";
import { SettlementReplay } from "@/components/market/settlement-replay";
import { EsportsMatches } from "@/components/market/esports-matches";
import { EsportsHotMatches } from "@/components/market/esports-hot-matches";
import { FootballMatches } from "@/components/market/football-matches";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Icons } from "@/components/ui/icons";
import { useLanguageStore } from "@/stores/language-store";
import { OctopusLoader } from "@/components/ui/octopus-loader";
import { SparklesCore } from "@/components/aceternity/sparkles";
import { WinAnimation } from "@/components/ui/win-animation";
import { useSocket } from "@/components/providers/socket-provider";

// 市场分类类型
type MarketCategory = 'C10' | 'GOLD' | 'ESPORTS' | 'FOOTBALL';

export default function C10MarketPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<MarketCategory>('C10');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [selectedEsportsMatchId, setSelectedEsportsMatchId] = useState<string | null>(null); // 🆕 选中的电竞比赛ID
  
  // 🆕 胜利动画状态
  const [winAnimation, setWinAnimation] = useState<{
    isVisible: boolean;
    payout: number;
    result: "WIN" | "LOSE" | "BREAKEVEN";
  }>({
    isVisible: false,
    payout: 0,
    result: "WIN",
  });

  const { markets, isLoading } = useMarkets();
  const { user: authUser } = useAuth();
  const { profile: userProfile } = useProfile(authUser?.id || "");
  const { t } = useLanguageStore();
  const { socket } = useSocket();

  // 🆕 监听结算事件以触发动画
  useEffect(() => {
    if (!socket || !authUser?.id) return;

    const handleBetSettled = (data: any) => {
      console.log("🎯 Received betSettled for animation:", data);
      if (data.result === "WIN") {
        setWinAnimation({
          isVisible: true,
          payout: data.payout,
          result: "WIN",
        });
      }
    };

    socket.on("betSettled", handleBetSettled);
    return () => {
      socket.off("betSettled", handleBetSettled);
    };
  }, [socket, authUser?.id]);

  // 获取当前回合信息（AMM 模式 - 仅用于电竞分类）
  // 优化：从 1 秒改为 5 秒，减少网络请求频率
  const { data: roundData } = useQuery({
    queryKey: ['currentRound', 'ESPORTS'],
    queryFn: () => api.getCurrentRound('ESPORTS'),
    refetchInterval: activeTab === 'ESPORTS' ? 5000 : false, // 非电竞分类时禁用轮询
    staleTime: 3000,
    enabled: activeTab === 'ESPORTS', // 仅在电竞分类时启用
  });
  
  const currentRound = roundData?.success ? roundData.round : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeMarket = markets?.find(m => m.category === activeTab && m.status === 'ACTIVE');

  if (!mounted) {
    return (
      <div className="relative flex h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
        {/* 背景闪烁效果 */}
        <div className="absolute inset-0">
          <SparklesCore
            background="transparent"
            minSize={0.3}
            maxSize={0.8}
            particleDensity={20}
            particleColor="#06b6d4"
          />
        </div>
        <OctopusLoader size="lg" text={t.marketPage?.initTerminal || "Initialising Terminal..."} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative flex h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
        <div className="absolute inset-0">
          <SparklesCore
            background="transparent"
            minSize={0.3}
            maxSize={0.8}
            particleDensity={15}
            particleColor="#a855f7"
          />
        </div>
        <OctopusLoader size="md" text={t.common?.loading || "Loading Markets..."} />
      </div>
    );
  }

  // 分类配置 - 章鱼触手数量代表难度/活跃度
  const mp = t.marketPage || {};
  const categories = [
    { 
      id: 'C10' as MarketCategory, 
      name: mp.categories?.c10?.name || 'C10 Index', 
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3v18h18" strokeLinecap="round" />
          <path d="M6 15l4-4 4 2 6-7" strokeLinecap="round" className="text-cyan-400" />
          {/* 小章鱼 */}
          <ellipse cx="20" cy="6" rx="2" ry="1.5" className="fill-cyan-400/30 stroke-cyan-400" />
          <circle cx="19.5" cy="5.8" r="0.3" fill="currentColor" />
          <circle cx="20.5" cy="5.8" r="0.3" fill="currentColor" />
        </svg>
      ),
      description: mp.categories?.c10?.desc || 'Crypto composite index',
      tentacles: 8
    },
    { 
      id: 'GOLD' as MarketCategory, 
      name: mp.categories?.gold?.name || 'Gold', 
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" className="fill-yellow-400/30 stroke-yellow-400" />
          {/* 小章鱼触手抱金币 */}
          <path d="M4 14c-1 2-1 4 0 5" strokeLinecap="round" className="text-yellow-400/60" />
          <path d="M20 14c1 2 1 4 0 5" strokeLinecap="round" className="text-yellow-400/60" />
        </svg>
      ),
      description: mp.categories?.gold?.desc || 'Precious metals market',
      tentacles: 4
    },
    { 
      id: 'ESPORTS' as MarketCategory, 
      name: mp.categories?.esports?.name || 'Live Esports', 
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="6" width="16" height="12" rx="2" className="stroke-purple-400" />
          <path d="M8 12h2M14 12h2M11 10v4" strokeLinecap="round" className="text-purple-400" />
          {/* 章鱼眼睛看屏幕 */}
          <circle cx="9" cy="4" r="1" className="fill-purple-400" />
          <circle cx="15" cy="4" r="1" className="fill-purple-400" />
          <path d="M9 4v2M15 4v2" strokeLinecap="round" className="text-purple-400/60" />
        </svg>
      ),
      description: mp.categories?.esports?.desc || 'Esports match predictions',
      tentacles: 6
    },
    { 
      id: 'FOOTBALL' as MarketCategory, 
      name: mp.categories?.football?.name || 'Football', 
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" className="stroke-green-400" />
          <path d="M12 3c0 0 4 4 4 9s-4 9-4 9M12 3c0 0-4 4-4 9s4 9 4 9" strokeLinecap="round" className="stroke-green-400" opacity="0.5" />
          <path d="M3 12h18" strokeLinecap="round" className="stroke-green-400" opacity="0.5" />
          {/* 小章鱼踢球 */}
          <ellipse cx="18" cy="18" rx="2" ry="1.5" className="fill-green-400/30 stroke-green-400" />
          <circle cx="17.5" cy="17.8" r="0.3" fill="currentColor" className="fill-green-400" />
          <circle cx="18.5" cy="17.8" r="0.3" fill="currentColor" className="fill-green-400" />
        </svg>
      ),
      description: mp.categories?.football?.desc || 'Global football leagues',
      tentacles: 7
    },
  ];

  return (
    <div className="flex flex-col min-h-screen max-w-[100vw] overflow-x-hidden">
      {/* 胜利动画组件 */}
      <WinAnimation
        isVisible={winAnimation.isVisible}
        payout={winAnimation.payout}
        result={winAnimation.result}
        onClose={() => setWinAnimation(prev => ({ ...prev, isVisible: false }))}
      />

      {/* 主内容区域 */}
      <div className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* 页面标题 */}
        <C10MarketHeader market={activeMarket} isLoading={isLoading} />

        {/* 二级分类切换器 - 章鱼风格 - 优化：移动端 2x2 网格，桌面端横向排列，取消左右滑动 */}
        <div className="grid grid-cols-2 md:flex md:items-center gap-2 sm:gap-3 select-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`group relative flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-xl border transition-all ${
                activeTab === cat.id
                  ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30 text-white shadow-lg shadow-cyan-500/10'
                  : 'bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/[0.05] hover:text-white hover:border-white/10'
              }`}
            >
              {/* 章鱼图标 - 移动端缩小 */}
              <span className={`transition-transform duration-300 flex-shrink-0 ${activeTab === cat.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {React.cloneElement(cat.icon as React.ReactElement, { className: 'w-5 h-5 sm:w-6 sm:h-6' })}
              </span>
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-sm font-bold truncate">{cat.name}</div>
                <div className="text-[9px] sm:text-[10px] text-white/40 flex items-center gap-1">
                  <span className="truncate hidden xs:inline">{cat.description}</span>
                  {/* 触手活跃度指示器 - 移动端简化 */}
                  <span className="flex gap-0.5 ml-1 flex-shrink-0">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <span 
                        key={i} 
                        className={`w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full ${
                          activeTab === cat.id ? 'bg-cyan-400' : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </span>
                </div>
              </div>
              {/* 活跃指示器 */}
              {activeTab === cat.id && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 主要内容网格 */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* 左侧：图表和交易面板 */}
          <div className="xl:col-span-8 space-y-6">
            {/* 电竞分类：AMM 模式 */}
            {activeTab === 'ESPORTS' ? (
              <>
                {/* 电竞赛事列表 - 接入真实数据 */}
                <EsportsMatches 
                  selectedMatchId={selectedEsportsMatchId}
                  onMatchSelect={setSelectedEsportsMatchId}
                />

                {/* AMM YES/NO 价格 K线图 */}
                {currentRound?.id && (
                  <AMMPriceChart roundId={currentRound.id} />
                )}

                {/* AMM 交易面板 */}
                {currentRound?.id && (
                  <AMMTradingPanel 
                    roundId={currentRound.id}
                    category="ESPORTS"
                  />
                )}
              </>
            ) : activeTab === 'FOOTBALL' ? (
              /* 足球分类：三向投注 */
              <>
                {/* 足球赛事列表 */}
                <FootballMatches />
              </>
            ) : (
              /* C10 和黄金：10秒回合制交易 */
              <>
                {/* 价格图表 - 实时K线 */}
                <C10PriceChart 
                  activeTab={activeTab as 'C10' | 'GOLD'}
                  onTabChange={(tab) => setActiveTab(tab)}
                  onPriceUpdate={(price, change) => {
                    setCurrentPrice(price);
                    setPriceChange(change);
                  }}
                />

                {/* 简化交易面板 - 直接买涨买跌 */}
                <SimpleTradingPanel
                  marketType={activeTab as 'C10' | 'GOLD'}
                  currentPrice={currentPrice}
                  priceChange={priceChange}
                />

                {/* 指数成分 */}
                <C10Components activeTab={activeTab as 'C10' | 'GOLD'} />
              </>
            )}
          </div>

          {/* 右侧：AI 面板和预测面板 */}
          <div className="xl:col-span-4 space-y-6">
            {/* 电竞分类：AMM 实时赔率面板 */}
            {activeTab === 'ESPORTS' && currentRound?.id && (
              <MarketOdds roundId={currentRound.id} />
            )}
            
            {/* 电竞分类：热门赛事 */}
            {activeTab === 'ESPORTS' && (
              <EsportsHotMatches 
                onMatchClick={(matchId) => {
                  console.log('🎯 从右侧边栏选择比赛:', matchId);
                  setSelectedEsportsMatchId(matchId);
                  // 滚动到主内容区域
                  setTimeout(() => {
                    const mainContent = document.querySelector('[data-esports-main]');
                    console.log('📍 查找主内容区域:', mainContent);
                    if (mainContent) {
                      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      console.log('✅ 已滚动到主内容区域');
                    } else {
                      console.error('❌ 未找到主内容区域元素');
                    }
                  }, 100);
                }}
              />
            )}

            {/* 足球分类：联赛信息面板 */}
            {activeTab === 'FOOTBALL' && (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a0a0a] to-[#0d0d0d] p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50">{mp.football?.hotLeagues || 'Hot Leagues'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: mp.football?.premierLeague || 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: 'from-purple-500/10 to-blue-500/10' },
                    { name: mp.football?.laLiga || 'La Liga', flag: '🇪🇸', color: 'from-red-500/10 to-yellow-500/10' },
                    { name: mp.football?.bundesliga || 'Bundesliga', flag: '🇩🇪', color: 'from-red-500/10 to-black/10' },
                    { name: mp.football?.serieA || 'Serie A', flag: '🇮🇹', color: 'from-green-500/10 to-white/5' },
                    { name: mp.football?.ligue1 || 'Ligue 1', flag: '🇫🇷', color: 'from-blue-500/10 to-red-500/10' },
                    { name: mp.football?.championsLeague || 'Champions League', flag: '⭐', color: 'from-blue-600/10 to-indigo-500/10' },
                  ].map((league) => (
                    <div 
                      key={league.name}
                      className={`p-3 rounded-xl bg-gradient-to-br ${league.color} border border-white/5 text-center hover:border-white/10 transition-all cursor-pointer`}
                    >
                      <span className="text-xl">{league.flag}</span>
                      <div className="text-xs font-medium text-white/80 mt-1">{league.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* C10/黄金 回合制面板 */}
            {(activeTab === 'C10' || activeTab === 'GOLD') && (
              <>
                <BacktestPanel market={activeMarket} />
                <AiAnalystPanel market={activeMarket} />
                <C10PredictionPanel market={activeMarket} />
                {activeMarket?.status === 'RESOLVED' && (
                  <SettlementReplay market={activeMarket} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}