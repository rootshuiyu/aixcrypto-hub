"use client";

import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PricePoint = { timestamp?: string | number; time?: string; value: number };

export function MarketChart({
  symbol,
  timeframe,
  data,
}: {
  symbol: "C10" | "GOLD" | string;
  timeframe?: string;
  data: PricePoint[];
}) {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    return data
      .slice()
      .map((p) => ({
        time:
          p.time ??
          (p.timestamp
            ? new Date(p.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""),
        value: Number(p.value ?? 0),
      }))
      .filter((x) => Number.isFinite(x.value));
  }, [data]);

  const color = symbol === "GOLD" ? "#eab308" : "#a855f7";

  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-3 sm:p-6 w-full min-w-0">
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
            {symbol} {timeframe ? `· ${timeframe}` : ""}
          </div>
          <div className="text-xs text-white/20">PRICE_FEED</div>
        </div>
      </div>

      <div className="h-[180px] sm:h-[320px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="mv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "rgba(0,0,0,0.85)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
              }}
              labelStyle={{ color: "rgba(255,255,255,0.6)" }}
              itemStyle={{ color: "white" }}
            />
            <Area type="monotone" dataKey="value" stroke={color} fill="url(#mv)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {!chartData.length && (
        <div className="mt-4 text-xs text-white/30">No price history yet.</div>
      )}
    </div>
  );
}









