"use client";

import React from "react";
import { useLanguageStore } from "../../stores/language-store";

interface IndustrialAgentCardProps {
  agent: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onConfirm: (pick: "YES" | "NO") => void;
  t: any;
  isLocked?: boolean;
  requirement?: string;
  userWins?: number;
  userPts?: number;
}

// 解锁条件配置
const UNLOCK_REQUIREMENTS: Record<string, { wins: number; pts: number }> = {
  EASY: { wins: 0, pts: 0 },
  MEDIUM: { wins: 10, pts: 0 },
  HARD: { wins: 30, pts: 5000 },
  MASTER: { wins: 100, pts: 20000 },
};

export const IndustrialAgentCard = ({
  agent,
  isSelected,
  onSelect,
  onConfirm,
  t,
  isLocked,
  requirement,
  userWins = 0,
  userPts = 0,
}: IndustrialAgentCardProps) => {
  const { currentLanguage } = useLanguageStore();

  // 计算解锁进度
  const unlockReq = UNLOCK_REQUIREMENTS[agent.level] || { wins: 0, pts: 0 };
  const winsProgress =
    unlockReq.wins > 0 ? Math.min(100, (userWins / unlockReq.wins) * 100) : 0;
  const ptsProgress =
    unlockReq.pts > 0 ? Math.min(100, (userPts / unlockReq.pts) * 100) : 0;

  const hasWinsReq = unlockReq.wins > 0;
  const hasPtsReq = unlockReq.pts > 0;
  const totalProgress =
    hasWinsReq && hasPtsReq
      ? Math.floor((winsProgress + ptsProgress) / 2)
      : hasWinsReq
      ? Math.floor(winsProgress)
      : hasPtsReq
      ? Math.floor(ptsProgress)
      : 100;

  return (
    <div
      onClick={() => !isLocked && onSelect(agent.id)}
      className={`relative group cursor-pointer overflow-hidden rounded-xl border transition-all duration-500 ${
        isLocked
          ? "border-white/5 bg-black/40 grayscale opacity-60 cursor-not-allowed"
          : isSelected
          ? "border-red-500/50 bg-red-500/5 shadow-[0_0_30px_rgba(239,68,68,0.2)] scale-[1.02]"
          : "border-white/5 bg-[#0a0a0a] hover:border-white/20"
      }`}
      style={{ perspective: "1000px" }}
    >
      {/* 锁定状态提示 */}
      {isLocked && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-[2px] p-4">
          <div className="mb-3 text-red-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* 解锁进度 */}
          <div className="w-full max-w-[160px] space-y-3">
            {unlockReq.wins > 0 && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40">
                    {t.playground.wins}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-red-500">
                    {userWins}/{unlockReq.wins}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
                    style={{ width: `${winsProgress}%` }}
                  />
                </div>
              </div>
            )}

            {unlockReq.pts > 0 && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40">
                    PTS
                  </span>
                  <span className="text-[9px] font-mono font-bold text-yellow-500">
                    {userPts.toLocaleString()}/{unlockReq.pts.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${ptsProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 text-center">
            <span className="text-[10px] font-black text-white/60">
              {totalProgress}%
              <span className="text-white/30 ml-1">{t.playground.complete}</span>
            </span>
          </div>
        </div>
      )}

      {/* 背景工业底纹 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(#fff 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      <div className="relative z-10 p-6 flex flex-col items-center">
        {/* 核心展示区 */}
        <div
          className="relative h-40 w-full mb-6 flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          <svg viewBox="0 0 200 200" className="w-32 h-32 overflow-visible">
            <defs>
              <filter id="red-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="redStream" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#ff0000" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>

            <path
              d="M 100 20 C 140 20 180 60 180 100 C 180 140 140 180 100 180 C 60 180 20 140 20 100 C 20 60 60 20 100 20 Z"
              fill="none"
              stroke="#333"
              strokeWidth="10"
              className="opacity-50"
            />

            <g className="animate-spin-slow" style={{ transformOrigin: "center" }}>
              <rect x="85" y="40" width="30" height="10" fill="#444" rx="2" />
              <rect x="85" y="150" width="30" height="10" fill="#444" rx="2" />
              <rect x="40" y="85" width="10" height="30" fill="#444" rx="2" />
              <rect x="150" y="85" width="10" height="30" fill="#444" rx="2" />
            </g>

            <path
              d="M 100 20 C 140 20 180 60 180 100 C 180 140 140 180 100 180 C 60 180 20 140 20 100 C 20 60 60 20 100 20 Z"
              fill="none"
              stroke="url(#redStream)"
              strokeWidth="2"
              strokeDasharray="40 160"
              filter="url(#red-glow)"
              className="animate-flow-line"
            />

            <circle cx="100" cy="100" r="15" fill="#111" stroke="#ff0000" strokeWidth="1" className="animate-pulse" />
          </svg>

          <div className="absolute top-0 right-0 font-mono text-[8px] text-white/20 uppercase vertical-text">
            CORE_MODEL_{agent.level}_X
          </div>
        </div>

        {/* 代理信息 */}
        <div className="text-center w-full">
          <h3 className="text-xl font-black tracking-tighter text-white uppercase italic">{agent.name}</h3>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="h-[2px] w-4 bg-red-600"></span>
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em]">
              {t.playground.levels[agent.level.toLowerCase()] || agent.level}
            </span>
            <span className="h-[2px] w-4 bg-red-600"></span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-y border-white/5 py-3">
            <div>
              <p className="text-[9px] text-red-500/60 uppercase font-black tracking-widest">{t.playground?.aiWinRate || "AI_GLOBAL_WINRATE"}</p>
              <p className="text-sm font-mono font-bold text-red-500">{agent.winRate}%</p>
            </div>
            <div>
              <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest">{t.playground.status}</p>
              <div className="flex items-center justify-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-green-500 animate-ping"></div>
                <p className="text-sm font-mono font-bold text-green-500">{t.playground.ready}</p>
              </div>
            </div>
          </div>

          {/* 交互按钮 */}
          <div className="mt-6 h-10 overflow-hidden relative">
            <button
              className={`w-full h-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                isSelected
                  ? "bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {isSelected ? (t.playground?.selected || "SELECTED") : t.playground.battle}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .vertical-text {
          writing-mode: vertical-rl;
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 12s infinite linear;
        }
        @keyframes flow-line {
          from {
            stroke-dashoffset: 200;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-flow-line {
          animation: flow-line 3s infinite linear;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};








