"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";
import { api, AISuggestion } from "../../lib/api";
import { useUIStore } from "../../stores/ui-store";
import { useAuthStore } from "../../stores/auth-store";
import { useAuth } from "../../hooks/use-auth";

// 科技感图标组件库
const Icons = {
  Crypto: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8h4a2 2 0 1 1 0 4H9m0 0h5a2 2 0 1 1 0 4H9m3-10v2m0 8v2" opacity="0.5" />
    </svg>
  ),
  Gold: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 17h20L19 7H5L2 17z" />
      <path d="M12 7v10" opacity="0.3" />
      <path d="M7 12h10" opacity="0.3" />
    </svg>
  ),
  Brain: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 5c-3.5 0-6 2.5-6 6s2.5 6 6 6 6-2.5 6-6-2.5-6-6-6z" />
      <path d="M9 11h6M12 8v6" opacity="0.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" opacity="0.3" />
    </svg>
  ),
  Robot: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M9 12h.01M15 12h.01" />
      <path d="M12 8V5M8 5h8" />
    </svg>
  ),
  Bolt: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  Mask: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 10s4-1 10-1 10 1 10 1v4s-4 1-10 1-10-1-10-1v-4z" />
      <path d="M7 12h10" opacity="0.5" />
    </svg>
  ),
  Globe: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" opacity="0.5" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  TrendUp: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  ),
  TrendDown: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 18l-9.5-9.5-5 5L1 6" />
      <path d="M17 18h6v-6" />
    </svg>
  )
};

const AGENT_STRATEGY_MAP: Record<string, {
  id: string;
  nameKey: string;
  stopLoss: number;
  takeProfit: number;
  holdDuration: string;
  riskLevel: string;
}> = {
  'EASY': { id: 'conservative', nameKey: 'conservative', stopLoss: 10, takeProfit: 15, holdDuration: '1H', riskLevel: 'LOW' },
  'MEDIUM': { id: 'balanced', nameKey: 'balanced', stopLoss: 20, takeProfit: 30, holdDuration: '30M', riskLevel: 'MEDIUM' },
  'HARD': { id: 'aggressive', nameKey: 'aggressive', stopLoss: 30, takeProfit: 50, holdDuration: '10M', riskLevel: 'HIGH' },
  'MASTER': { id: 'whale', nameKey: 'whale', stopLoss: 0, takeProfit: 0, holdDuration: '10M', riskLevel: 'EXTREME' },
};

const MARKET_TYPES = [
  { id: 'C10', name: 'C10 Crypto Index', icon: <Icons.Crypto /> },
  { id: 'GOLD', name: 'Gold Index', icon: <Icons.Gold /> },
];

// 🆕 10秒回合制时间框架
const TIMEFRAMES = [
  { id: '10S', name: '10 Seconds', short: '10s', duration: 10 },
  { id: '30S', name: '30 Seconds', short: '30s', duration: 30 },
  { id: '1M', name: '1 Minute', short: '1m', duration: 60 },
  { id: '5M', name: '5 Minutes', short: '5m', duration: 300 },
];

const AI_MODELS = [
  { id: 'deepseek', name: 'DeepSeek V3', provider: 'deepseek', icon: <Icons.Brain />, desc: 'DeepSeek V3 Model' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', icon: <Icons.Robot />, desc: 'OpenAI Efficient Model' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', icon: <Icons.Bolt />, desc: 'OpenAI Flagship Model' },
  { id: 'claude-3', name: 'Claude 3', provider: 'anthropic', icon: <Icons.Mask />, desc: 'Anthropic Intelligent Model' },
  { id: 'qwen', name: 'Qwen', provider: 'alibaba', icon: <Icons.Globe />, desc: 'Alibaba Cloud Model' },
  { id: 'custom', name: 'Custom Model', provider: 'custom', icon: <Icons.Settings />, desc: 'Add your own AI model' },
];

interface StrategyConfigPanelProps {
  level: string;
  userId?: string;
  userPts: number;
  markets: any[];
  onAction: (position: 'YES' | 'NO', amount: number, strategy: any) => void;
  onClose?: () => void;
  mode: 'BATTLE' | 'TRADE';
  // 市場類型同步 props
  activeMarketType?: 'C10' | 'GOLD';
  onMarketTypeChange?: (type: 'C10' | 'GOLD') => void;
}

