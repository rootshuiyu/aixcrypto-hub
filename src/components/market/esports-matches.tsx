"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EsportsLivePlayer, MiniLivePlayer } from './esports-live-player';
import { 
  GameBadge, 
  TeamLogo, 
  VSBadge, 
  AnimatedLiveIndicator,
  LOLIcon,
  DOTA2Icon,
  CS2Icon,
  AllGamesIcon,
  UpcomingIcon,
  FinishedIcon,
} from '@/components/ui/esports-icons';

// 实时倒计时组件
function Countdown({ targetDate, className }: { targetDate: string; className?: string }) {
  const [timeDisplay, setTimeDisplay] = useState<{ 
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;
      
      const isExpired = diff <= 0;
      const absDiff = Math.abs(diff);

      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

      setTimeDisplay({ days, hours, minutes, seconds, isExpired });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const { days, hours, minutes, seconds, isExpired } = timeDisplay;

  // 格式化显示
  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {isExpired && (
        <span className="text-orange-400 text-[10px] mr-1">超时</span>
      )}
      {days > 0 ? (
        <span className="font-mono tabular-nums">
          {days}天 {hours}时 {formatNumber(minutes)}分
        </span>
      ) : (
        <div className="flex items-center gap-0.5 font-mono tabular-nums">
          {hours > 0 && (
            <>
              <span className="bg-white/10 px-1.5 py-0.5 rounded">{formatNumber(hours)}</span>
              <span className="text-white/40">:</span>
            </>
          )}
          <span className="bg-white/10 px-1.5 py-0.5 rounded">{formatNumber(minutes)}</span>
          <span className="text-white/40">:</span>
          <span className={cn(
            "px-1.5 py-0.5 rounded",
            isExpired ? "bg-orange-500/20 text-orange-400" : "bg-white/10"
          )}>
            {formatNumber(seconds)}
          </span>
        </div>
      )}
    </div>
  );
}

// 类型定义
interface EsportsTeam {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  region?: string;
}

interface EsportsMatch {
  id: string;
  game: 'LOL' | 'DOTA2' | 'CS2';
  league: string;
  leagueLogo?: string;
  tournament?: string;
  homeTeam: EsportsTeam;
  awayTeam: EsportsTeam;
  bestOf: number;
  scheduledAt: string;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED' | 'CANCELLED' | 'POSTPONED';
  homeScore: number;
  awayScore: number;
  homeOdds?: number;
  awayOdds?: number;
  homeBetPool: number;
  awayBetPool: number;
  streamUrl?: string;
}

// 游戏图标组件配置
const gameIconComponents = {
  LOL: LOLIcon,
  DOTA2: DOTA2Icon,
  CS2: CS2Icon,
  ALL: AllGamesIcon,
};

