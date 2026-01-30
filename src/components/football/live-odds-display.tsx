'use client';

import React, { useState, useEffect } from 'react';
import { OddsUpdate } from '@/hooks/useFootballLive';

interface LiveOddsDisplayProps {
  odds: OddsUpdate | null;
  matchId: string;
  onSelect?: (prediction: 'HOME' | 'DRAW' | 'AWAY') => void;
}

/**
 * 实时赔率显示组件
 * 显示主胜、平局、客胜的赔率，支持点击下注
 */
export function LiveOddsDisplay({ odds, matchId, onSelect }: LiveOddsDisplayProps) {
  const [selectedPrediction, setSelectedPrediction] = useState<'HOME' | 'DRAW' | 'AWAY' | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  useEffect(() => {
    if (odds) {
      setLastUpdate(Date.now());
    }
  }, [odds]);

  if (!odds) {
    return (
      <div className="rounded-lg border border-gray-500/30 bg-gray-500/5 p-6 text-center">
        <p className="text-sm text-gray-500">Odds not available</p>
      </div>
    );
  }

  const handleSelect = (prediction: 'HOME' | 'DRAW' | 'AWAY') => {
    setSelectedPrediction(prediction);
    onSelect?.(prediction);
  };

  const oddsOptions = [
    {
      label: 'HOME WIN',
      value: odds.homeOdds,
      prediction: 'HOME' as const,
      color: 'from-blue-500/30 to-blue-600/30',
      borderColor: 'border-blue-500/50',
      textColor: 'text-blue-300',
    },
    {
      label: 'DRAW',
      value: odds.drawOdds,
      prediction: 'DRAW' as const,
      color: 'from-purple-500/30 to-purple-600/30',
      borderColor: 'border-purple-500/50',
      textColor: 'text-purple-300',
    },
    {
      label: 'AWAY WIN',
      value: odds.awayOdds,
      prediction: 'AWAY' as const,
      color: 'from-red-500/30 to-red-600/30',
      borderColor: 'border-red-500/50',
      textColor: 'text-red-300',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 赔率标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Live Odds</h3>
        <span className="text-xs text-gray-500">
          Updated {Math.round((Date.now() - lastUpdate) / 1000)}s ago
        </span>
      </div>

      {/* 赔率选项 */}
      <div className="grid grid-cols-3 gap-3">
        {oddsOptions.map((option) => (
          <button
            key={option.prediction}
            onClick={() => handleSelect(option.prediction)}
            className={`
              relative rounded-lg border-2 p-4 transition-all duration-200
              bg-gradient-to-br ${option.color} ${option.borderColor}
              ${
                selectedPrediction === option.prediction
                  ? 'ring-2 ring-white/50 shadow-lg'
                  : 'hover:shadow-md'
              }
            `}
          >
            {/* 选中指示器 */}
            {selectedPrediction === option.prediction && (
              <div className="absolute -right-2 -top-2 rounded-full bg-green-500 p-1">
                <span className="text-white">✓</span>
              </div>
            )}

            {/* 标签 */}
            <p className="mb-2 text-xs font-bold text-gray-400">{option.label}</p>

            {/* 赔率值 */}
            <p className={`text-3xl font-bold ${option.textColor}`}>
              {option.value.toFixed(2)}
            </p>

            {/* 可能的返利 */}
            <p className="mt-2 text-xs text-gray-500">
              1 → {(option.value).toFixed(2)}
            </p>
          </button>
        ))}
      </div>

      {/* 赔率对比和建议 */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
        <p className="font-semibold">📊 Odds Analysis</p>
        <p className="mt-1 opacity-75">
          Lowest odds: {Math.min(odds.homeOdds, odds.drawOdds, odds.awayOdds).toFixed(2)} |
          Highest odds: {Math.max(odds.homeOdds, odds.drawOdds, odds.awayOdds).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
