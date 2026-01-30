"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useUIStore } from "@/stores/ui-store";
import { useLanguageStore } from "@/stores/language-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSocket } from "@/components/providers/socket-provider";

// 预设下注金额
const BET_AMOUNTS = [10, 50, 100, 500];

interface SimpleTradingPanelProps {
  marketType: 'C10' | 'GOLD';
  currentPrice?: number;
  priceChange?: number;
}

export function SimpleTradingPanel({ 
  marketType, 
  currentPrice = 0,
  priceChange = 0 
}: SimpleTradingPanelProps) {
  const { user, isConnected, login, linkWallet, address } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile(user?.id || "");
  const { showNotification } = useUIStore();
  const { t, currentLanguage } = useLanguageStore();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  
  // 状态
  const [betAmount, setBetAmount] = useState(100);
  const [countdown, setCountdown] = useState(0);
  const [canBet, setCanBet] = useState(true);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  
  // 获取当前真实回合信息
  const { data: roundData, refetch: refetchRound } = useQuery({
    queryKey: ['currentRound', marketType],
    queryFn: () => api.getCurrentRound(marketType),
    refetchInterval: 5000,
    staleTime: 2000,
  });

  const currentRound = roundData?.success ? roundData.round : null;

  // 监听 WebSocket 事件
  useEffect(() => {
    if (!socket) return;

    const handleRoundUpdate = (data: any) => {
      if (data.category === marketType) {
        queryClient.invalidateQueries({ queryKey: ['currentRound', marketType] });
      }
    };

    const handleRoundSettled = (data: any) => {
      if (data.category === marketType) {
        refetchProfile();
        queryClient.invalidateQueries({ queryKey: ['currentRound', marketType] });
        queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['positions', user?.id] });
      }
    };

    socket.on('roundUpdate', handleRoundUpdate);
    socket.on('roundSettled', handleRoundSettled);

    return () => {
      socket.off('roundUpdate', handleRoundUpdate);
      socket.off('roundSettled', handleRoundSettled);
    };
  }, [socket, marketType, queryClient, user?.id, refetchProfile]);

  // 服务器同步倒计时逻辑
  useEffect(() => {
    const timer = setInterval(() => {
      if (!currentRound) return;
      const now = Date.now();
      const endTime = new Date(currentRound.endTime).getTime();
      const lockTime = new Date(currentRound.lockTime).getTime();
      
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setCountdown(remaining);
      
      // 只有在 BETTING 状态且未到锁定时间时才允许下注
      setCanBet(now < lockTime && currentRound.status === 'BETTING');
    }, 500);

    return () => clearInterval(timer);
  }, [currentRound]);

  // 获取用户在该回合的持仓
  const { data: positionsData } = useQuery({
    queryKey: ["positions", user?.id, currentRound?.id],
    queryFn: () => api.getPositions(user!.id, currentRound?.id),
    enabled: !!user?.id && !!currentRound?.id,
  });

  const myPosition = positionsData?.positions?.[0]; // 简化逻辑：一个回合通常只有一个方向

  // 下注处理
  const handleBet = async (side: 'LONG' | 'SHORT') => {
    if (!user?.id) {
      showNotification(currentLanguage === 'zh-TW' ? '請先登錄' : 'Please login first', 'WARNING');
      return;
    }
    
    if (!address) {
      showNotification(currentLanguage === 'zh-TW' ? '請先綁定錢包' : 'Please link wallet first', 'WARNING');
      return;
    }

    if (!canBet || !currentRound) {
      showNotification(currentLanguage === 'zh-TW' ? '回合已鎖定，請等待下一轮' : 'Round locked, please wait for next round', 'WARNING');
      return;
    }

    if ((profile?.pts || 0) < betAmount) {
      showNotification(currentLanguage === 'zh-TW' ? 'PTS 餘額不足' : 'Insufficient PTS balance', 'ERROR');
      return;
    }

    setIsPlacingBet(true);
    const sideParam = side === 'LONG' ? 'YES' : 'NO';
    
    try {
      await api.ammBuy(user.id, currentRound.id, sideParam, betAmount);
      
      showNotification(
        `${side === 'LONG' ? '🚀' : '📉'} ${currentLanguage === 'zh-TW' ? `下单成功: ${betAmount} PTS` : `Order placed: ${betAmount} PTS`}`,
        'SUCCESS'
      );
      
      refetchProfile();
      queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
      queryClient.invalidateQueries({ queryKey: ["positions", user.id, currentRound.id] });
    } catch (error: any) {
      showNotification(error.message || 'Trade failed', 'ERROR');
    } finally {
      setIsPlacingBet(false);
    }
  };

  const isLoggedIn = isConnected && user;
  const hasWallet = !!address;
  const userPts = profile?.pts || 0;
  const userMultiplier = profile?.multiplier || 1.0;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
      {/* 回合信息头部 */}
      <div className="border-b border-white/5 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 倒计时圆环 */}
            <div className={`relative flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full border-2 transition-colors ${
              countdown <= 5 ? 'border-red-500 bg-red-500/10' : 'border-cyan-500/50 bg-cyan-500/5'
            }`}>
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="3"
                  className={countdown <= 5 ? 'text-red-500/20' : 'text-cyan-500/20'} />
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="3"
                  strokeLinecap="round"
                  className={countdown <= 5 ? 'text-red-500' : 'text-cyan-400'}
                  strokeDasharray={`${(countdown / (currentRound?.ROUND_DURATION || 60)) * 176} 176`}
                  style={{ transition: 'stroke-dasharray 0.5s linear' }} />
              </svg>
              <span className={`text-2xl font-black tabular-nums min-w-[1.2em] text-center ${countdown <= 5 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                {countdown}
              </span>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${canBet ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
                <span className={`text-sm font-bold uppercase ${canBet ? 'text-green-400' : 'text-red-400'}`}>
                  {canBet ? (t.market?.open || 'OPEN') : countdown > 0 ? (t.market?.locked || 'LOCKED') : (t.market?.settling || 'SETTLING')}
                </span>
              </div>
              <p className="text-xs text-white/40 mt-0.5 font-mono">
                {t.market?.round || 'Round'} #{currentRound?.roundNumber || '---'} • {marketType}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-white/20 uppercase tracking-widest">{t.market?.yourBonus || 'Your Bonus'}</p>
            <p className="text-xs font-bold text-cyan-400/80 italic">{t.market?.comboBoost || 'COMBO_BOOST'} {((currentRound?.PAYOUT_RATIO || 1.95) * userMultiplier).toFixed(2)}x</p>
          </div>
        </div>
      </div>

      {/* 价格显示 */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-white/40 uppercase tracking-wider">{marketType} Index</p>
            <p className="text-3xl sm:text-4xl font-black tabular-nums text-white leading-none mt-1">
              {currentPrice > 0 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-lg ${priceChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <span className="text-lg font-bold">
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
        
        {/* 当前持仓显示 */}
        {myPosition && (
          <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between text-[10px] mb-2">
              <span className="text-white/40 uppercase font-black">{t.market?.currentPosition || 'Current Position'}</span>
              <span className="text-cyan-400 font-mono italic">#{currentRound?.roundNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${myPosition.side === 'YES' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                  {myPosition.side === 'YES' ? 'LONG' : 'SHORT'}
                </span>
                <span className="text-sm font-bold text-white">{myPosition.totalCost} PTS</span>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-white/30 uppercase">{t.market?.entryPrice || 'Entry Price'}</p>
                <p className="text-xs font-mono text-white/80">{myPosition.avgCost.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 下注金额选择 */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t.market?.wagerAmount || 'Wager Amount'}</p>
          <p className="text-[10px] text-white/60">
            {t.market?.wallet || 'Wallet'}: <span className="text-yellow-400 font-mono tabular-nums">{userPts.toLocaleString()} PTS</span>
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {BET_AMOUNTS.map(amount => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              className={`py-2 text-xs font-black rounded-lg transition-all ${
                betAmount === amount
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
              }`}
            >
              {amount}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(Math.min(Number(e.target.value), userPts))}
          className="w-full mt-3 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xl font-mono text-white focus:border-cyan-500/50 outline-none transition-colors"
          min={10}
          max={userPts}
        />
      </div>

      {/* 交易按钮 */}
      <div className="p-4">
        {!isLoggedIn ? (
          <button
            onClick={login}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black uppercase text-sm rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            {t.market?.loginToTrade || 'Login to Trade'}
          </button>
        ) : !hasWallet ? (
          <button
            onClick={linkWallet}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-yellow-600 text-white font-black uppercase text-sm rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
            </svg>
            {t.market?.linkWallet || 'Link Wallet'}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: canBet ? 1.02 : 1 }}
              whileTap={{ scale: canBet ? 0.98 : 1 }}
              onClick={() => handleBet('LONG')}
              disabled={!canBet || isPlacingBet}
              className={`group relative py-6 rounded-2xl font-black uppercase text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                !canBet
                  ? 'bg-gray-800/20 border border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-gradient-to-br from-green-500/20 to-green-600/5 border-2 border-green-500/30 text-green-400 hover:border-green-400 hover:bg-green-500/20 shadow-lg shadow-green-500/5'
              }`}
            >
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M23 6l-9.5 9.5-5-5L1 18" />
                <path d="M17 6h6v6" />
              </svg>
              <span className="text-base tracking-tighter">{!canBet ? (t.market?.waiting || 'WAITING') : (t.market?.long?.toUpperCase() || 'LONG')}</span>
              <span className="text-[10px] opacity-40 font-mono">{((currentRound?.PAYOUT_RATIO || 1.95) * userMultiplier).toFixed(2)}x {t.market?.payout?.toUpperCase() || 'PAYOUT'}</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: canBet ? 1.02 : 1 }}
              whileTap={{ scale: canBet ? 0.98 : 1 }}
              onClick={() => handleBet('SHORT')}
              disabled={!canBet || isPlacingBet}
              className={`group relative py-6 rounded-2xl font-black uppercase text-sm flex flex-col items-center justify-center gap-2 transition-all ${
                !canBet
                  ? 'bg-gray-800/20 border border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-gradient-to-br from-red-500/20 to-red-600/5 border-2 border-red-500/30 text-red-400 hover:border-red-400 hover:bg-red-500/20 shadow-lg shadow-red-500/5'
              }`}
            >
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M23 18l-9.5-9.5-5 5L1 6" />
                <path d="M17 18h6v-6" />
              </svg>
              <span className="text-base tracking-tighter">{!canBet ? (t.market?.waiting || 'WAITING') : (t.market?.short?.toUpperCase() || 'SHORT')}</span>
              <span className="text-[10px] opacity-40 font-mono">{((currentRound?.PAYOUT_RATIO || 1.95) * userMultiplier).toFixed(2)}x {t.market?.payout?.toUpperCase() || 'PAYOUT'}</span>
            </motion.button>
          </div>
        )}
        
        {/* 底部保障条 */}
        <div className="mt-4 flex items-center justify-center gap-6 px-4 py-2 bg-white/[0.02] rounded-lg border border-white/5">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-cyan-400" />
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{t.market?.oraclePyth || 'Oracle: Pyth'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-purple-400" />
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{t.market?.fee || 'Fee'}: 2.5%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-green-400" />
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{t.market?.secureAmm || 'Secure AMM'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
