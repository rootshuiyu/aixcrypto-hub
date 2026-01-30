"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: number;
}

// ============================================
// 游戏类型图标
// ============================================

// 英雄联盟 LOL 图标 - 剑盾设计
export const LOLIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="lolGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    {/* 剑 */}
    <path 
      d="M12 2L14 7L12 22L10 7L12 2Z" 
      fill="url(#lolGradient)"
      stroke="url(#lolGradient)"
      strokeWidth="0.5"
    />
    {/* 剑柄 */}
    <path 
      d="M8 8H16L14.5 10H9.5L8 8Z" 
      fill="url(#lolGradient)"
      opacity="0.8"
    />
    {/* 装饰 */}
    <circle cx="12" cy="9" r="1.5" fill="white" opacity="0.6" />
  </svg>
);

// DOTA2 图标 - 盾牌设计
export const DOTA2Icon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="dotaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
    </defs>
    {/* 盾牌主体 */}
    <path 
      d="M12 2L20 6V11C20 16.5 16.5 20.5 12 22C7.5 20.5 4 16.5 4 11V6L12 2Z" 
      fill="url(#dotaGradient)"
      stroke="url(#dotaGradient)"
      strokeWidth="0.5"
    />
    {/* 内部装饰 */}
    <path 
      d="M12 5L17 7.5V11C17 14.5 14.5 17.5 12 19C9.5 17.5 7 14.5 7 11V7.5L12 5Z" 
      fill="none"
      stroke="white"
      strokeWidth="1"
      opacity="0.4"
    />
    {/* 中心点 */}
    <circle cx="12" cy="11" r="2" fill="white" opacity="0.6" />
  </svg>
);

// CS2 图标 - 准星设计
export const CS2Icon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="csGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>
    {/* 外圈 */}
    <circle 
      cx="12" cy="12" r="9" 
      fill="none" 
      stroke="url(#csGradient)" 
      strokeWidth="2"
    />
    {/* 准星十字 */}
    <path d="M12 3V8M12 16V21" stroke="url(#csGradient)" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 12H8M16 12H21" stroke="url(#csGradient)" strokeWidth="2" strokeLinecap="round" />
    {/* 中心点 */}
    <circle cx="12" cy="12" r="2" fill="url(#csGradient)" />
  </svg>
);

// 全部游戏图标
export const AllGamesIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="allGamesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    {/* 游戏手柄 */}
    <path 
      d="M6 9H18C19.7 9 21 10.3 21 12V14C21 15.7 19.7 17 18 17H6C4.3 17 3 15.7 3 14V12C3 10.3 4.3 9 6 9Z" 
      fill="url(#allGamesGradient)"
      stroke="url(#allGamesGradient)"
      strokeWidth="0.5"
    />
    {/* 左摇杆 */}
    <circle cx="7.5" cy="13" r="1.5" fill="white" opacity="0.6" />
    {/* 按钮 */}
    <circle cx="16" cy="12" r="1" fill="white" opacity="0.6" />
    <circle cx="18" cy="13" r="1" fill="white" opacity="0.6" />
    {/* 顶部装饰 */}
    <path d="M8 9V7C8 6 9 5 12 5C15 5 16 6 16 7V9" stroke="url(#allGamesGradient)" strokeWidth="1.5" fill="none" opacity="0.5" />
  </svg>
);

// ============================================
// 状态指示器图标
// ============================================

// 直播中图标
export const LiveIcon: React.FC<IconProps & { animate?: boolean }> = ({ className = '', size = 16, animate = true }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="3" fill="#ef4444">
      {animate && (
        <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
      )}
    </circle>
    <circle cx="8" cy="8" r="6" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.3">
      {animate && (
        <animate attributeName="r" values="4;7;4" dur="1.5s" repeatCount="indefinite" />
      )}
    </circle>
  </svg>
);

// 即将开始图标
export const UpcomingIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" fill="none" stroke="#eab308" strokeWidth="1.5" />
    <path d="M8 4V8L10.5 10.5" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 已结束图标
export const FinishedIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" fill="none" stroke="#6b7280" strokeWidth="1.5" />
    <path d="M5 8L7 10L11 6" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ============================================
// 队伍占位符图标
// ============================================

// 通用队伍图标
export const TeamIcon: React.FC<IconProps & { letter?: string; color?: string }> = ({ 
  className = '', 
  size = 32, 
  letter = 'T',
  color = '#a855f7'
}) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none">
    <defs>
      <linearGradient id={`teamGradient-${letter}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="0.8" />
        <stop offset="100%" stopColor={color} stopOpacity="0.4" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="28" height="28" rx="6" fill={`url(#teamGradient-${letter})`} />
    <text 
      x="16" 
      y="21" 
      textAnchor="middle" 
      fill="white" 
      fontSize="14" 
      fontWeight="bold"
      fontFamily="system-ui, sans-serif"
    >
      {letter.toUpperCase().slice(0, 2)}
    </text>
  </svg>
);

// ============================================
// 平台图标
// ============================================

// Twitch 图标
export const TwitchIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
);

