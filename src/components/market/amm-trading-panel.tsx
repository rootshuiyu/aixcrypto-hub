"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useSocket } from "../providers/socket-provider";
import { useAuthStore } from "../../stores/auth-store";
import { useAuth } from "../../hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AMMTradingPanelProps {
  roundId: string;
  category?: string;
}

export function AMMTradingPanel({ roundId, category = 'C10' }: AMMTradingPanelProps) {
  const { socket } = useSocket();
  const { user } = useAuthStore();
  const { login, isConnected, status, linkWallet, user: authUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedSide, setSelectedSide] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState<string>('');
  const [sharesToSell, setSharesToSell] = useState<string>('');
  // 实时价格
  const [livePrice, setLivePrice] = useState<{ yesPrice: number; noPrice: number } | null>(null);
  
  // 认证状态
  const isAuthenticated = isConnected && status === 'authenticated';

  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取 AMM 池信息
  const { data: poolData, isLoading: poolLoading } = useQuery({
    queryKey: ["ammPool", roundId],
    queryFn: () => api.getAMMPool(roundId),
    enabled: mounted && !!roundId,
    refetchInterval: 10000, // 优化：从 5 秒改为 10 秒
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  // 获取用户持仓
  const { data: positionsData, refetch: refetchPositions } = useQuery({
    queryKey: ["positions", user?.id, roundId],
    queryFn: () => api.getPositions(user!.id, roundId),
    enabled: mounted && !!user?.id && !!roundId,
    refetchInterval: 15000, // 优化：从 5 秒改为 15 秒
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  // 买入报价
  const { data: buyQuote, isFetching: quoteFetching } = useQuery({
    queryKey: ["buyQuote", roundId, selectedSide, amount],
    queryFn: () => api.quoteBuy(roundId, selectedSide, parseFloat(amount)),
    enabled: mounted && activeTab === 'BUY' && !!amount && parseFloat(amount) > 0,
    staleTime: 1000,
  });

  // 卖出报价
  const { data: sellQuote } = useQuery({
    queryKey: ["sellQuote", roundId, selectedSide, sharesToSell],
    queryFn: () => api.quoteSell(roundId, selectedSide, parseFloat(sharesToSell)),
    enabled: mounted && activeTab === 'SELL' && !!sharesToSell && parseFloat(sharesToSell) > 0,
    staleTime: 1000,
  });

  // 获取当前真实回合信息
  const { data: roundData } = useQuery({
    queryKey: ['currentRound', category],
    queryFn: () => api.getCurrentRound(category),
    refetchInterval: 5000,
  });
  const currentRound = roundData?.success ? roundData.round : null;

  // 检查是否锁定
  const [canBet, setCanBet] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!currentRound) return;
      const now = Date.now();
      const lockTime = new Date(currentRound.lockTime).getTime();
      setCanBet(now < lockTime && currentRound.status === 'BETTING');
    }, 500);
    return () => clearInterval(timer);
  }, [currentRound]);

  // 买入操作
  const buyMutation = useMutation({
    mutationFn: () => {
      if (!canBet) throw new Error("Round is locked");
      return api.ammBuy(user!.id, roundId, selectedSide, parseFloat(amount));
    },
    onSuccess: () => {
      setAmount('');
      refetchPositions();
      queryClient.invalidateQueries({ queryKey: ["ammPool", roundId] });
    },
  });

  // 卖出操作
  const sellMutation = useMutation({
    mutationFn: () => api.ammSell(user!.id, roundId, selectedSide, parseFloat(sharesToSell)),
    onSuccess: () => {
      setSharesToSell('');
      refetchPositions();
      queryClient.invalidateQueries({ queryKey: ["ammPool", roundId] });
    },
  });

  // WebSocket 监听价格更新
  useEffect(() => {
    if (!socket || !mounted) return;

    const handlePriceUpdate = (data: any) => {
      if (data.roundId === roundId) {
        setLivePrice({
          yesPrice: data.yesPrice,
          noPrice: data.noPrice,
        });
      }
    };

    socket.on('ammPriceUpdate', handlePriceUpdate);
    return () => {
      socket.off('ammPriceUpdate', handlePriceUpdate);
    };
  }, [socket, roundId, mounted]);

  // 获取当前价格
  const prices = livePrice || {
    yesPrice: poolData?.pool?.yesPrice || 0.5,
    noPrice: poolData?.pool?.noPrice || 0.5,
  };

  // 获取用户当前方向的持仓
  const currentPosition = positionsData?.positions?.find(
    (p: any) => p.side === selectedSide && p.status === 'OPEN'
  );
  const availableShares = currentPosition 
    ? currentPosition.shares - (currentPosition.closedShares || 0) 
    : 0;

  // 快捷金额按钮
  const quickAmounts = [10, 50, 100, 500];

  if (!mounted) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-4 animate-pulse">
        <div className="h-8 w-32 bg-white/10 rounded mb-4" />
        <div className="h-48 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-4 space-y-4">
      {/* 标题 + 实时价格 */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
          AMM_TRADING
        </div>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] text-green-500/80 uppercase font-bold">Live</span>
        </div>
      </div>

      {/* 价格显示 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSelectedSide('YES')}
          className={`p-3 rounded-lg border transition-all ${
            selectedSide === 'YES'
              ? 'border-green-500 bg-green-500/10'
              : 'border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="text-xs text-white/60 flex items-center gap-1">
            <span className="text-green-400">▲</span> 看涨
          </div>
          <div className={`text-xl font-mono font-bold ${
            selectedSide === 'YES' ? 'text-green-400' : 'text-white'
          }`}>
            ${prices.yesPrice.toFixed(4)}
          </div>
          <div className="text-[10px] text-white/40">
            {(prices.yesPrice * 100).toFixed(1)}% 概率
          </div>
        </button>
        
        <button
          onClick={() => setSelectedSide('NO')}
          className={`p-3 rounded-lg border transition-all ${
            selectedSide === 'NO'
              ? 'border-red-500 bg-red-500/10'
              : 'border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="text-xs text-white/60 flex items-center gap-1">
            <span className="text-red-400">▼</span> 看跌
          </div>
          <div className={`text-xl font-mono font-bold ${
            selectedSide === 'NO' ? 'text-red-400' : 'text-white'
          }`}>
            ${prices.noPrice.toFixed(4)}
          </div>
          <div className="text-[10px] text-white/40">
            {(prices.noPrice * 100).toFixed(1)}% 概率
          </div>
        </button>
      </div>

      {/* 买入/卖出 Tab */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('BUY')}
          className={`flex-1 py-2 text-sm font-bold transition-all ${
            activeTab === 'BUY'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          买入
        </button>
        <button
          onClick={() => setActiveTab('SELL')}
          className={`flex-1 py-2 text-sm font-bold transition-all ${
            activeTab === 'SELL'
              ? 'text-red-400 border-b-2 border-red-400'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          卖出
        </button>
      </div>

      {/* 买入面板 */}
      {activeTab === 'BUY' && (
        <div className="space-y-3">
          {/* 金额输入 */}
          <div>
            <label className="text-[10px] text-white/40 uppercase">金额 (PTS)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="输入金额..."
              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500"
            />
          </div>

          {/* 快捷金额 */}
          <div className="flex gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className="flex-1 py-1 text-xs bg-white/5 hover:bg-white/10 rounded border border-white/10 text-white/60 hover:text-white"
              >
                {amt}
              </button>
            ))}
          </div>

          {/* 报价信息 */}
          {buyQuote?.quote && (
            <div className="p-3 bg-white/5 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">预计获得份额</span>
                <span className="text-white font-mono">{buyQuote.quote.sharesOut.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">平均价格</span>
                <span className="text-white font-mono">${buyQuote.quote.avgPrice.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">价格影响</span>
                <span className={buyQuote.quote.priceImpact > 1 ? 'text-yellow-400' : 'text-white/60'}>
                  {buyQuote.quote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">手续费</span>
                <span className="text-white/60">{buyQuote.quote.fee.toFixed(4)} PTS</span>
              </div>
            </div>
          )}

          {/* 买入按钮 */}
          {!isAuthenticated ? (
            <button
              onClick={login}
              className="w-full py-3 rounded-lg font-bold text-sm bg-purple-500 hover:bg-purple-600 text-white transition-all"
            >
              {status === 'loading' ? '加载中...' : '登录开始交易'}
            </button>
          ) : !user?.id ? (
            <button
              disabled
              className="w-full py-3 rounded-lg font-bold text-sm bg-gray-500/30 text-white/50 cursor-not-allowed"
            >
              同步账户中...
            </button>
          ) : !isConnected || !authUser?.address ? (
            <button
              onClick={linkWallet}
              className="w-full py-3 rounded-lg font-bold text-sm bg-gradient-to-r from-orange-600 to-yellow-600 text-white transition-all shadow-lg"
            >
              绑定钱包
            </button>
          ) : (
            <button
              onClick={() => buyMutation.mutate()}
              disabled={!amount || parseFloat(amount) <= 0 || buyMutation.isPending || !canBet}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                !canBet 
                  ? 'bg-gray-800 text-white/20' 
                  : selectedSide === 'YES'
                    ? 'bg-green-500 hover:bg-green-600 text-black disabled:bg-green-500/30'
                    : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-red-500/30'
              } disabled:cursor-not-allowed`}
            >
              {buyMutation.isPending ? '处理中...' : !canBet ? '已锁定 (LOCKED)' : `买入 ${selectedSide === 'YES' ? '看涨' : '看跌'}`}
            </button>
          )}

          {buyMutation.isError && (
            <div className="text-xs text-red-400 text-center">
              {(buyMutation.error as Error).message}
            </div>
          )}
        </div>
      )}

      {/* 卖出面板 */}
      {activeTab === 'SELL' && (
        <div className="space-y-3">
          {/* 当前持仓 */}
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-white/40 uppercase">当前持仓</span>
              <span className={`text-sm font-mono font-bold ${
                selectedSide === 'YES' ? 'text-green-400' : 'text-red-400'
              }`}>
                {availableShares.toFixed(4)} 份
              </span>
            </div>
            {currentPosition && (
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-white/40">未实现盈亏</span>
                <span className={currentPosition.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {currentPosition.unrealizedPnL >= 0 ? '+' : ''}{currentPosition.unrealizedPnL?.toFixed(2) || 0} PTS
                </span>
              </div>
            )}
          </div>

          {/* 份额输入 */}
          <div>
            <label className="text-[10px] text-white/40 uppercase">卖出份额</label>
            <input
              type="number"
              value={sharesToSell}
              onChange={(e) => setSharesToSell(e.target.value)}
              placeholder="输入份额..."
              max={availableShares}
              className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
            />
          </div>

          {/* 快捷按钮 */}
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setSharesToSell((availableShares * pct / 100).toFixed(4))}
                disabled={availableShares <= 0}
                className="flex-1 py-1 text-xs bg-white/5 hover:bg-white/10 rounded border border-white/10 text-white/60 hover:text-white disabled:opacity-50"
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* 报价信息 */}
          {sellQuote?.quote && (
            <div className="p-3 bg-white/5 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">预计获得</span>
                <span className="text-white font-mono">{sellQuote.quote.amountOut.toFixed(4)} PTS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">平均价格</span>
                <span className="text-white font-mono">${sellQuote.quote.avgPrice.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">价格影响</span>
                <span className={sellQuote.quote.priceImpact > 1 ? 'text-yellow-400' : 'text-white/60'}>
                  {sellQuote.quote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">手续费</span>
                <span className="text-white/60">{sellQuote.quote.fee.toFixed(4)} PTS</span>
              </div>
            </div>
          )}

          {/* 卖出按钮 */}
          <button
            onClick={() => sellMutation.mutate()}
            disabled={!sharesToSell || parseFloat(sharesToSell) <= 0 || parseFloat(sharesToSell) > availableShares || sellMutation.isPending}
            className="w-full py-3 rounded-lg font-bold text-sm bg-red-500 hover:bg-red-600 text-white disabled:bg-red-500/30 disabled:cursor-not-allowed transition-all"
          >
            {sellMutation.isPending ? '处理中...' : `卖出 ${selectedSide === 'YES' ? '看涨' : '看跌'}`}
          </button>

          {sellMutation.isError && (
            <div className="text-xs text-red-400 text-center">
              {(sellMutation.error as Error).message}
            </div>
          )}
        </div>
      )}

      {/* 池子信息 */}
      <div className="pt-3 border-t border-white/5 space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-white/40">总交易量</span>
          <span className="text-white font-mono">
            {poolData?.pool?.totalVolume?.toLocaleString() || 0} PTS
          </span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-white/40">交易笔数</span>
          <span className="text-white font-mono">
            {poolData?.pool?.tradeCount || 0}
          </span>
        </div>
      </div>

    </div>
  );
}
