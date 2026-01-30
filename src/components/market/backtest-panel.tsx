"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type Market } from "../../lib/api";
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";

interface BacktestPanelProps {
  market?: Market;
}

export function BacktestPanel({ market }: BacktestPanelProps) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const { data: backtestStats, isLoading } = useQuery({
    queryKey: ["backtestStats", market?.id],
    queryFn: () => api.getBacktestStats(market!.id),
    enabled: !!market?.id,
    refetchInterval: 60000, // 每分钟刷新
  });

  if (!market || isLoading) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">
          {t.market?.aiBacktest || 'AI_BACKTEST'}
        </div>
        <div className="text-xs text-white/30">{t.common?.loading || 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-4 space-y-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
        {t.market?.aiBacktestWinRate || 'AI_BACKTEST_WIN_RATE'}
      </div>

      {backtestStats ? (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">{t.market?.overallWinRate || 'Overall Win Rate'}</span>
              <span className="text-2xl font-black text-cyan-500">
                {backtestStats.winRate}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                style={{ width: `${backtestStats.winRate}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
            <div>
              <p className="text-[9px] text-white/40 uppercase">{t.market?.total || 'Total'}</p>
              <p className="text-sm font-black text-white">
                {backtestStats.totalPredictions}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-white/40 uppercase">{t.market?.wins || 'Wins'}</p>
              <p className="text-sm font-black text-green-500">
                {backtestStats.wins}
              </p>
            </div>
          </div>

          {Object.keys(backtestStats.timeframeBreakdown || {}).length > 0 && (
            <div className="pt-3 border-t border-white/5 space-y-2">
              <p className="text-[9px] text-white/40 uppercase">{t.market?.byTimeframe || 'By Timeframe'}</p>
              {Object.entries(backtestStats.timeframeBreakdown).map(([tf, rate]) => (
                <div key={tf} className="flex items-center justify-between text-xs">
                  <span className="text-white/60">{tf}</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {Number(rate).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-xs text-white/30">
          {t.market?.noBacktestData || 'No backtest data available yet'}
        </div>
      )}
    </div>
  );
}

