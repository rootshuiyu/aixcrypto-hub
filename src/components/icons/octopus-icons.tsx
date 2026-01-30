"use client";

import React from "react";
import { motion } from "framer-motion";

// 章鱼主题图标组件库
// 所有图标都融入了章鱼/触手元素

interface IconProps {
  className?: string;
  animate?: boolean;
}

// 基础章鱼头部（用于 Logo 小图标）
export const OctopusHead = ({ className = "w-5 h-5", animate = false }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <motion.ellipse 
      cx="12" cy="10" rx="8" ry="7"
      animate={animate ? { scale: [1, 1.02, 1] } : undefined}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <circle cx="9" cy="9" r="1.5" fill="currentColor" />
    <circle cx="15" cy="9" r="1.5" fill="currentColor" />
    {/* 触手 */}
    <path d="M6 14c-1 2-2 5-1 6" strokeLinecap="round" opacity="0.6" />
    <path d="M9 15c0 2-1 4 0 6" strokeLinecap="round" opacity="0.6" />
    <path d="M12 16c0 2 0 4 0 5" strokeLinecap="round" opacity="0.6" />
    <path d="M15 15c0 2 1 4 0 6" strokeLinecap="round" opacity="0.6" />
    <path d="M18 14c1 2 2 5 1 6" strokeLinecap="round" opacity="0.6" />
  </svg>
);

// 首页图标 - 章鱼窝
export const OctoHome = ({ className = "w-5 h-5", animate = false }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 10l9-7 9 7" strokeLinecap="round" />
    <path d="M5 8v12a1 1 0 001 1h12a1 1 0 001-1V8" />
    {/* 章鱼触手从门口伸出 */}
    <motion.path 
      d="M10 21c0-2 0-4 1-5s2-2 1-4" 
      strokeLinecap="round"
      opacity="0.5"
      animate={animate ? { d: ["M10 21c0-2 0-4 1-5s2-2 1-4", "M10 21c0-2 1-4 0-5s1-2 2-4", "M10 21c0-2 0-4 1-5s2-2 1-4"] } : undefined}
      transition={{ duration: 3, repeat: Infinity }}
    />
    <motion.path 
      d="M14 21c0-2 0-4-1-5s-2-2-1-4" 
      strokeLinecap="round"
      opacity="0.5"
      animate={animate ? { d: ["M14 21c0-2 0-4-1-5s-2-2-1-4", "M14 21c0-2-1-4 0-5s-1-2-2-4", "M14 21c0-2 0-4-1-5s-2-2-1-4"] } : undefined}
      transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
    />
    {/* 窗户眼睛 */}
    <circle cx="9" cy="13" r="1" fill="currentColor" opacity="0.4" />
    <circle cx="15" cy="13" r="1" fill="currentColor" opacity="0.4" />
  </svg>
);

// 市场图标 - 触手握住图表
export const OctoMarket = ({ className = "w-5 h-5", animate = false }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 3v18h18" strokeLinecap="round" />
    {/* 价格线 */}
    <motion.path 
      d="M6 15l4-4 4 2 6-7" 
      strokeLinecap="round"
      animate={animate ? { d: ["M6 15l4-4 4 2 6-7", "M6 13l4-2 4 4 6-9", "M6 15l4-4 4 2 6-7"] } : undefined}
      transition={{ duration: 2, repeat: Infinity }}
    />
    {/* 触手 */}
    <path d="M20 6c1 0 2 1 2 2s-1 1-1 2" strokeLinecap="round" opacity="0.5" />
    <path d="M7 20c0 1-1 2-2 2" strokeLinecap="round" opacity="0.5" />
    {/* 数据点 */}
    <circle cx="6" cy="15" r="1" fill="currentColor" />
    <circle cx="10" cy="11" r="1" fill="currentColor" />
    <circle cx="14" cy="13" r="1" fill="currentColor" />
    <circle cx="20" cy="6" r="1.5" fill="currentColor" />
  </svg>
);

