"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../providers/socket-provider";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalAlert() {
  const [mounted, setMounted] = useState(false);
  const { socket } = useSocket();
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (socket && mounted) {
      const handleUpdate = (data: any) => {
        // 假设后端推送 divergence 告警
        if (data.divergenceWarning) {
          setAlert({
            type: "DIVERGENCE",
            message: `DATA_DIVERGENCE_DETECTOR: Oracle price variance > 2% for ${data.symbol}. System paused.`
          });
        } else {
          // 清除告警 (如果正常)
          if (alert?.type === "DIVERGENCE") setAlert(null);
        }
      };

      socket.on("marketAlert", handleUpdate);

      // 🆕 监听管理员发送的全局系统广播
      const handleSystemBroadcast = (data: any) => {
        console.log('📢 Received Global Broadcast:', data);
        setAlert({
          type: data.type || "SYSTEM",
          message: data.message
        });
      };
      socket.on("systemBroadcast", handleSystemBroadcast);

      return () => {
        socket.off("marketAlert", handleUpdate);
        socket.off("systemBroadcast", handleSystemBroadcast);
      };
    }
  }, [socket, alert, mounted]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-red-600/90 text-white py-1.5 px-4 backdrop-blur-md border-b border-red-500 flex items-center justify-between overflow-hidden"
        >
          {/* 流光动画 */}
          <motion.div 
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-2 w-2 rounded-full bg-white animate-ping" />
            <span className="font-mono text-[10px] sm:text-xs font-black tracking-widest uppercase italic">
              {alert.message}
            </span>
          </div>
          
          <button 
            onClick={() => setAlert(null)}
            className="text-white/60 hover:text-white relative z-10 text-xs font-black uppercase"
          >
            [CLOSE_OVERRIDE]
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
