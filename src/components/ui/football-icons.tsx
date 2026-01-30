"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: number;
}

// 足球图标
export const FootballIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="footballGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" stroke="url(#footballGradient)" strokeWidth="2" fill="none" />
    <path 
      d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22M12 2C12 2 8 6 8 12C8 18 12 22 12 22M2 12H22M4 7H20M4 17H20" 
      stroke="url(#footballGradient)" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

// 英超图标
export const PremierLeagueIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#3d195b" stroke="#e90052" strokeWidth="1" />
    <path d="M12 6L14 10H10L12 6Z" fill="#00ff85" />
    <path d="M8 14H16L12 18L8 14Z" fill="#e90052" />
  </svg>
);

// 西甲图标
export const LaLigaIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#ff4b44" stroke="#fd8204" strokeWidth="1" />
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">LL</text>
  </svg>
);

// 德甲图标
export const BundesligaIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#d20515" stroke="#ffffff" strokeWidth="1" />
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">BL</text>
  </svg>
);

// 意甲图标
export const SerieAIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#024494" stroke="#009b3a" strokeWidth="1" />
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">SA</text>
  </svg>
);

// 法甲图标
export const Ligue1Icon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#091c3e" stroke="#dae025" strokeWidth="1" />
    <text x="12" y="16" textAnchor="middle" fill="#dae025" fontSize="8" fontWeight="bold">L1</text>
  </svg>
);

// 欧冠图标
export const ChampionsLeagueIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="uclGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="100%" stopColor="#312e81" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#uclGradient)" />
    {/* 星星 */}
    <path d="M12 4L13.5 9H18L14 12L15.5 17L12 14L8.5 17L10 12L6 9H10.5L12 4Z" fill="white" opacity="0.9" />
  </svg>
);

// 中超图标
export const CSLIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#c41e3a" stroke="#ffd700" strokeWidth="1" />
    <text x="12" y="16" textAnchor="middle" fill="#ffd700" fontSize="7" fontWeight="bold">中超</text>
  </svg>
);

// 直播指示器
export const LiveIndicator: React.FC<{ className?: string; animate?: boolean }> = ({ className = '', animate = true }) => (
  <div className={cn("flex items-center gap-1.5", className)}>
    <span className={cn("w-2 h-2 rounded-full bg-red-500", animate && "animate-pulse")} />
    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Live</span>
  </div>
);

// 比分显示
export const ScoreDisplay: React.FC<{ home: number; away: number; elapsed?: number | null; className?: string }> = ({ 
  home, away, elapsed, className = '' 
}) => (
  <div className={cn("flex flex-col items-center", className)}>
    <div className="flex items-center gap-3 text-3xl font-black text-white">
      <span>{home}</span>
      <span className="text-white/30">-</span>
      <span>{away}</span>
    </div>
    {elapsed && (
      <span className="text-xs text-green-400 font-mono mt-1">{elapsed}'</span>
    )}
  </div>
);

// 球队 Logo 组件
export const TeamLogo: React.FC<{
  src?: string;
  name: string;
  size?: number;
  className?: string;
}> = ({ src, name, size = 48, className = '' }) => {
  const [imgError, setImgError] = React.useState(false);
  
  // 根据队名生成颜色
  const getTeamColor = (teamName: string): string => {
    const colors = [
      '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', 
      '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
    ];
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const displayLetter = name.slice(0, 3).toUpperCase();
  const teamColor = getTeamColor(name);

  return (
    <div 
      className={cn(
        "rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/10",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src && !imgError ? (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-contain p-1"
          onError={() => setImgError(true)}
        />
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: teamColor, fontSize: size * 0.25 }}
        >
          {displayLetter}
        </div>
      )}
    </div>
  );
};

// 联赛徽章
export const LeagueBadge: React.FC<{
  name: string;
  logo?: string;
  country?: string;
  className?: string;
}> = ({ name, logo, country, className = '' }) => (
  <div className={cn("flex items-center gap-2", className)}>
    {logo && (
      <img src={logo} alt={name} className="w-5 h-5 object-contain" />
    )}
    <div>
      <span className="text-xs font-medium text-white/80">{name}</span>
      {country && <span className="text-[10px] text-white/40 ml-1">({country})</span>}
    </div>
  </div>
);

// 导出所有图标
export const FootballIcons = {
  Football: FootballIcon,
  PremierLeague: PremierLeagueIcon,
  LaLiga: LaLigaIcon,
  Bundesliga: BundesligaIcon,
  SerieA: SerieAIcon,
  Ligue1: Ligue1Icon,
  ChampionsLeague: ChampionsLeagueIcon,
  CSL: CSLIcon,
};

export default FootballIcons;