// 游戏颜色配置
const gameColorConfig: Record<string, { gradient: string; border: string; text: string }> = {
  LOL: { 
    gradient: 'from-blue-500/20 to-cyan-500/20', 
    border: 'border-blue-500/30', 
    text: 'text-blue-400' 
  },
  DOTA2: { 
    gradient: 'from-orange-500/20 to-amber-500/20', 
    border: 'border-orange-500/30', 
    text: 'text-orange-400' 
  },
  CS2: { 
    gradient: 'from-yellow-500/20 to-amber-500/20', 
    border: 'border-yellow-500/30', 
    text: 'text-yellow-400' 
  },
};

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 0) {
    const absMins = Math.abs(diffMins);
    if (absMins < 60) return `${absMins}分钟前`;
    if (absMins < 1440) return `${Math.floor(absMins / 60)}小时前`;
    return `${Math.floor(absMins / 1440)}天前`;
  }
  
  if (diffMins < 60) return `${diffMins}分钟后开始`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时后开始`;
  return `${Math.floor(diffMins / 1440)}天后开始`;
}

interface MatchCardProps {
  match: EsportsMatch;
  onBet: (matchId: string, prediction: 'HOME' | 'AWAY') => void;
  isBetting: boolean;
  isSelected?: boolean; // 🆕 是否选中
  onSelect?: () => void; // 🆕 选择回调
}

function MatchCard({ match, onBet, isBetting, isSelected, onSelect }: MatchCardProps) {
  const [selectedSide, setSelectedSide] = useState<'HOME' | 'AWAY' | null>(null);
  const colorConfig = gameColorConfig[match.game] || gameColorConfig.LOL;
  
  const isLive = match.status === 'LIVE';
  const isUpcoming = match.status === 'UPCOMING';
  // 🔧 直播开始后锁盘：只能在未开始(UPCOMING)下注
  const canBet = isUpcoming;
  
  const totalPool = match.homeBetPool + match.awayBetPool;
  const homePercent = totalPool > 0 ? (match.homeBetPool / totalPool * 100).toFixed(0) : '50';
  const awayPercent = totalPool > 0 ? (match.awayBetPool / totalPool * 100).toFixed(0) : '50';

  return (
    <div 
      onClick={() => onSelect && onSelect()} // 🆕 点击卡片选择比赛
      className={cn(
        "p-4 rounded-xl border transition-all backdrop-blur-sm cursor-pointer",
        isSelected 
          ? "border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/5 ring-2 ring-purple-500/20" // 🆕 选中状态样式
          : "border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:from-white/10 hover:to-white/5"
      )}
    >
      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GameBadge game={match.game} />
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs text-white/50 font-medium">{match.league}</span>
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <>
              <MiniLivePlayer streamUrl={match.streamUrl} game={match.game} matchStatus="LIVE" />
              <AnimatedLiveIndicator />
            </>
          ) : isUpcoming ? (
            <>
              <MiniLivePlayer streamUrl={match.streamUrl} game={match.game} matchStatus="UPCOMING" />
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <UpcomingIcon size={12} className="text-yellow-400 flex-shrink-0" />
                <Countdown 
                  targetDate={match.scheduledAt} 
                  className="text-[10px] font-bold text-yellow-400"
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-white/40">
              <FinishedIcon size={14} />
              <span className="text-[10px]">{formatTime(match.scheduledAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 队伍对战信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          {/* 主队 */}
          <div 
            className={cn(
              "text-center cursor-pointer transition-all group",
              selectedSide === 'HOME' && "scale-105",
              canBet && "hover:scale-105"
            )}
            onClick={() => canBet && setSelectedSide(selectedSide === 'HOME' ? null : 'HOME')}
          >
            <TeamLogo
              src={match.homeTeam.logo}
              name={match.homeTeam.name}
              shortName={match.homeTeam.shortName}
              size={52}
              selected={selectedSide === 'HOME'}
              selectionColor="green"
              className="mb-2"
            />
            <span className={cn(
              "text-sm font-bold transition-colors",
              selectedSide === 'HOME' ? "text-green-400" : "text-white/90 group-hover:text-white"
            )}>
              {match.homeTeam.shortName || match.homeTeam.name}
            </span>
            {isLive && (
              <div className="text-xl font-black text-white mt-1">{match.homeScore}</div>
            )}
          </div>

          {/* VS */}
          <VSBadge bestOf={match.bestOf} />

          {/* 客队 */}
          <div 
            className={cn(
              "text-center cursor-pointer transition-all group",
              selectedSide === 'AWAY' && "scale-105",
              canBet && "hover:scale-105"
            )}
            onClick={() => canBet && setSelectedSide(selectedSide === 'AWAY' ? null : 'AWAY')}
          >
            <TeamLogo
              src={match.awayTeam.logo}
              name={match.awayTeam.name}
              shortName={match.awayTeam.shortName}
              size={52}
              selected={selectedSide === 'AWAY'}
              selectionColor="red"
              className="mb-2"
            />
            <span className={cn(
              "text-sm font-bold transition-colors",
              selectedSide === 'AWAY' ? "text-red-400" : "text-white/90 group-hover:text-white"
            )}>
              {match.awayTeam.shortName || match.awayTeam.name}
            </span>
            {isLive && (
              <div className="text-xl font-black text-white mt-1">{match.awayScore}</div>
            )}
          </div>
        </div>

        {/* 赔率和下注 */}
        <div className="text-right">
          <div className="text-[10px] text-white/40 mb-2 uppercase tracking-wider font-medium">AMM 实时赔率</div>
          <div className="flex gap-2">
            <button
              onClick={() => canBet && setSelectedSide('HOME')}
              disabled={!canBet}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-all",
                selectedSide === 'HOME'
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25"
                  : "bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20",
                !canBet && "opacity-50 cursor-not-allowed"
              )}
            >
              {match.homeOdds?.toFixed(2) || '1.85'}
            </button>
            <button
              onClick={() => canBet && setSelectedSide('AWAY')}
              disabled={!canBet}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-all",
                selectedSide === 'AWAY'
                  ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25"
                  : "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20",
                !canBet && "opacity-50 cursor-not-allowed"
              )}
            >
              {match.awayOdds?.toFixed(2) || '2.10'}
            </button>
          </div>
          
          {/* 下注池进度条 */}
          <div className="mt-3 w-32">
            <div className="flex justify-between text-[10px] text-white/50 mb-1 font-medium">
              <span>{homePercent}%</span>
              <span>{awayPercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300" 
                style={{ width: `${homePercent}%` }} 
              />
              <div 
                className="h-full bg-gradient-to-r from-rose-400 to-red-500 transition-all duration-300" 
                style={{ width: `${awayPercent}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 下注确认区域 */}
      {selectedSide && canBet && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-lg",
                selectedSide === 'HOME' 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
              )}>
                {selectedSide === 'HOME' ? '←' : '→'}
              </div>
              <div className="text-sm">
                <span className="text-white/60">预测 </span>
                <span className={cn(
                  "font-bold",
                  selectedSide === 'HOME' ? "text-green-400" : "text-red-400"
                )}>
                  {selectedSide === 'HOME' ? match.homeTeam.shortName || match.homeTeam.name : match.awayTeam.shortName || match.awayTeam.name}
                </span>
                <span className="text-white/40 ml-2">
                  胜 @ <span className="font-mono text-white/60">{selectedSide === 'HOME' ? match.homeOdds?.toFixed(2) : match.awayOdds?.toFixed(2)}</span>
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSide(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onBet(match.id, selectedSide);
                  setSelectedSide(null);
                }}
                disabled={isBetting}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/25"
              >
                {isBetting ? '下注中...' : '确认下注'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface EsportsMatchesProps {
  className?: string;
  selectedMatchId?: string | null; // 🆕 外部选中的比赛ID
  onMatchSelect?: (matchId: string) => void; // 🆕 比赛选择回调
}

export function EsportsMatches({ className, selectedMatchId: externalSelectedMatchId, onMatchSelect }: EsportsMatchesProps) {
  const [activeGame, setActiveGame] = useState<'ALL' | 'LOL' | 'DOTA2' | 'CS2'>('ALL');
  const [internalSelectedMatchId, setInternalSelectedMatchId] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // 🆕 使用外部传入的 selectedMatchId，如果没有则使用内部状态
  const selectedMatchId = externalSelectedMatchId !== undefined ? externalSelectedMatchId : internalSelectedMatchId;
  
  // 🆕 刷新比赛数据的函数
  const refreshMatches = () => {
    queryClient.invalidateQueries({ queryKey: ['esportsMatches', activeGame] });
    queryClient.invalidateQueries({ queryKey: ['hotEsportsMatches'] });
  };
  
  // 🆕 处理比赛选择
  const handleMatchSelect = (matchId: string) => {
    console.log('🎯 EsportsMatches 处理比赛选择:', matchId);
    if (onMatchSelect) {
      console.log('📞 调用外部 onMatchSelect');
      onMatchSelect(matchId);
    } else {
      console.log('📝 使用内部状态');
      setInternalSelectedMatchId(matchId);
    }
    // 滚动到主内容区域
    setTimeout(() => {
      const mainContent = document.querySelector('[data-esports-main]');
      console.log('📍 查找主内容区域:', mainContent);
      if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log('✅ 已滚动到主内容区域');
      } else {
        console.error('❌ 未找到主内容区域元素 [data-esports-main]');
      }
    }, 100);
  };

  // 获取比赛列表 - 🔧 优化刷新策略
  const { data: matchesData, isLoading, error } = useQuery({
    queryKey: ['esportsMatches', activeGame],
    queryFn: () => api.getEsportsMatches({
      game: activeGame === 'ALL' ? undefined : activeGame,
      limit: 20,
    }),
    refetchInterval: 15000, // 🔧 优化：改为 15 秒，更快检测状态变化
    staleTime: 5000, // 🔧 优化：减少到 5 秒
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // 获取热门比赛 - 🔧 优化刷新策略
  const { data: hotMatchesData } = useQuery({
    queryKey: ['hotEsportsMatches'],
    queryFn: () => api.getHotEsportsMatches(10),
    refetchInterval: 15000, // 🔧 优化：改为 15 秒
    staleTime: 5000, // 🔧 优化：减少到 5 秒
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // 下注 mutation
  const betMutation = useMutation({
    mutationFn: (data: { matchId: string; prediction: 'HOME' | 'AWAY' }) =>
      api.placeEsportsBet({
        userId: user?.id || '',
        matchId: data.matchId,
        prediction: data.prediction,
        amount: 100, // TODO: 添加金额选择
      }),
    onSuccess: () => {
      toast.success('下注成功！');
      queryClient.invalidateQueries({ queryKey: ['esportsMatches'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '下注失败');
    },
  });

  // 直接使用后端返回的比赛数据（后端已正确处理状态）
  const matches: EsportsMatch[] = matchesData?.data || [];
  const hotMatches: EsportsMatch[] = hotMatchesData?.data || [];
  
  // 🆕 合并主列表和热门列表，确保选中的比赛能够显示
  const allMatches = useMemo(() => {
    const matchMap = new Map<string, EsportsMatch>();
    matches.forEach(m => matchMap.set(m.id, m));
    hotMatches.forEach(m => {
      const existing = matchMap.get(m.id);
      if (!existing) {
        matchMap.set(m.id, m);
        return;
      }
      // 🔧 优先使用更“活”的数据：LIVE 状态或有直播源的记录覆盖
      const shouldOverride =
        (m.status === 'LIVE' && existing.status !== 'LIVE') ||
        (!!m.streamUrl && !existing.streamUrl);
      matchMap.set(m.id, shouldOverride ? m : existing);
    });
    return Array.from(matchMap.values());
  }, [matches, hotMatches]);
  
  // 🆕 调试：打印选中的比赛ID（移到 matches 定义之后）
  useEffect(() => {
    console.log('🎯 选中的比赛ID变化:', { 
      external: externalSelectedMatchId, 
      internal: internalSelectedMatchId,
      final: selectedMatchId,
      matchesCount: allMatches.length 
    });
  }, [externalSelectedMatchId, internalSelectedMatchId, selectedMatchId, allMatches.length]);

  type GameFilter = 'ALL' | 'LOL' | 'DOTA2' | 'CS2';
  const gameFilters: { id: GameFilter; label: string; Icon: React.FC<{ size?: number }> }[] = [
    { id: 'ALL', label: '全部', Icon: AllGamesIcon },
    { id: 'LOL', label: 'LOL', Icon: LOLIcon },
    { id: 'DOTA2', label: 'DOTA2', Icon: DOTA2Icon },
    { id: 'CS2', label: 'CS2', Icon: CS2Icon },
  ];

  const handleBet = (matchId: string, prediction: 'HOME' | 'AWAY') => {
    if (!user?.id) {
      toast.error('请先登录');
      return;
    }
    betMutation.mutate({ matchId, prediction });
  };

  return (
    <div 
      data-esports-main // 🆕 添加标识，用于滚动定位
      className={cn("rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a0a0a] to-[#0d0d0d] p-6 space-y-6 backdrop-blur-xl", className)}
    >
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="relative">
          {/* 装饰线 */}
          <div className="absolute -left-4 top-0 h-full w-1 bg-gradient-to-b from-cyan-400 via-purple-500 to-transparent rounded-full opacity-60" />
          <div className="absolute -left-2 top-2 h-3/4 w-0.5 bg-gradient-to-b from-cyan-400/50 to-transparent rounded-full" />
          
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
              <AllGamesIcon size={22} />
            </div>
            <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              电竞预测
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 uppercase tracking-wider">
              AMM
            </span>
          </h2>
          <p className="text-sm text-white/40 mt-2 ml-13">AMM 自动做市商实时交易，随时买卖</p>
        </div>
        <AnimatedLiveIndicator />
      </div>

      {/* 游戏筛选器 */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
        {gameFilters.map((filter) => {
          const isActive = activeGame === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveGame(filter.id)}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                isActive
                  ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <filter.Icon size={16} />
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* 实时直播播放器 - 显示第一个 LIVE 或 UPCOMING 比赛 */}
      {(() => {
        // 🆕 优先显示选中的比赛，否则显示第一个 LIVE 或 UPCOMING 比赛
        // 🆕 使用合并后的 allMatches 列表，确保包含热门列表的比赛
        let featuredMatch = selectedMatchId 
          ? allMatches.find(m => m.id === selectedMatchId)
          : null;
        
        console.log('🎬 选择比赛:', { 
          selectedMatchId, 
          foundMatch: featuredMatch ? {
            id: featuredMatch.id,
            teams: `${featuredMatch.homeTeam.name} vs ${featuredMatch.awayTeam.name}`,
            status: featuredMatch.status
          } : null, 
          totalMatches: allMatches.length,
          mainMatches: matches.length,
          hotMatches: hotMatches.length,
          matchIds: allMatches.map(m => m.id)
        });
        
        // 如果选中的比赛不存在或不在当前列表中，回退到默认逻辑
        if (!featuredMatch) {
          featuredMatch = allMatches.find(m => m.status === 'LIVE') || allMatches.find(m => m.status === 'UPCOMING');
          console.log('📺 使用默认比赛:', featuredMatch ? {
            id: featuredMatch.id,
            teams: `${featuredMatch.homeTeam.name} vs ${featuredMatch.awayTeam.name}`,
            status: featuredMatch.status
          } : null);
        }
        
        const game = activeGame === 'ALL' ? (featuredMatch?.game || 'LOL') : activeGame;
        
        return (
          <EsportsLivePlayer
            onStatusChange={refreshMatches} // 🆕 倒计时过期时自动刷新数据
            game={game as 'LOL' | 'DOTA2' | 'CS2'}
            streamUrl={featuredMatch?.streamUrl}
            matchStatus={featuredMatch?.status as 'UPCOMING' | 'LIVE' | 'FINISHED'}
            scheduledAt={featuredMatch?.scheduledAt}
            homeTeam={featuredMatch?.homeTeam.shortName || featuredMatch?.homeTeam.name}
            awayTeam={featuredMatch?.awayTeam.shortName || featuredMatch?.awayTeam.name}
          />
        );
      })()}

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-purple-500/20 rounded-full" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-purple-500 rounded-full animate-spin" />
              <div className="absolute inset-2 w-8 h-8 border-2 border-transparent border-t-cyan-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            </div>
            <span className="text-xs text-white/50 font-medium">加载比赛数据...</span>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
          <div className="text-sm text-white/60 font-medium">加载失败</div>
          <div className="text-xs text-white/40 mt-1">请稍后重试</div>
        </div>
      )}

      {/* 比赛列表 */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {allMatches.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <AllGamesIcon size={32} />
              </div>
              <div className="text-sm text-white/60 font-medium">暂无比赛</div>
              <div className="text-xs text-white/40 mt-1">稍后再来查看</div>
            </div>
          ) : (
            allMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onBet={handleBet}
                isBetting={betMutation.isPending}
                isSelected={match.id === selectedMatchId} // 🆕 标记选中的比赛
                onSelect={() => handleMatchSelect(match.id)} // 🆕 点击卡片时选择比赛
              />
            ))
          )}
        </div>
      )}

      {/* 热门赛事提示 */}
      {hotMatches.length > 0 && (
        <div className="pt-5 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">热门赛事</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {hotMatches.slice(0, 3).map((match) => (
              <div key={match.id} className="p-3 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 text-center hover:border-white/10 transition-all cursor-pointer">
                <div className="text-xs font-bold text-white">
                  {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                </div>
                <div className="text-[10px] text-white/40 mt-1">{match.league}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 更多游戏 */}
      <div className="rounded-xl border border-white/5 bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-5 text-center">
        <div className="flex justify-center gap-3 mb-3">
          <LOLIcon size={24} className="opacity-60" />
          <DOTA2Icon size={24} className="opacity-60" />
          <CS2Icon size={24} className="opacity-60" />
        </div>
        <div className="text-sm text-white/60 font-medium">更多电竞赛事即将上线</div>
        <div className="text-xs text-white/40 mt-1">支持 LOL、DOTA2、CS2、王者荣耀 等热门游戏</div>
      </div>
    </div>
  );
}