// YouTube 图标
export const YouTubeIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

// Bilibili 图标
export const BilibiliIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.124.929.373.267.249.391.551.391.907 0 .355-.124.657-.391.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
  </svg>
);

// ============================================
// 动画组件
// ============================================

// 带动画的直播指示器
export const AnimatedLiveIndicator: React.FC<{ className?: string }> = ({ className = '' }) => (
  <motion.div
    className={cn("flex items-center gap-1.5", className)}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <motion.div
      className="w-2 h-2 rounded-full bg-red-500"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Live</span>
  </motion.div>
);

// 带光效的游戏标签
export const GameBadge: React.FC<{
  game: 'LOL' | 'DOTA2' | 'CS2' | 'ALL';
  className?: string;
  showLabel?: boolean;
}> = ({ game, className = '', showLabel = true }) => {
  const config = {
    LOL: { 
      Icon: LOLIcon, 
      label: 'LOL', 
      fullLabel: '英雄联盟',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400'
    },
    DOTA2: { 
      Icon: DOTA2Icon, 
      label: 'DOTA2', 
      fullLabel: 'DOTA2',
      gradient: 'from-orange-500/20 to-amber-500/20',
      border: 'border-orange-500/30',
      text: 'text-orange-400'
    },
    CS2: { 
      Icon: CS2Icon, 
      label: 'CS2', 
      fullLabel: 'CS2',
      gradient: 'from-yellow-500/20 to-amber-500/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400'
    },
    ALL: { 
      Icon: AllGamesIcon, 
      label: '全部', 
      fullLabel: '全部游戏',
      gradient: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400'
    },
  };

  const { Icon, label, gradient, border, text } = config[game];

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md",
      `bg-gradient-to-r ${gradient}`,
      `border ${border}`,
      className
    )}>
      <Icon size={14} />
      {showLabel && <span className={cn("text-xs font-bold", text)}>{label}</span>}
    </div>
  );
};

// 队伍Logo组件（带fallback）
export const TeamLogo: React.FC<{
  src?: string;
  name: string;
  shortName?: string;
  size?: number;
  className?: string;
  selected?: boolean;
  selectionColor?: 'green' | 'red';
}> = ({ src, name, shortName, size = 48, className = '', selected = false, selectionColor = 'green' }) => {
  const [imgError, setImgError] = React.useState(false);
  
  // 根据队名生成颜色
  const getTeamColor = (teamName: string): string => {
    const colors = [
      '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', 
      '#ef4444', '#a855f7', '#ec4899', '#6366f1'
    ];
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const displayLetter = (shortName || name).slice(0, 2).toUpperCase();
  const teamColor = getTeamColor(name);
  
  const selectionStyles = selected ? {
    green: 'ring-2 ring-green-500 bg-gradient-to-br from-green-500/30 to-cyan-500/30',
    red: 'ring-2 ring-red-500 bg-gradient-to-br from-red-500/30 to-pink-500/30',
  }[selectionColor] : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20';

  return (
    <div 
      className={cn(
        "rounded-lg flex items-center justify-center overflow-hidden transition-all",
        selectionStyles,
        className
      )}
      style={{ width: size, height: size }}
    >
      {src && !imgError ? (
        <img 
          src={src} 
          alt={name} 
          className="w-3/4 h-3/4 object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <TeamIcon letter={displayLetter} color={teamColor} size={size * 0.7} />
      )}
    </div>
  );
};

// VS 分隔符组件
export const VSBadge: React.FC<{ bestOf?: number; className?: string }> = ({ bestOf, className = '' }) => (
  <div className={cn("text-center", className)}>
    <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
      VS
    </div>
    {bestOf && (
      <div className="text-[10px] text-white/40 font-medium">BO{bestOf}</div>
    )}
  </div>
);

// 导出统一图标集合
export const EsportsIcons = {
  // 游戏图标
  LOL: LOLIcon,
  DOTA2: DOTA2Icon,
  CS2: CS2Icon,
  AllGames: AllGamesIcon,
  // 状态图标
  Live: LiveIcon,
  Upcoming: UpcomingIcon,
  Finished: FinishedIcon,
  // 平台图标
  Twitch: TwitchIcon,
  YouTube: YouTubeIcon,
  Bilibili: BilibiliIcon,
  // 其他
  Team: TeamIcon,
};

export default EsportsIcons;
