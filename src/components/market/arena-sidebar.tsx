import { arenaSignals, leaderboard } from "../../lib/data";

export function ArenaSidebar() {
  return (
    <aside className="space-y-6">
      <div className="glass rounded-3xl p-6">
        <h4 className="text-lg font-semibold">S1 Arena 指标</h4>
        <div className="mt-4 space-y-4">
          {arenaSignals.map((signal) => (
            <div key={signal.label} className="rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">{signal.label}</span>
                <span className="text-neon-purple-bright">{signal.change}</span>
              </div>
              <p className="mt-2 text-2xl font-semibold">{signal.value}</p>
              <p className="mt-1 text-xs text-white/40">{signal.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h4 className="text-lg font-semibold">预测排行榜</h4>
        <div className="mt-4 space-y-3 text-sm">
          {leaderboard.map((user, index) => (
            <div key={user.name} className="flex items-center justify-between rounded-2xl border border-white/10 p-4">
              <div>
                <p className="text-xs text-white/50">TOP {index + 1}</p>
                <p className="mt-1 font-semibold">{user.name}</p>
                <p className="mt-1 text-xs text-white/50">{user.streak}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40">ROI</p>
                <p className="mt-1 text-lg font-semibold text-neon-purple-bright">{user.roi}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h4 className="text-lg font-semibold">赛季任务</h4>
        <div className="mt-4 space-y-3 text-sm text-white/60">
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="font-semibold text-white">完成 5 次预测</p>
            <p className="mt-1 text-xs text-white/50">奖励 120 积分</p>
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="font-semibold text-white">连续 7 天登录</p>
            <p className="mt-1 text-xs text-white/50">奖励 1x Booster</p>
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="font-semibold text-white">参与 AI 对战</p>
            <p className="mt-1 text-xs text-white/50">奖励 S1 徽章</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

