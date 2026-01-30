"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type Market } from "../../lib/api";

interface SettlementReplayProps {
  market?: Market;
}

export function SettlementReplay({ market }: SettlementReplayProps) {
  const { data: snapshots, isLoading } = useQuery({
    queryKey: ["marketSnapshots", market?.id],
    queryFn: () => api.getMarketSnapshots(market!.id),
    enabled: !!market?.id && market?.status === 'RESOLVED',
    refetchInterval: false,
  });

  if (!market || market.status !== 'RESOLVED' || isLoading) {
    return null;
  }

  if (!snapshots || !snapshots.startSnapshot || !snapshots.endSnapshot) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
          SETTLEMENT_REPLAY
        </div>
        <div className="text-xs text-white/30">Snapshot data not available</div>
      </div>
    );
  }

  const { startSnapshot, endSnapshot, priceChange, priceChangePercent, outcome } = snapshots;

  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-6 space-y-6">
      <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
        SETTLEMENT_REPLAY
      </div>

      {/* 结算结果 */}
      <div className={`p-4 rounded-lg border ${
        outcome === 'YES' 
          ? 'border-green-500/30 bg-green-500/5' 
          : 'border-red-500/30 bg-red-500/5'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60 uppercase">Outcome</span>
          <span className={`text-xl font-black ${
            outcome === 'YES' ? 'text-green-500' : 'text-red-500'
          }`}>
            {outcome === 'YES' ? 'UP' : 'DOWN'}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-white/60">Price Change</span>
          <span className={`text-lg font-mono font-bold ${
            priceChange >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(6)} 
            <span className="text-sm ml-1">
              ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(6)}%)
            </span>
          </span>
        </div>
      </div>

      {/* T0 快照 */}
      <div className="space-y-3">
        <div className="text-[9px] font-black uppercase text-white/40">
          START SNAPSHOT (T0)
        </div>
        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
          <div className="mb-2">
            <span className="text-xs text-white/60">Index Value: </span>
            <span className="text-sm font-mono font-bold text-white">
              {Number(startSnapshot.indexValue).toFixed(6)}
            </span>
          </div>
          <div className="text-[9px] text-white/40">
            {new Date(startSnapshot.timestamp).toLocaleString()}
          </div>
          {startSnapshot.components && Object.keys(startSnapshot.components).length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-[9px] text-white/40 uppercase mb-2">Components</p>
              <div className="space-y-1">
                {Object.entries(startSnapshot.components).slice(0, 5).map(([symbol, price]) => (
                  <div key={symbol} className="flex items-center justify-between text-xs">
                    <span className="text-white/60">{symbol}</span>
                    <span className="font-mono text-white/80">
                      {Number(price).toFixed(6)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* T1 快照 */}
      <div className="space-y-3">
        <div className="text-[9px] font-black uppercase text-white/40">
          END SNAPSHOT (T1)
        </div>
        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
          <div className="mb-2">
            <span className="text-xs text-white/60">Index Value: </span>
            <span className="text-sm font-mono font-bold text-white">
              {Number(endSnapshot.indexValue).toFixed(6)}
            </span>
          </div>
          <div className="text-[9px] text-white/40">
            {new Date(endSnapshot.timestamp).toLocaleString()}
          </div>
          {endSnapshot.components && Object.keys(endSnapshot.components).length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-[9px] text-white/40 uppercase mb-2">Components</p>
              <div className="space-y-1">
                {Object.entries(endSnapshot.components).slice(0, 5).map(([symbol, price]) => (
                  <div key={symbol} className="flex items-center justify-between text-xs">
                    <span className="text-white/60">{symbol}</span>
                    <span className="font-mono text-white/80">
                      {Number(price).toFixed(6)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