// 个人中心 - 章鱼脸
export const OctoProfile = ({ className = "w-5 h-5", animate = false }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <ellipse cx="12" cy="10" rx="7" ry="6" />
    {/* 眼睛 */}
    <motion.circle 
      cx="9" cy="9" r="1.5" 
      fill="currentColor"
      animate={animate ? { cy: [9, 10, 9] } : undefined}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <motion.circle 
      cx="15" cy="9" r="1.5" 
      fill="currentColor"
      animate={animate ? { cy: [9, 10, 9] } : undefined}
      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
    />
    {/* 触手作为装饰 */}
    <path d="M5 14c-1 2-2 4-1 6" strokeLinecap="round" opacity="0.4" />
    <path d="M8 15c0 2-1 4 0 6" strokeLinecap="round" opacity="0.4" />
    <path d="M12 16v5" strokeLinecap="round" opacity="0.4" />
    <path d="M16 15c0 2 1 4 0 6" strokeLinecap="round" opacity="0.4" />
    <path d="M19 14c1 2 2 4 1 6" strokeLinecap="round" opacity="0.4" />
  </svg>
);

// 任务系统 - 触手勾选
export const OctoTasks = ({ className = "w-5 h-5", animate = false }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="3" width="16" height="18" rx="2" />
    {/* 任务列表 */}
    <path d="M8 8h8" strokeLinecap="round" opacity="0.4" />
    <path d="M8 12h8" strokeLinecap="round" opacity="0.4" />
    <path d="M8 16h4" strokeLinecap="round" opacity="0.4" />
    {/* 触手勾选 */}
    <motion.path 
      d="M16 14c2 0 3 1 4 2s0 3-1 4" 
      strokeLinecap="round"
      stroke="currentColor"
      animate={animate ? { pathLength: [0, 1, 1] } : undefined}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <motion.path 
      d="M18 18l-4-4 2-2" 
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={animate ? { opacity: [0, 1, 1, 0] } : undefined}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </svg>
);

// 团队 - 多只章鱼
export const OctoTeam = ({ className = "w-5 h-5", animate = false }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    {/* 中心章鱼 */}
    <ellipse cx="12" cy="10" rx="4" ry="3" />
    <circle cx="11" cy="9.5" r="0.8" fill="currentColor" />
    <circle cx="13" cy="9.5" r="0.8" fill="currentColor" />
    <path d="M10 12c0 1.5-.5 3 0 4" strokeLinecap="round" opacity="0.4" />
    <path d="M14 12c0 1.5.5 3 0 4" strokeLinecap="round" opacity="0.4" />
    
    {/* 左侧小章鱼 */}
    <motion.g 
      opacity="0.6"
      animate={animate ? { x: [-1, 0, -1] } : undefined}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <ellipse cx="5" cy="8" rx="3" ry="2.5" />
      <circle cx="4.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="5.5" cy="7.5" r="0.5" fill="currentColor" />
      <path d="M4 10c-.5 1-.5 2 0 3" strokeLinecap="round" opacity="0.5" />
    </motion.g>
    
    {/* 右侧小章鱼 */}
    <motion.g 
      opacity="0.6"
      animate={animate ? { x: [1, 0, 1] } : undefined}
      transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
    >
      <ellipse cx="19" cy="8" rx="3" ry="2.5" />
      <circle cx="18.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="19.5" cy="7.5" r="0.5" fill="currentColor" />
      <path d="M20 10c.5 1 .5 2 0 3" strokeLinecap="round" opacity="0.5" />
    </motion.g>
    
    {/* 连接触手 */}
    <path d="M8 9c-1 0-2-.5-3-.5" strokeLinecap="round" opacity="0.3" />
    <path d="M16 9c1 0 2-.5 3-.5" strokeLinecap="round" opacity="0.3" />
  </svg>
);

// 排行榜 - 章鱼戴皇冠
export const OctoLeaderboard = ({ className = "w-5 h-5", animate = false }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    {/* 皇冠 */}
    <motion.path 
      d="M7 8l2-4 3 2 3-2 2 4" 
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={animate ? { y: [0, -1, 0] } : undefined}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <motion.path 
      d="M7 8h10v2H7z" 
      fill="currentColor" 
      opacity="0.3"
      animate={animate ? { y: [0, -1, 0] } : undefined}
      transition={{ duration: 2, repeat: Infinity }}
    />
    
    {/* 章鱼头 */}
    <ellipse cx="12" cy="13" rx="5" ry="4" />
    <circle cx="10" cy="12.5" r="1" fill="currentColor" />
    <circle cx="14" cy="12.5" r="1" fill="currentColor" />
    
    {/* 触手 */}
    <path d="M8 16c-1 1.5-2 3-1 4" strokeLinecap="round" opacity="0.5" />
    <path d="M11 17c0 1.5 0 3 0 4" strokeLinecap="round" opacity="0.5" />
    <path d="M13 17c0 1.5 0 3 0 4" strokeLinecap="round" opacity="0.5" />
    <path d="M16 16c1 1.5 2 3 1 4" strokeLinecap="round" opacity="0.5" />
  </svg>
);

