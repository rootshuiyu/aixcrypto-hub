"use client";

import { motion } from "framer-motion";

interface OctopusLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export const OctopusLoader = ({ 
  size = "md", 
  text = "Loading...",
  className = "" 
}: OctopusLoaderProps) => {
  const sizes = {
    sm: { container: "w-16 h-16", head: 12, eye: 2, tentacle: 1 },
    md: { container: "w-24 h-24", head: 18, eye: 3, tentacle: 1.5 },
    lg: { container: "w-32 h-32", head: 24, eye: 4, tentacle: 2 },
  };

  const s = sizes[size];

  // 触手动画变体
  const tentacleVariants = {
    animate: (i: number) => ({
      d: [
        `M ${12 + i * 3} ${s.head + 2} Q ${10 + i * 3} ${s.head + 10}, ${8 + i * 4} ${s.head + 16}`,
        `M ${12 + i * 3} ${s.head + 2} Q ${14 + i * 3} ${s.head + 10}, ${10 + i * 4} ${s.head + 16}`,
        `M ${12 + i * 3} ${s.head + 2} Q ${10 + i * 3} ${s.head + 10}, ${8 + i * 4} ${s.head + 16}`,
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        delay: i * 0.1,
        ease: "easeInOut",
      },
    }),
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className={`relative ${s.container}`}>
        <svg viewBox="0 0 48 48" className="w-full h-full">
          {/* 发光效果 */}
          <defs>
            <radialGradient id="octoGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* 光晕背景 */}
          <motion.circle
            cx="24"
            cy="20"
            r="20"
            fill="url(#octoGlow)"
            animate={{ 
              r: [20, 22, 20],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* 章鱼头部 */}
          <motion.ellipse
            cx="24"
            cy="16"
            rx="14"
            ry="12"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            filter="url(#glow)"
            animate={{ 
              ry: [12, 13, 12],
              cy: [16, 15, 16]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* 眼睛 */}
          <motion.circle
            cx="19"
            cy="14"
            r="3"
            fill="#06b6d4"
            animate={{ 
              cy: [14, 15, 14],
              r: [3, 2.5, 3]
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.circle
            cx="29"
            cy="14"
            r="3"
            fill="#06b6d4"
            animate={{ 
              cy: [14, 15, 14],
              r: [3, 2.5, 3]
            }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />

          {/* 眼睛高光 */}
          <circle cx="18" cy="13" r="1" fill="white" opacity="0.8" />
          <circle cx="28" cy="13" r="1" fill="white" opacity="0.8" />

          {/* 触手 */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.path
              key={i}
              stroke="#a855f7"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity={0.7 - i * 0.1}
              initial={{ 
                d: `M ${10 + i * 7} 26 Q ${8 + i * 7} 34, ${6 + i * 8} 42`
              }}
              animate={{
                d: [
                  `M ${10 + i * 7} 26 Q ${8 + i * 7} 34, ${6 + i * 8} 42`,
                  `M ${10 + i * 7} 26 Q ${12 + i * 7} 34, ${8 + i * 8} 42`,
                  `M ${10 + i * 7} 26 Q ${8 + i * 7} 34, ${6 + i * 8} 42`,
                ],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>
      </div>

      {text && (
        <motion.p
          className="text-sm text-white/40 uppercase tracking-widest"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// 迷你章鱼 Spinner
export const OctopusSpinner = ({ className = "w-6 h-6" }: { className?: string }) => (
  <motion.svg
    className={className}
    viewBox="0 0 24 24"
    animate={{ rotate: 360 }}
    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
  >
    <defs>
      <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    </defs>
    <ellipse
      cx="12"
      cy="10"
      rx="8"
      ry="6"
      fill="none"
      stroke="url(#spinnerGradient)"
      strokeWidth="2"
      strokeDasharray="30 10"
    />
    <circle cx="9" cy="9" r="1.5" fill="#06b6d4" />
    <circle cx="15" cy="9" r="1.5" fill="#06b6d4" />
  </motion.svg>
);

// 章鱼触手分隔线
export const TentacleDivider = ({ className = "" }: { className?: string }) => (
  <div className={`relative w-full h-8 overflow-hidden ${className}`}>
    <svg className="w-full h-full" viewBox="0 0 400 32" preserveAspectRatio="none">
      <motion.path
        d="M0 16 Q 50 4, 100 16 T 200 16 T 300 16 T 400 16"
        stroke="url(#tentacleGradient)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      <motion.path
        d="M0 20 Q 50 28, 100 20 T 200 20 T 300 20 T 400 20"
        stroke="url(#tentacleGradient)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }}
      />
      <defs>
        <linearGradient id="tentacleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
          <stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);
