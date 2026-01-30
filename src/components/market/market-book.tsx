"use client";

export function MarketBook({ market }: { market?: any }) {
  const recent = Array.isArray(market?.recentBets) ? market.recentBets : [];

  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-3 sm:p-6 w-full min-w-0">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
          ORDER_BOOK
        </div>
        <div className="text-[9px] text-white/20">{market?.id ?? ""}</div>
      </div>

      {recent.length ? (
        <div className="space-y-2">
          {recent.slice(0, 8).map((r: any, idx: number) => (
            <div
              key={r?.id ?? idx}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <div className="text-[10px] font-mono text-white/60">
                {r?.side ?? r?.position ?? "--"}
              </div>
              <div className="text-[10px] font-mono text-white/40">
                {r?.amount ?? "--"}
              </div>
              <div className="text-[10px] font-mono text-white/20">
                {r?.createdAt ? new Date(r.createdAt).toLocaleTimeString() : "--"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-white/30">No recent orders.</div>
      )}
    </div>
  );
}