// AI 操场 - 章鱼大脑/电路
export const OctoPlayground = ({ className = "w-5 h-5", animate = false }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    {/* 章鱼头部作为大脑 */}
    <ellipse cx="12" cy="10" rx="7" ry="6" />
    
    {/* 电路纹路 */}
    <motion.path 
      d="M8 8h2v2h2V8h2" 
      strokeLinecap="round"
      opacity="0.4"
      animate={animate ? { opacity: [0.4, 0.8, 0.4] } : undefined}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <motion.path 
      d="M9 11h6" 
      strokeLinecap="round"
      opacity="0.4"
      animate={animate ? { opacity: [0.4, 0.8, 0.4] } : undefined}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
    />
    
    {/* 发光眼睛 */}
    <motion.circle 
      cx="9" cy="9" r="1.5" 
      fill="currentColor"
      animate={animate ? { opacity: [1, 0.5, 1] } : undefined}
      transition={{ duration: 1, repeat: Infinity }}
    />
    <motion.circle 
      cx="15" cy="9" r="1.5" 
      fill="currentColor"
      animate={animate ? { opacity: [1, 0.5, 1] } : undefined}
      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
    />
    
    {/* 触手像电线 */}
    <motion.path 
      d="M5 14c-2 2-3 4-2 6" 
      strokeLinecap="round"
      animate={animate ? { d: ["M5 14c-2 2-3 4-2 6", "M5 14c-1 2-2 4-1 6", "M5 14c-2 2-3 4-2 6"] } : undefined}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <path d="M8 15c-1 2-1 4 0 5" strokeLinecap="round" opacity="0.5" />
    <path d="M12 16v4" strokeLinecap="round" opacity="0.5" />
    <path d="M16 15c1 2 1 4 0 5" strokeLinecap="round" opacity="0.5" />
    <motion.path 
      d="M19 14c2 2 3 4 2 6" 
      strokeLinecap="round"
      animate={animate ? { d: ["M19 14c2 2 3 4 2 6", "M19 14c1 2 2 4 1 6", "M19 14c2 2 3 4 2 6"] } : undefined}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
    />
  </svg>
);

// 文档 - 章鱼读书
export const OctoDocs = ({ className = "w-5 h-5", animate = false }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    {/* 书本 */}
    <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14" strokeLinecap="round" />
    <path d="M4 19h16" strokeLinecap="round" />
    <path d="M8 7h8M8 11h8M8 15h4" strokeLinecap="round" opacity="0.4" />
    
    {/* 小章鱼触手翻书 */}
    <motion.path 
      d="M18 8c2 0 3-1 3 0s-1 2-2 3" 
      strokeLinecap="round"
      opacity="0.6"
      animate={animate ? { d: ["M18 8c2 0 3-1 3 0s-1 2-2 3", "M18 8c2 0 4-1 4 1s-2 2-3 3", "M18 8c2 0 3-1 3 0s-1 2-2 3"] } : undefined}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </svg>
);

// 钱包 - 章鱼抱宝箱
export const OctoWallet = ({ className = "w-5 h-5", animate = false }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    {/* 钱包主体 */}
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
    <circle cx="17" cy="14" r="1.5" fill="currentColor" opacity="0.5" />
    
    {/* 触手环绕 */}
    <motion.path 
      d="M1 8c0 3 1 6 2 8" 
      strokeLinecap="round"
      opacity="0.4"
      animate={animate ? { d: ["M1 8c0 3 1 6 2 8", "M1 9c0 3 1 5 2 7", "M1 8c0 3 1 6 2 8"] } : undefined}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <motion.path 
      d="M23 8c0 3-1 6-2 8" 
      strokeLinecap="round"
      opacity="0.4"
      animate={animate ? { d: ["M23 8c0 3-1 6-2 8", "M23 9c0 3-1 5-2 7", "M23 8c0 3-1 6-2 8"] } : undefined}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
    />
  </svg>
);

