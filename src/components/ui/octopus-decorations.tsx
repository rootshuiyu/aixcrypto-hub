"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// 章鱼触手波浪背景
export const TentacleWaves = ({ className = "" }: { className?: string }) => (
  <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
    <svg className="absolute bottom-0 left-0 w-full h-48 opacity-10" viewBox="0 0 1200 200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="tentacleWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
          <stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0 100 Q 150 50, 300 100 T 600 100 T 900 100 T 1200 100 V 200 H 0 Z"
        fill="url(#tentacleWaveGradient)"
        animate={{
          d: [
            "M0 100 Q 150 50, 300 100 T 600 100 T 900 100 T 1200 100 V 200 H 0 Z",
            "M0 100 Q 150 150, 300 100 T 600 100 T 900 100 T 1200 100 V 200 H 0 Z",
            "M0 100 Q 150 50, 300 100 T 600 100 T 900 100 T 1200 100 V 200 H 0 Z",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M0 120 Q 200 80, 400 120 T 800 120 T 1200 120 V 200 H 0 Z"
        fill="url(#tentacleWaveGradient)"
        opacity={0.5}
        animate={{
          d: [
            "M0 120 Q 200 80, 400 120 T 800 120 T 1200 120 V 200 H 0 Z",
            "M0 120 Q 200 160, 400 120 T 800 120 T 1200 120 V 200 H 0 Z",
            "M0 120 Q 200 80, 400 120 T 800 120 T 1200 120 V 200 H 0 Z",
          ],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
    </svg>
  </div>
);

// 浮动章鱼装饰
export const FloatingOctopus = ({ 
  className = "",
  size = "md",
  color = "cyan"
}: { 
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "cyan" | "purple" | "pink";
}) => {
  const sizes = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const colors = {
    cyan: { primary: "#06b6d4", secondary: "#22d3ee" },
    purple: { primary: "#a855f7", secondary: "#c084fc" },
    pink: { primary: "#ec4899", secondary: "#f472b6" },
  };

  const c = colors[color];

  return (
    <motion.div
      className={cn(sizes[size], "relative", className)}
      animate={{
        y: [0, -15, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* 发光效果 */}
        <defs>
          <radialGradient id={`octoGlow-${color}`} cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor={c.primary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={c.primary} stopOpacity="0" />
          </radialGradient>
          <filter id={`octoBlur-${color}`}>
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* 光晕 */}
        <circle cx="50" cy="40" r="35" fill={`url(#octoGlow-${color})`} />

        {/* 头部 */}
        <motion.ellipse
          cx="50"
          cy="35"
          rx="25"
          ry="20"
          fill="none"
          stroke={c.primary}
          strokeWidth="2"
          opacity={0.8}
          animate={{ ry: [20, 22, 20] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* 眼睛 */}
        <motion.circle
          cx="42"
          cy="32"
          r="4"
          fill={c.secondary}
          animate={{ cy: [32, 34, 32] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.circle
          cx="58"
          cy="32"
          r="4"
          fill={c.secondary}
          animate={{ cy: [32, 34, 32] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />

        {/* 眼睛高光 */}
        <circle cx="40" cy="30" r="1.5" fill="white" opacity="0.8" />
        <circle cx="56" cy="30" r="1.5" fill="white" opacity="0.8" />

        {/* 触手 */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.path
            key={i}
            d={`M ${30 + i * 8} 52 Q ${28 + i * 8} 70, ${25 + i * 10} 90`}
            stroke={c.primary}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity={0.6 - i * 0.08}
            animate={{
              d: [
                `M ${30 + i * 8} 52 Q ${28 + i * 8} 70, ${25 + i * 10} 90`,
                `M ${30 + i * 8} 52 Q ${32 + i * 8} 70, ${28 + i * 10} 90`,
                `M ${30 + i * 8} 52 Q ${28 + i * 8} 70, ${25 + i * 10} 90`,
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </motion.div>
  );
};

// 章鱼墨水粒子背景
export const InkParticles = ({ 
  count = 20,
  className = "" 
}: { 
  count?: number;
  className?: string;
}) => {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 6 + 2,
            height: Math.random() * 6 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 2 === 0 
              ? "radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)",
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// 章鱼头像框
export const OctopusAvatarFrame = ({ 
  children,
  className = "",
  glowColor = "cyan",
  animate = true
}: { 
  children: React.ReactNode;
  className?: string;
  glowColor?: "cyan" | "purple" | "gold";
  animate?: boolean;
}) => {
  const colors = {
    cyan: { glow: "rgba(6, 182, 212, 0.5)", border: "#06b6d4" },
    purple: { glow: "rgba(168, 85, 247, 0.5)", border: "#a855f7" },
    gold: { glow: "rgba(234, 179, 8, 0.5)", border: "#eab308" },
  };

  const c = colors[glowColor];

  return (
    <motion.div
      className={cn("relative", className)}
      animate={animate ? { 
        boxShadow: [
          `0 0 20px ${c.glow}`,
          `0 0 40px ${c.glow}`,
          `0 0 20px ${c.glow}`,
        ]
      } : undefined}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* 外框触手装饰 */}
      <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)]" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`frameGradient-${glowColor}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c.border} stopOpacity="0.8" />
            <stop offset="100%" stopColor={c.border} stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke={`url(#frameGradient-${glowColor})`}
          strokeWidth="1"
          strokeDasharray="8 4"
        />
        {/* 小触手装饰 */}
        <motion.path
          d="M 10 50 Q 5 45, 2 50 Q 5 55, 10 50"
          fill={c.border}
          opacity={0.5}
          animate={{ d: [
            "M 10 50 Q 5 45, 2 50 Q 5 55, 10 50",
            "M 10 50 Q 5 48, 0 50 Q 5 52, 10 50",
            "M 10 50 Q 5 45, 2 50 Q 5 55, 10 50",
          ]}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.path
          d="M 90 50 Q 95 45, 98 50 Q 95 55, 90 50"
          fill={c.border}
          opacity={0.5}
          animate={{ d: [
            "M 90 50 Q 95 45, 98 50 Q 95 55, 90 50",
            "M 90 50 Q 95 48, 100 50 Q 95 52, 90 50",
            "M 90 50 Q 95 45, 98 50 Q 95 55, 90 50",
          ]}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
      </svg>
      <div className="relative rounded-full overflow-hidden border-2" style={{ borderColor: c.border }}>
        {children}
      </div>
    </motion.div>
  );
};

// 章鱼奖杯/排名装饰
export const OctopusRankBadge = ({ 
  rank,
  className = "" 
}: { 
  rank: 1 | 2 | 3;
  className?: string;
}) => {
  const configs = {
    1: { color: "#fbbf24", label: "🥇", tentacles: 8 },
    2: { color: "#94a3b8", label: "🥈", tentacles: 6 },
    3: { color: "#cd7f32", label: "🥉", tentacles: 4 },
  };

  const config = configs[rank];

  return (
    <motion.div 
      className={cn("relative", className)}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <svg viewBox="0 0 60 70" className="w-full h-full">
        {/* 奖牌背景 */}
        <defs>
          <radialGradient id={`rankGlow-${rank}`} cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor={config.color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={config.color} stopOpacity="0" />
          </radialGradient>
        </defs>
        
        <circle cx="30" cy="25" r="25" fill={`url(#rankGlow-${rank})`} />
        
        {/* 奖牌主体 */}
        <circle 
          cx="30" 
          cy="25" 
          r="18" 
          fill="none" 
          stroke={config.color} 
          strokeWidth="3"
        />
        
        {/* 皇冠/装饰 */}
        {rank === 1 && (
          <path 
            d="M20 15 L25 10 L30 13 L35 10 L40 15 L38 20 L22 20 Z" 
            fill={config.color}
            opacity={0.8}
          />
        )}
        
        {/* 排名数字 */}
        <text 
          x="30" 
          y="30" 
          textAnchor="middle" 
          fill={config.color}
          fontSize="14"
          fontWeight="bold"
        >
          {rank}
        </text>
        
        {/* 触手缎带 */}
        {Array.from({ length: config.tentacles }).map((_, i) => (
          <motion.path
            key={i}
            d={`M ${20 + i * (20 / config.tentacles)} 43 Q ${18 + i * (20 / config.tentacles)} 55, ${15 + i * (25 / config.tentacles)} 68`}
            stroke={config.color}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity={0.6}
            animate={{
              d: [
                `M ${20 + i * (20 / config.tentacles)} 43 Q ${18 + i * (20 / config.tentacles)} 55, ${15 + i * (25 / config.tentacles)} 68`,
                `M ${20 + i * (20 / config.tentacles)} 43 Q ${22 + i * (20 / config.tentacles)} 55, ${18 + i * (25 / config.tentacles)} 68`,
                `M ${20 + i * (20 / config.tentacles)} 43 Q ${18 + i * (20 / config.tentacles)} 55, ${15 + i * (25 / config.tentacles)} 68`,
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </svg>
    </motion.div>
  );
};

// 页面标题装饰
export const OctopusPageHeader = ({ 
  title,
  subtitle,
  className = ""
}: { 
  title: string;
  subtitle?: string;
  className?: string;
}) => (
  <div className={cn("relative", className)}>
    {/* 背景章鱼触手 */}
    <div className="absolute -left-4 top-0 h-full w-1 bg-gradient-to-b from-cyan-400 via-purple-500 to-transparent rounded-full opacity-50" />
    <div className="absolute -left-2 top-2 h-3/4 w-0.5 bg-gradient-to-b from-cyan-400/50 to-transparent rounded-full" />
    
    <motion.h1 
      className="text-3xl md:text-4xl font-black tracking-tight text-white"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {title}
    </motion.h1>
    {subtitle && (
      <motion.p 
        className="mt-2 text-white/40 text-sm"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {subtitle}
      </motion.p>
    )}
    
    {/* 装饰点 */}
    <motion.div 
      className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400"
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </div>
);
