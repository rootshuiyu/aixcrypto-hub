import Link from "next/link";
import { arenaMarkets } from "../../lib/data";

export function ArenaMarkets() {
  return (
    <div className="space-y-6">
      {arenaMarkets.map((market) => (
        <div key={market.id} className="glass rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">{market.status}</p>
              <h3 className="mt-2 text-xl font-semibold">{market.title}</h3>
              <p className="mt-2 text-sm text-white/60">AI 信号：{market.signal}</p>
            </div>
            <div className="text-right text-xs text-white/50">
              <p>流动性</p>
              <p className="mt-1 text-lg font-semibold text-white">{market.liquidity}</p>
              <p className="mt-1">参与者 {market.participants}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-xs text-white/60">
            <div className="flex items-center justify-between">
              <span>YES</span>
              <span>{Math.round((market.yes ?? 0.5) * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-neon-purple" style={{ width: `${(market.yes ?? 0.5) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span>NO</span>
              <span>{Math.round((market.no ?? 0.5) * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-neon-pink" style={{ width: `${(market.no ?? 0.5) * 100}%` }} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded-full bg-white/10 px-4 py-2 text-xs text-white/70 hover:text-white">
              下注 YES
            </button>
            <button className="rounded-full bg-white/10 px-4 py-2 text-xs text-white/70 hover:text-white">
              下注 NO
            </button>
            <Link
              href={`/market/${market.id}`}
              className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/60 hover:text-white"
            >
              查看详情
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