// 赛季 - 章鱼举奖杯
export const OctoSeason = ({ className = "w-5 h-5", animate = false }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    {/* 奖杯 */}
    <path d="M8 2h8v6a4 4 0 01-8 0V2z" />
    <path d="M8 4H5a1 1 0 00-1 1v1a3 3 0 003 3" strokeLinecap="round" />
    <path d="M16 4h3a1 1 0 011 1v1a3 3 0 01-3 3" strokeLinecap="round" />
    <path d="M12 12v3" />
    <path d="M8 18h8" />
    <path d="M7 21h10" />
    <path d="M9 18v3M15 18v3" />
    
    {/* 触手装饰 */}
    <motion.path 
      d="M3 6c-1 2-1 4 0 6" 
      strokeLinecap="round"
      opacity="0.4"
      animate={animate ? { d: ["M3 6c-1 2-1 4 0 6", "M3 7c-1 1-1 3 0 5", "M3 6c-1 2-1 4 0 6"] } : undefined}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <motion.path 
      d="M21 6c1 2 1 4 0 6" 
      strokeLinecap="round"
      opacity="0.4"
      animate={animate ? { d: ["M21 6c1 2 1 4 0 6", "M21 7c1 1 1 3 0 5", "M21 6c1 2 1 4 0 6"] } : undefined}
      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
    />
  </svg>
);

// 锦标赛 - 章鱼擂台
export const OctoTournament = ({ className = "w-5 h-5", animate = false }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    {/* 擂台 */}
    <path d="M2 18h20" strokeLinecap="round" />
    <path d="M4 18v-6h16v6" />
    
    {/* 两只对战章鱼 */}
    <motion.g
      animate={animate ? { x: [0, 1, 0] } : undefined}
      transition={{ duration: 1, repeat: Infinity }}
    >
      <ellipse cx="7" cy="10" rx="3" ry="2.5" />
      <circle cx="6" cy="9.5" r="0.5" fill="currentColor" />
      <circle cx="8" cy="9.5" r="0.5" fill="currentColor" />
    </motion.g>
    
    <motion.g
      animate={animate ? { x: [0, -1, 0] } : undefined}
      transition={{ duration: 1, repeat: Infinity }}
    >
      <ellipse cx="17" cy="10" rx="3" ry="2.5" />
      <circle cx="16" cy="9.5" r="0.5" fill="currentColor" />
      <circle cx="18" cy="9.5" r="0.5" fill="currentColor" />
    </motion.g>
    
    {/* VS 闪电 */}
    <motion.path 
      d="M12 6l-1 3h2l-1 3" 
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={animate ? { opacity: [1, 0.3, 1] } : undefined}
      transition={{ duration: 0.5, repeat: Infinity }}
    />
  </svg>
);

// 通知 - 章鱼铃铛
export const OctoNotification = ({ className = "w-5 h-5", animate = false }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    {/* 铃铛主体 */}
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
    
    {/* 章鱼触手敲铃铛 */}
    <motion.path 
      d="M20 5c2 0 3 1 3 2s-1 2-2 3" 
      strokeLinecap="round"
      opacity="0.5"
      animate={animate ? { 
        d: ["M20 5c2 0 3 1 3 2s-1 2-2 3", "M20 4c2 1 3 2 3 3s-1 2-2 2", "M20 5c2 0 3 1 3 2s-1 2-2 3"]
      } : undefined}
      transition={{ duration: 0.8, repeat: Infinity }}
    />
  </svg>
);

// 导出所有图标
export const OctopusIcons = {
  Head: OctopusHead,
  Home: OctoHome,
  Market: OctoMarket,
  Profile: OctoProfile,
  Tasks: OctoTasks,
  Team: OctoTeam,
  Leaderboard: OctoLeaderboard,
  Playground: OctoPlayground,
  Docs: OctoDocs,
  Wallet: OctoWallet,
  Season: OctoSeason,
  Tournament: OctoTournament,
  Notification: OctoNotification,
};
