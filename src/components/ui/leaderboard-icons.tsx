/**
 * 排行榜共享图标组件
 * 用于 leaderboard 和 personal-ranking 页面
 */

import React from 'react';

interface IconProps {
  className?: string;
}

// 皇冠图标 - 第一名
export const CrownIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg className={`w-8 h-8 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M12 21h-7a1 1 0 0 1-1-1v-1l3-2h10l3 2v1a1 1 0 0 1-1 1h-7z" opacity="0.3" />
    <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.5" />
  </svg>
);

// 银牌图标 - 第二名
export const SilverIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg className={`w-8 h-8 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" opacity="0.3" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2" opacity="0.5" />
  </svg>
);

// 铜牌图标 - 第三名
export const BronzeIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg className={`w-8 h-8 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7l1.5 3h3.5l-2.5 2 1 3.5-3.5-2-3.5 2 1-3.5-2.5-2h3.5L12 7z" opacity="0.5" />
  </svg>
);

// 用户图标
export const UserIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" opacity="0.5" />
  </svg>
);

// 奖杯图标
export const TrophyIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
    <path d="M7 8H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3M17 8h3a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3" opacity="0.5" />
  </svg>
);

// 火焰图标 - 连胜
export const FireIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

// 趋势上升图标
export const TrendingUpIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 6l-9.5 9.5-5-5L1 18" />
    <path d="M17 6h6v6" />
  </svg>
);

// 加载中动画图标
export const SpinnerIcon: React.FC<IconProps> = ({ className = '' }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// 统一导出的图标对象（便于批量使用）
export const LeaderboardIcons = {
  Crown: CrownIcon,
  Silver: SilverIcon,
  Bronze: BronzeIcon,
  User: UserIcon,
  Trophy: TrophyIcon,
  Fire: FireIcon,
  TrendingUp: TrendingUpIcon,
  Spinner: SpinnerIcon,
};

export default LeaderboardIcons;