export function StrategyConfigPanel({ level, userId: propsUserId, userPts, markets, onAction, onClose, mode, activeMarketType, onMarketTypeChange }: StrategyConfigPanelProps) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const { showNotification } = useUIStore();
  const { token } = useAuthStore();
  const { login, isConnected, user: authUser, status, address, linkWallet } = useAuth();
  
  // 优先使用 props 传入的 userId，否则从 useAuth 获取
  const userId = propsUserId || authUser?.id;
  const isAuthenticated = isConnected && status === 'authenticated';
  // 检查是否绑定了钱包
  const hasWallet = !!address;
  
  // 钱包绑定提示状态
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);

  // 使用 props 或本地狀態（保持向後兼容）
  const [localMarketType, setLocalMarketType] = useState<'C10' | 'GOLD'>('C10');
  const selectedMarketType = activeMarketType ?? localMarketType;
  const setSelectedMarketType = (type: 'C10' | 'GOLD') => {
    if (onMarketTypeChange) {
      onMarketTypeChange(type);
    } else {
      setLocalMarketType(type);
    }
  };

  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('10S'); // 默认10秒回合
  const [selectedModel, setSelectedModel] = useState<string>('deepseek');
  const [betAmount, setBetAmount] = useState<number>(100);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTechnicalData, setShowTechnicalData] = useState(false);
  const [showCustomModelModal, setShowCustomModelModal] = useState(false);
  const [customModelConfig, setCustomModelConfig] = useState({
    name: '',
    apiKey: '',
    baseUrl: '',
    model: '',
  });

  // ============================================
  // 🆕 前端10秒回合制逻辑
  // ============================================
  const [frontendCountdown, setFrontendCountdown] = useState(10);
  const [frontendRoundNumber, setFrontendRoundNumber] = useState(0);
  const [frontendCanBet, setFrontendCanBet] = useState(true);

  // 获取当前时间框架的持续时间
  const currentDuration = TIMEFRAMES.find(t => t.id === selectedTimeframe)?.duration || 10;

  // 前端回合倒计时逻辑
  useEffect(() => {
    const updateFrontendCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const roundStart = Math.floor(now / currentDuration) * currentDuration;
      const elapsed = now - roundStart;
      const remaining = currentDuration - elapsed;
      setFrontendCountdown(remaining);
      setFrontendRoundNumber(Math.floor(now / currentDuration));
      // 最后3秒禁止下注
      setFrontendCanBet(remaining > 3);
    };

    updateFrontendCountdown();
    const timer = setInterval(updateFrontendCountdown, 100);
    return () => clearInterval(timer);
  }, [currentDuration]);

  // ============================================
  // AMM 回合制预测状态（后端同步）
  // ============================================
  const [currentRound, setCurrentRound] = useState<{
    id: string;
    roundNumber: number;
    status: 'BETTING' | 'LOCKED' | 'SETTLING' | 'SETTLED';
    countdown: number;
    canBet: boolean;
    openPrice: number;
  } | null>(null);
  const [ammPrices, setAmmPrices] = useState<{ yesPrice: number; noPrice: number } | null>(null);
  const [myPosition, setMyPosition] = useState<{ side: 'YES' | 'NO'; shares: number; totalCost: number } | null>(null);
  const [placingBet, setPlacingBet] = useState(false);

  // 获取当前回合
  const fetchCurrentRound = useCallback(async () => {
    try {
      const data = await api.getCurrentRound(selectedMarketType);
      if (data.success && data.round) {
        setCurrentRound({
          id: data.round.id,
          roundNumber: data.round.roundNumber,
          status: data.round.status,
          countdown: data.round.countdown,
          canBet: data.round.canBet,
          openPrice: data.round.openPrice,
        });
        
        // 获取 AMM 价格
        if (data.round.id) {
          try {
            const pricesData = await api.getAMMPrices(data.round.id);
            if (pricesData.success) {
              setAmmPrices({
                yesPrice: pricesData.yesPrice,
                noPrice: pricesData.noPrice,
              });
            }
          } catch (e) {
            console.error('Failed to fetch AMM prices:', e);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch round:', e);
    }
  }, [selectedMarketType]);

  // 获取我的 AMM 持仓
  const fetchMyPosition = useCallback(async () => {
    if (!userId || !currentRound?.id) return;
    try {
      const data = await api.getPositions(userId, currentRound.id);
      if (data.success && data.positions && data.positions.length > 0) {
        const openPosition = data.positions.find((p: any) => p.status === 'OPEN');
        if (openPosition) {
          setMyPosition({
            side: openPosition.side,
            shares: openPosition.shares,
            totalCost: openPosition.totalCost,
          });
        } else {
          setMyPosition(null);
        }
      } else {
        setMyPosition(null);
      }
    } catch (e) {
      console.error('Failed to fetch my position:', e);
      setMyPosition(null);
    }
  }, [userId, currentRound?.id]);

  // 定时更新回合状态
  useEffect(() => {
    fetchCurrentRound();
    const interval = setInterval(() => {
      fetchCurrentRound();
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchCurrentRound]);

  // 回合变化时获取持仓
  useEffect(() => {
    if (currentRound?.id) {
      fetchMyPosition();
    }
  }, [currentRound?.id, fetchMyPosition]);

  // AMM 买入处理（替代旧的下注）
  const handleAMMBuy = async (side: 'YES' | 'NO') => {
    if (!userId) {
      showNotification(currentLanguage === 'zh-TW' ? '請先登錄' : 'Please login first', 'WARNING');
      return;
    }
    // 检查是否绑定钱包
    if (!hasWallet) {
      setShowWalletPrompt(true);
      return;
    }
    if (!currentRound?.id) {
      showNotification(currentLanguage === 'zh-TW' ? '無可用回合' : 'No active round', 'WARNING');
      return;
    }
    if (!currentRound?.canBet) {
      showNotification(currentLanguage === 'zh-TW' ? '回合已鎖定' : 'Round is locked', 'WARNING');
      return;
    }

    setPlacingBet(true);
    try {
      const result = await api.ammBuy(userId, currentRound.id, side, betAmount);
      if (result.success) {
        setMyPosition({
          side,
          shares: result.shares,
          totalCost: betAmount,
        });
        showNotification(
          currentLanguage === 'zh-TW' 
            ? `成功買入 ${side} ${result.shares.toFixed(2)} 份額` 
            : `Successfully bought ${result.shares.toFixed(2)} ${side} shares`,
          'SUCCESS'
        );
        await fetchCurrentRound();
        await fetchMyPosition();
      }
    } catch (e: any) {
      showNotification(e.message || 'Failed to buy', 'ERROR');
    } finally {
      setPlacingBet(false);
    }
  };

  // 放弃持仓处理
  const [closingPosition, setClosingPosition] = useState(false);
  
  const handleClosePosition = async () => {
    if (!userId || !currentRound?.id || !myPosition) {
      return;
    }
    
    setClosingPosition(true);
    try {
      const result = await api.ammSell(userId, currentRound.id, myPosition.side, myPosition.shares);
      if (result.success) {
        showNotification(
          currentLanguage === 'zh-TW' 
            ? `已放棄持倉，獲得 ${result.amountOut?.toFixed(2) || 0} PTS` 
            : `Position closed, received ${result.amountOut?.toFixed(2) || 0} PTS`,
          'SUCCESS'
        );
        setMyPosition(null);
        await fetchCurrentRound();
        await fetchMyPosition();
      }
    } catch (e: any) {
      showNotification(e.message || 'Failed to close position', 'ERROR');
    } finally {
      setClosingPosition(false);
    }
  };

  // 格式化倒计时
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedAsset = selectedMarketType === 'C10' ? 'C10' : 'XAU';
  const currentStrategy = AGENT_STRATEGY_MAP[level] || AGENT_STRATEGY_MAP['MEDIUM'];

  // Load custom model from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customAiModel');
    if (saved) {
      try {
        setCustomModelConfig(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load custom AI model config:', e);
      }
    }
  }, []);

  const getTranslatedStrategyName = (level: string) => {
    switch(level) {
      case 'EASY': return t.playground.strategy.conservative;
      case 'MEDIUM': return t.playground.strategy.balanced;
      case 'HARD': return t.playground.strategy.aggressive;
      case 'MASTER': return t.playground.strategy.whale;
      default: return t.playground.strategy.balanced;
    }
  };

  const handleGenerateSuggestion = async () => {
    if (!userId) return;
    
    const activeMarket = markets?.find((m: any) => 
      m.status === 'ACTIVE' && 
      m.category === selectedMarketType &&
      m.timeframe === selectedTimeframe
    );

    if (!activeMarket) {
      showNotification(currentLanguage === 'zh-TW' ? `沒有找到 ${selectedMarketType} ${selectedTimeframe} 的活躍市場` : `No active ${selectedMarketType} ${selectedTimeframe} market found`, 'WARNING');
      return;
    }

    if (selectedModel === 'custom' && !customModelConfig.apiKey) {
      setShowCustomModelModal(true);
      return;
    }

    setIsGenerating(true);
    try {
      // @ts-ignore
      const suggestion = await api.generateSuggestionWithModel({
        userId,
        marketId: activeMarket.id,
        strategyId: currentStrategy.id,
        modelId: selectedModel,
        language: currentLanguage,
        customConfig: selectedModel === 'custom' ? customModelConfig : undefined,
      });
      setAiSuggestion(suggestion);
      setBetAmount(Math.min(suggestion.recommendedAmount, userPts || 10));
    } catch (error: any) {
      showNotification(`${currentLanguage === 'zh-TW' ? 'AI 分析失敗' : 'AI Analysis failed'}: ${error.message}`, 'ERROR');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="border border-red-500/30 bg-[#0a0a0a] overflow-hidden w-full">
      {/* 面板头部 */}
      <div className="flex items-center justify-between border-b border-red-500/20 bg-red-500/5 px-4 sm:px-6 py-3 sm:py-4 relative">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="h-2.5 sm:h-3 w-2.5 sm:w-3 rounded-full bg-red-500 animate-pulse flex-shrink-0"></div>
          <h3 className="text-base sm:text-lg font-black uppercase tracking-tight truncate">
            {getTranslatedStrategyName(level)} <span className="text-red-500">// {level}</span>
          </h3>
        </div>

        {/* 居中的模式标识 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-1.5 px-4 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/40 pointer-events-none">
          <div className={`w-1.5 h-1.5 rounded-full ${mode === 'BATTLE' ? 'bg-red-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></div>
          {mode === 'BATTLE' 
            ? (currentLanguage === 'zh-TW' ? 'AI 對抗模式 // BATTLE_MODE' : 'AI Battle Mode // BATTLE_MODE')
            : (currentLanguage === 'zh-TW' ? '真實預測市場 // REAL_MARKET' : 'Real Prediction Market // REAL_MARKET')
          }
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors flex-shrink-0 ml-2 text-lg sm:text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* 市场和资产选择 */}
      <div className="border-b border-white/5 bg-[#080808]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-white/5">
          <div className="bg-[#0a0a0a] p-3 sm:p-4">
            <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2 sm:mb-3">
              {t.playground.strategy.selectMarket}
            </p>
            <div className="flex gap-2">
              {MARKET_TYPES.map(market => (
                <button
                  key={market.id}
                  onClick={() => {
                    setSelectedMarketType(market.id as 'C10' | 'GOLD');
                    setAiSuggestion(null);
                  }}
                  className={`flex-1 py-2 px-3 text-[10px] sm:text-xs font-bold uppercase border transition-all flex items-center justify-center gap-2 ${
                    selectedMarketType === market.id
                      ? market.id === 'C10' 
                        ? 'bg-orange-500/20 border-orange-500 text-orange-500'
                        : 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                      : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                  }`}
                >
                  {market.icon} {market.id === 'C10' ? t.playground.strategy.cryptoIndex : t.playground.strategy.goldIndex}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0a0a0a] p-4 border border-white/5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-3">
              {t.playground.strategy.calcTitle}
            </p>
            <div className="space-y-2 text-[10px] text-white/60 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-bold"><Icons.TrendUp /></span>
                <div>
                  <span className="font-bold text-white/80">{t.playground.strategy.long}:</span>
                  <span className="ml-2 font-mono">{t.playground.strategy.calcYes}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold"><Icons.TrendDown /></span>
                <div>
                  <span className="font-bold text-white/80">{t.playground.strategy.short}:</span>
                  <span className="ml-2 font-mono">{t.playground.strategy.calcNo}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] p-3 sm:p-4">
            <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2 sm:mb-3">
              {t.playground.strategy.timeframe}
            </p>
            <div className="flex gap-1">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.id}
                  onClick={() => {
                    setSelectedTimeframe(tf.id);
                    setAiSuggestion(null);
                  }}
                  className={`flex-1 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-bold border transition-all ${
                    selectedTimeframe === tf.id
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-500'
                      : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                  }`}
                >
                  {tf.short}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI 模型选择 */}
      <div className="border-b border-white/5 bg-[#080808] px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/30">
            {t.playground.strategy.aiModel}
          </p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5 sm:gap-2">
          {AI_MODELS.map(model => (
            <button
              key={model.id}
              onClick={() => {
                if (model.id === 'custom' && !customModelConfig.apiKey) {
                  setShowCustomModelModal(true);
                } else {
                  setSelectedModel(model.id);
                  setAiSuggestion(null);
                }
              }}
              className={`p-2 sm:p-3 border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                selectedModel === model.id
                  ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                  : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
              }`}
            >
              {model.icon}
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight block">
                {model.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-white/5">
        <div className="bg-[#0a0a0a] p-4 sm:p-6">
          <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/30 mb-3 sm:mb-4">
            {t.playground.strategy.params}
          </p>
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 border border-white/10 bg-black/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] sm:text-[9px] text-white/30 uppercase">{t.playground.strategy.target}</span>
              <span className={`text-[11px] sm:text-xs font-black flex items-center gap-1 ${selectedMarketType === 'C10' ? 'text-orange-500' : 'text-yellow-500'}`}>
                {selectedMarketType === 'C10' ? <Icons.Crypto /> : <Icons.Gold />} {selectedAsset}/{selectedTimeframe}
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-white/40">
              {selectedMarketType === 'C10' ? t.playground.strategy.cryptoDesc : t.playground.strategy.goldDesc}
            </p>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] sm:text-xs text-white/60">{t.playground.strategy.sl}</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-red-500">
                {currentStrategy.stopLoss > 0 ? `-${currentStrategy.stopLoss}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] sm:text-xs text-white/60">{t.playground.strategy.tp}</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-green-500">
                {currentStrategy.takeProfit > 0 ? `+${currentStrategy.takeProfit}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] sm:text-xs text-white/60">{t.playground.strategy.pts}</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-yellow-500">{userPts?.toLocaleString() || 0} PTS</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] p-4 sm:p-6">
          <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/30 mb-3 sm:mb-4">
            {t.playground.strategy.suggestion} 
          </p>
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-24 sm:h-32">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2 sm:mb-3"></div>
              <p className="text-[10px] sm:text-xs text-white/40">{currentLanguage === 'zh-TW' ? 'AI 正在分析' : 'AI Analyzing'}...</p>
            </div>
          ) : aiSuggestion ? (
            <div className="space-y-3 sm:space-y-4">
              <div className={`p-3 sm:p-4 border ${aiSuggestion.suggestion === 'YES' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                <p className={`text-xl sm:text-2xl font-black flex items-center gap-2 ${aiSuggestion.suggestion === 'YES' ? 'text-green-500' : 'text-red-500'}`}>
                  {aiSuggestion.suggestion === 'YES' ? <Icons.TrendUp /> : <Icons.TrendDown />}
                  {aiSuggestion.suggestion === 'YES' ? `${t.playground.strategy.long} LONG` : `${t.playground.strategy.short} SHORT`}
                </p>
              </div>
              <p className="text-[9px] sm:text-[10px] text-white/40 leading-relaxed truncate-3-lines">{aiSuggestion.reasoning}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 sm:h-32">
              <button
                onClick={handleGenerateSuggestion}
                className="px-4 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <Icons.Brain /> {t.playground.strategy.generateSuggestion}
              </button>
            </div>
          )}
        </div>

        <div className="bg-[#0a0a0a] p-4 sm:p-6">
          <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/30 mb-3 sm:mb-4">
            {t.playground.strategy.action} // ROUND #{frontendRoundNumber}
          </p>
          
          {/* 🆕 前端10秒回合倒计时显示 */}
          <div className="mb-4 relative">
            {/* 回合倒计时圆环 */}
            <div className="flex items-center justify-between p-3 border border-white/10 bg-black/50 rounded-lg">
              <div className="flex items-center gap-3">
                {/* 倒计时圆环 */}
                <div className={`relative flex items-center justify-center w-14 h-14 rounded-full border-2 ${
                  frontendCountdown <= 3 ? 'border-red-500 bg-red-500/10' : 'border-cyan-500/50 bg-cyan-500/5'
                }`}>
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
                    <circle 
                      cx="28" cy="28" r="24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="3"
                      className={frontendCountdown <= 3 ? 'text-red-500/20' : 'text-cyan-500/20'}
                    />
                    <circle 
                      cx="28" cy="28" r="24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="3"
                      strokeLinecap="round"
                      className={frontendCountdown <= 3 ? 'text-red-500' : 'text-cyan-400'}
                      strokeDasharray={`${(frontendCountdown / currentDuration) * 150.8} 150.8`}
                      style={{ transition: 'stroke-dasharray 0.1s linear' }}
                    />
                  </svg>
                  <span className={`text-xl font-black tabular-nums ${frontendCountdown <= 3 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                    {frontendCountdown}
                  </span>
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${frontendCanBet ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
                    <span className="text-[10px] font-bold uppercase text-white/60">
                      {frontendCanBet ? 'OPEN' : frontendCountdown > 0 ? 'CLOSING' : 'SETTLING'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-white/40 mt-1">
                    Round #{frontendRoundNumber} • {selectedTimeframe}
                  </p>
                </div>
              </div>
              
              {/* 时间框架快捷切换 */}
              <div className="flex gap-1">
                {TIMEFRAMES.slice(0, 3).map(tf => (
                  <button
                    key={tf.id}
                    onClick={() => setSelectedTimeframe(tf.id)}
                    className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${
                      selectedTimeframe === tf.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-white/5 text-white/30 border border-white/5 hover:text-white/50'
                    }`}
                  >
                    {tf.short}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AMM 价格显示 */}
          {ammPrices && (
            <div className="mb-3 grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 border border-green-500/30 bg-green-500/10 text-center">
                <span className="text-white/40">▲ 看涨</span>
                <span className="block text-green-500 font-mono font-bold">${ammPrices.yesPrice.toFixed(4)}</span>
              </div>
              <div className="p-2 border border-red-500/30 bg-red-500/10 text-center">
                <span className="text-white/40">▼ 看跌</span>
                <span className="block text-red-500 font-mono font-bold">${ammPrices.noPrice.toFixed(4)}</span>
              </div>
            </div>
          )}

          {/* 当前持仓显示 */}
          {myPosition && (
            <div className={`mb-3 p-3 border rounded-lg ${
              myPosition.side === 'YES' 
                ? 'border-green-500/50 bg-green-500/10' 
                : 'border-red-500/50 bg-red-500/10'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-white/60">当前持仓</span>
                <span className={`text-xs font-black ${myPosition.side === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                  {myPosition.side === 'YES' ? '▲ 看涨' : '▼ 看跌'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                <div>
                  <span className="text-white/40">份额</span>
                  <span className="block font-mono font-bold text-white">{myPosition.shares.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-white/40">成本</span>
                  <span className="block font-mono font-bold text-white">{myPosition.totalCost.toFixed(2)} PTS</span>
                </div>
              </div>
              {/* 放弃持仓按钮 */}
              <button
                onClick={handleClosePosition}
                disabled={closingPosition || !frontendCanBet}
                className="w-full py-2 text-[10px] font-bold uppercase border border-orange-500/50 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-lg"
              >
                {closingPosition ? (currentLanguage === 'zh-TW' ? '處理中...' : 'Processing...') : (currentLanguage === 'zh-TW' ? '放棄持倉 (提前退出)' : 'Close Position (Exit Early)')}
              </button>
            </div>
          )}

          {/* 下注金额 - 只在没有持仓时显示 */}
          {!myPosition && (
          <div className="mb-3 sm:mb-4">
            <label className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/30 block mb-2">{t.playground.strategy.amount}</label>
            <div className="flex gap-1 mb-2">
              {[50, 100, 200, 500].map(amt => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  className={`flex-1 py-1 text-[9px] font-bold border transition-all ${
                    betAmount === amt 
                      ? 'bg-red-500/20 border-red-500 text-red-500' 
                      : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.min(Number(e.target.value), userPts || 0))}
              className="w-full bg-black border border-white/10 px-3 py-2 text-base font-mono font-bold text-white outline-none focus:border-red-500/50"
              min={10}
              max={1000}
            />
          </div>
          )}

          {/* YES/NO AMM 买入按钮 或 登录按钮 - 只在没有持仓时显示 */}
          {!myPosition && (
            <>
              {!isAuthenticated ? (
                <button
                  onClick={login}
                  className="w-full py-4 border border-purple-500/50 bg-purple-600/20 text-purple-400 font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-purple-600/30 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {status === 'loading' 
                    ? (currentLanguage === 'zh-TW' ? '加載中...' : 'Loading...')
                    : (currentLanguage === 'zh-TW' ? '登錄開始交易' : 'Login to Trade')}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAMMBuy('YES')}
                    disabled={placingBet || !frontendCanBet}
                    className={`py-4 border font-black uppercase text-xs flex flex-col items-center justify-center gap-1 transition-all rounded-lg ${
                      !frontendCanBet
                        ? 'bg-gray-600/20 border-gray-500/30 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600/20 border-green-500/50 text-green-500 hover:bg-green-600/30 active:scale-95'
                    }`}
                  >
                    <Icons.TrendUp />
                    <span>{!frontendCanBet ? (currentLanguage === 'zh-TW' ? '等待中' : 'WAIT') : (currentLanguage === 'zh-TW' ? '看涨' : 'LONG')}</span>
                    <span className="text-[10px] opacity-60">{betAmount} PTS</span>
                  </button>
                  <button
                    onClick={() => handleAMMBuy('NO')}
                    disabled={placingBet || !frontendCanBet}
                    className={`py-4 border font-black uppercase text-xs flex flex-col items-center justify-center gap-1 transition-all rounded-lg ${
                      !frontendCanBet
                        ? 'bg-gray-600/20 border-gray-500/30 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600/20 border-red-500/50 text-red-500 hover:bg-red-600/30 active:scale-95'
                    }`}
                  >
                    <Icons.TrendDown />
                    <span>{!frontendCanBet ? (currentLanguage === 'zh-TW' ? '等待中' : 'WAIT') : (currentLanguage === 'zh-TW' ? '看跌' : 'SHORT')}</span>
                    <span className="text-[10px] opacity-60">{betAmount} PTS</span>
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* 持仓状态提示 */}
          {myPosition && (
            <div className="text-center text-[10px] text-white/40 py-2">
              持有到回合结束自动结算，或点击上方按钮提前退出
            </div>
          )}

          {/* AMM 价格分布条 */}
          {ammPrices && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-green-500">看涨: {(ammPrices.yesPrice * 100).toFixed(1)}%</span>
                <span className="text-red-500">看跌: {(ammPrices.noPrice * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden flex">
                <div 
                  className="bg-green-500 transition-all duration-500"
                  style={{ width: `${ammPrices.yesPrice * 100}%` }}
                />
                <div 
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${ammPrices.noPrice * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Model Modal */}
      {showCustomModelModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border border-purple-500/30 bg-[#0a0a0a] p-6">
             <h3 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
               <Icons.Settings /> {t.playground.strategy.configCustomModel}
             </h3>
             <input 
               type="password" 
               placeholder="API Key" 
               value={customModelConfig.apiKey}
               onChange={e => setCustomModelConfig(prev => ({...prev, apiKey: e.target.value}))}
               className="w-full bg-black border border-white/10 px-4 py-2 text-sm text-white focus:border-purple-500 outline-none mb-4"
             />
             <button 
               onClick={() => {
                 localStorage.setItem('customAiModel', JSON.stringify(customModelConfig));
                 setShowCustomModelModal(false);
                 setSelectedModel('custom');
               }}
               className="w-full py-3 bg-purple-600 text-white font-bold uppercase text-xs"
             >
               {t.common.save}
             </button>
          </div>
        </div>
      )}

      {/* 钱包绑定提示弹窗 */}
      {showWalletPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border border-orange-500/30 bg-[#0a0a0a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-orange-500">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
                </svg>
                {currentLanguage === 'zh-TW' ? '需要綁定錢包' : 'Wallet Required'}
              </h3>
              <button 
                onClick={() => setShowWalletPrompt(false)}
                className="text-white/40 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              {currentLanguage === 'zh-TW' 
                ? '為了進行交易，您需要綁定一個錢包地址。這將用於記錄您的交易和結算獎勵。'
                : 'To make trades, you need to link a wallet address. This will be used to record your trades and settle rewards.'}
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  setShowWalletPrompt(false);
                  linkWallet();
                }}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
                </svg>
                {currentLanguage === 'zh-TW' ? '立即綁定錢包' : 'Link Wallet Now'}
              </button>
              
              <button 
                onClick={() => setShowWalletPrompt(false)}
                className="w-full py-2 border border-white/10 text-white/40 hover:text-white/60 text-xs uppercase transition-colors"
              >
                {currentLanguage === 'zh-TW' ? '稍後再說' : 'Maybe Later'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
