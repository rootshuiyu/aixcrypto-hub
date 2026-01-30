"use client";

import { useEffect, useState } from "react";

export function AnimatedWaves() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <svg
        className="absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="amberGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(217, 119, 6, 0)" />
            <stop offset="50%" stopColor="rgba(251, 191, 36, 0.3)" />
            <stop offset="100%" stopColor="rgba(217, 119, 6, 0)" />
          </linearGradient>
          <linearGradient id="amberGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(245, 158, 11, 0)" />
            <stop offset="50%" stopColor="rgba(251, 191, 36, 0.15)" />
            <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
          </linearGradient>
          <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="30" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Top Waves */}
        <path d="M-500 200 Q200 0 960 200 T2420 200" fill="none" stroke="url(#amberGradient2)" strokeWidth="100" filter="url(#amberGlow)" className="animate-wave-slow opacity-50" />
        
        {/* Middle Waves */}
        <path d="M-500 600 Q200 400 960 600 T2420 600" fill="none" stroke="url(#amberGradient1)" strokeWidth="180" filter="url(#amberGlow)" className="animate-wave-fast" />
        <path d="M-500 700 Q400 500 960 700 T2420 700" fill="none" stroke="url(#amberGradient2)" strokeWidth="250" filter="url(#amberGlow)" className="animate-wave-medium" />
        <path d="M-500 500 Q300 700 960 500 T2420 500" fill="none" stroke="url(#amberGradient1)" strokeWidth="150" filter="url(#amberGlow)" className="animate-wave-slow" />

        {/* Bottom Waves */}
        <path d="M-500 900 Q400 1100 960 900 T2420 900" fill="none" stroke="url(#amberGradient2)" strokeWidth="120" filter="url(#amberGlow)" className="animate-wave-fast opacity-40" />
      </svg>

      {/* Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] bg-amber-600/5 blur-[100px] rounded-full animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] bg-amber-600/10 blur-[120px] rounded-full animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-amber-900/5 blur-[150px] pointer-events-none" />
      
      <style jsx>{`
        @keyframes wave-fast { 0% { transform: translateX(-20%) skewY(-2deg); } 50% { transform: translateX(0%) skewY(2deg); } 100% { transform: translateX(-20%) skewY(-2deg); } }
        @keyframes wave-medium { 0% { transform: translateX(0%) skewY(1deg); } 50% { transform: translateX(-15%) skewY(-1deg); } 100% { transform: translateX(0%) skewY(1deg); } }
        @keyframes wave-slow { 0% { transform: translateX(-10%) scaleY(1); } 50% { transform: translateX(5%) scaleY(1.2); } 100% { transform: translateX(-10%) scaleY(1); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.3; transform: translate(-50%, 0) scale(1); } 50% { opacity: 0.5; transform: translate(-50%, 10%) scale(1.1); } }
        .animate-wave-fast { animation: wave-fast 12s ease-in-out infinite; }
        .animate-wave-medium { animation: wave-medium 20s ease-in-out infinite; }
        .animate-wave-slow { animation: wave-slow 30s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 10s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
