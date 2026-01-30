type MarketTrendProps = {
  title: string;
  value: string;
};

export function MarketTrend({ title, value }: MarketTrendProps) {
  return (
    <div className="glass rounded-3xl p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">{title}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <div className="mt-4 h-20 rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
      <p className="mt-3 text-xs text-white/40">TradingView / Recharts 将在此接入</p>
    </div>
  );
}

