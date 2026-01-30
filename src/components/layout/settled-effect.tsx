"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../providers/socket-provider";
import { motion, AnimatePresence } from "framer-motion";

export function SettledEffect() {
  const [mounted, setMounted] = useState(false);
  const { socket } = useSocket();
  const [lastSettlement, setLastSettlement] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (socket && mounted) {
      const handleSettlement = (data: any) => {
        setLastSettlement(data);
        // 3秒后自动清除
        setTimeout(() => setLastSettlement(null), 3000);
      };

      socket.on("betSettled", handleSettlement);
      return () => {
        socket.off("betSettled", handleSettlement);
      };
    }
  }, [socket, mounted]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {lastSettlement && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none">
          {/* 背景全屏闪烁 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 ${lastSettlement.result === 'WIN' ? 'bg-green-500' : 'bg-red-500'}`}
          />

          {/* 核心文字 */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: [0.5, 1.2, 1], opacity: 1, y: 0 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="relative z-10 flex flex-col items-center"
          >
            <h2 className={`text-6xl sm:text-9xl font-black italic tracking-tighter uppercase italic drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] ${
              lastSettlement.result === 'WIN' ? 'text-green-500' : 'text-red-500'
            }`}>
              {lastSettlement.result === 'WIN' ? 'WINNER' : 'LOSE'}
            </h2>
            <div className="mt-4 bg-black/80 backdrop-blur-md px-6 py-2 border border-white/10 rounded-full flex items-center gap-4">
              <span className="font-mono text-xl sm:text-3xl font-black text-white">
                {lastSettlement.result === 'WIN' ? `+${lastSettlement.payout} PTS` : `-${Math.abs(lastSettlement.payout)} PTS`}
              </span>
              {lastSettlement.result === 'WIN' && lastSettlement.combo > 0 && (
                <div className="h-6 w-px bg-white/20"></div>
              )}
              {lastSettlement.result === 'WIN' && lastSettlement.combo > 0 && (
                <span className="text-cyan-500 font-black text-sm sm:text-lg italic">
                  {lastSettlement.combo} COMBO!
                </span>
              )}
            </div>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.5em] text-white/40">
              Transaction Resolved // {lastSettlement.exitReason}
            </p>

            {/* AI 情感评语 (Dimension B) */}
            {lastSettlement.emotionalQuote && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 max-w-xs text-center"
              >
                <p className="text-xs sm:text-sm font-medium text-white/80 italic leading-relaxed">
                  "{lastSettlement.emotionalQuote}"
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <div className="h-[1px] w-4 bg-white/20"></div>
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Platform AI</span>
                  <div className="h-[1px] w-4 bg-white/20"></div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* 工业风线条动画 */}
          <div className="absolute inset-0 overflow-hidden">
            {[1,2,3,4].map(i => (
              <motion.div 
                key={i}
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 1, delay: i * 0.1 }}
                className="h-[1px] w-full bg-white/10 my-[20vh]"
              />
            ))}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
