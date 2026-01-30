"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface WinAnimationProps {
  isVisible: boolean;
  onClose: () => void;
  payout?: number;
  result?: "WIN" | "LOSE" | "BREAKEVEN";
}

export function WinAnimation({ isVisible, onClose, payout = 0, result = "WIN" }: WinAnimationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onClose();
      }, 6000); // 延长到 6秒 自动关闭
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (result !== "WIN") return null;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
          {/* 背景遮罩 - 点击可提前关闭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShow(false);
              onClose();
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          {/* 动画内容容器 */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.5, opacity: 0, y: -100 }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
            className="relative flex flex-col items-center"
          >
            {/* 核心章鱼动画 (使用 image.gif) */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 drop-shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center justify-center">
              <img
                src="/image.gif"
                alt="Winning Octopus"
                className="w-full h-full object-contain mix-blend-screen scale-125"
                onError={(e) => {
                  // 如果 GIF 加载失败，回退到 PNG 静态 Logo
                  (e.target as HTMLImageElement).src = '/octopus-logo.png';
                  (e.target as HTMLImageElement).className = "w-full h-full object-contain opacity-80";
                }}
              />
              
              {/* 装饰性发光环 */}
              <motion.div 
                className="absolute inset-0 rounded-full border-4 border-cyan-500/30"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>

            {/* 胜利文本 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center"
            >
              <h2 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 italic tracking-tighter drop-shadow-lg filter brightness-125">
                WINNER!
              </h2>
              <div className="mt-2 flex flex-col items-center">
                <span className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em] mb-1">Octopus Fortune</span>
                <span className="text-4xl sm:text-5xl font-mono font-black text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                  +{payout.toLocaleString()} <span className="text-sm font-sans text-white/60">PTS</span>
                </span>
              </div>
            </motion.div>

            {/* 庆祝气泡效果 */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-cyan-400/30 bg-cyan-400/10"
                  style={{
                    width: Math.random() * 20 + 5 + 'px',
                    height: Math.random() * 20 + 5 + 'px',
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 600, 
                    y: (Math.random() - 0.5) * 600, 
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0]
                  }}
                  transition={{ 
                    duration: Math.random() * 2 + 1, 
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
