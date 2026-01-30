"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "../../stores/ui-store";
import { motion, AnimatePresence } from "framer-motion";

export function Notification() {
  const [mounted, setMounted] = useState(false);
  const { notification, hideNotification } = useUIStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (notification && mounted) {
      const timer = setTimeout(() => {
        hideNotification();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, hideNotification, mounted]);

  if (!mounted) return null;

  const config = notification ? {
    SUCCESS: { bg: "bg-green-600", border: "border-green-500", icon: "✓", shadow: "shadow-[0_0_20px_rgba(34,197,94,0.3)]" },
    ERROR: { bg: "bg-red-600", border: "border-red-500", icon: "✕", shadow: "shadow-[0_0_20px_rgba(239,68,68,0.3)]" },
    WARNING: { bg: "bg-yellow-600", border: "border-yellow-500", icon: "!", shadow: "shadow-[0_0_20px_rgba(234,179,8,0.3)]" },
    INFO: { bg: "bg-cyan-600", border: "border-cyan-500", icon: "i", shadow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]" },
  }[notification.type] : null;

  return (
    <AnimatePresence>
      {notification && config && (
        <div className="fixed top-24 right-4 z-[200] pointer-events-none sm:right-8">
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className={`pointer-events-auto flex items-center gap-4 min-w-[280px] max-w-md ${config.bg} ${config.border} ${config.shadow} border-2 px-6 py-4 overflow-hidden relative group`}
          >
            {/* 工业风流光 */}
            <motion.div 
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />

            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center border border-white/30 bg-black/20 font-black italic">
              {config.icon}
            </div>

            <div className="relative z-10 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-0.5">
                SYSTEM_NOTIFICATION // {notification.type}
              </p>
              <p className="text-sm font-bold text-white tracking-tight">
                {notification.message}
              </p>
            </div>

            <button 
              onClick={hideNotification}
              className="relative z-10 text-white/40 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 底部进度条 */}
            <motion.div 
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 origin-left"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
