"use client";

import React from 'react';
import { Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComboDisplayProps {
  combo: number;
  maxCombo: number;
  multiplier: number;
}

export function ComboDisplay({ combo, maxCombo, multiplier }: ComboDisplayProps) {
  const MAX_COMBOS = 5;
  const nextMultiplier = combo < MAX_COMBOS ? 1 + (combo + 1) * 0.1 : multiplier;
  const nextPayout = combo < MAX_COMBOS ? `+${((combo + 1) * 10)}` : 'MAX';

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Combo Number */}
          <span className="text-5xl font-black text-white">{combo}</span>
          <div>
            <h3 className="text-lg font-bold text-white">Combo</h3>
            <p className="text-xs text-muted-foreground">Win Streak</p>
            <p className="text-[10px] text-primary">Max {MAX_COMBOS} Combos</p>
          </div>
        </div>

        {/* Current Multiplier */}
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase">Curr. Multiplier</p>
          <p className="text-2xl font-black text-white">{multiplier.toFixed(1)}x</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase mb-1">Next Payout</p>
          <p className="text-lg font-bold text-green-500">{nextPayout}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase mb-1">Combo Timer</p>
          <p className="text-lg font-bold text-primary">0s</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase mb-1">Next Multiplier</p>
          <p className="text-lg font-bold text-white">{nextMultiplier.toFixed(1)}x</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">Combo Progress</span>
          <span className="text-[10px] text-primary">{combo}/{MAX_COMBOS}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-primary transition-all duration-500"
            style={{ width: `${(combo / MAX_COMBOS) * 100}%` }}
          />
        </div>
      </div>

      {/* Combo Indicators */}
      <div className="flex justify-between mt-3">
        {Array.from({ length: MAX_COMBOS }).map((_, i) => (
          <div 
            key={i}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              i < combo 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Risk Warning */}
      <div className="flex items-center gap-2 mt-4 p-2 bg-red-500/10 rounded text-xs text-red-400">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>Risk: Reset On Loss</span>
      </div>
    </div>
  );
}


