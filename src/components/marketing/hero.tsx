export function Hero() {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold tracking-[0.2em] text-neon-purple/80">Superoctop</p>
      <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
        连接 Web3 与 AI 的预测市场
      </h1>
      <p className="mt-4 text-base text-white/70 md:text-lg">
        S1 Arena 是专为加密预测而生的竞技场。通过 AI 信号、链上数据与社交情绪，为你提供更可靠的市场决策。
      </p>
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/60">
        <span className="glass rounded-full px-4 py-2">实时赔率</span>
        <span className="glass rounded-full px-4 py-2">AI 评分</span>
        <span className="glass rounded-full px-4 py-2">跨链流动性</span>
      </div>
    </div>
  );
}

