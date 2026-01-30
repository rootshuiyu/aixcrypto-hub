export function ArenaHeader() {
  return (
    <div className="glass rounded-3xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-white/50">Prediction Market · Season 1</p>
          <h1 className="mt-2 text-3xl font-semibold">S1 Arena 竞技场</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            面向 AI + Web3 交易者的对战式预测市场。通过积分、等级与赛季奖励激励高质量预测。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full bg-neon-purple px-5 py-2 text-sm font-semibold text-white hover:shadow-glow-purple">
            创建预测
          </button>
          <button className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/70 hover:text-white">
            规则说明
          </button>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/60">
        <span className="rounded-full border border-white/10 px-3 py-1">赛季剩余 21 天</span>
        <span className="rounded-full border border-white/10 px-3 py-1">奖励池 $2.4M</span>
        <span className="rounded-full border border-white/10 px-3 py-1">参与者 8,420</span>
      </div>
    </div>
  );
}

