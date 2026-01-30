"use client";

export function MarketStats({ market }: { market?: any }) {
  const items = [
    { label: "POOL", value: market?.poolSize ?? "--" },
    { label: "24H_VOL", value: market?.volume24h ?? market?.volume ?? "--" },
    { label: "OPEN_POS", value: market?.openPositions ?? "--" },
    { label: "RESOLUTION", value: market?.resolution ?? "--" },
  ];

  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-3 sm:p-6 w-full min-w-0">
      <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">
        MARKET_STATS
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="text-[8px] font-black uppercase tracking-widest text-white/20">
              {it.label}
            </div>
            <div className="mt-1 text-sm font-bold text-white truncate">
              {String(it.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}









