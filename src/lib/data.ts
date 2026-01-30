import type { LeaderboardEntry, Market, Signal } from "../types/market";

export const hubStats = [
  { label: "活跃预测者", value: "42,891" },
  { label: "S1 Arena 总 TVL", value: "$38.6M" },
  { label: "AI Signal 覆盖", value: "187 个市场" },
  { label: "用户胜率中位数", value: "63.4%" }
];

export const featuredMarkets: Market[] = [
  {
    id: "btc-halving",
    title: "BTC 2026 Q2 价格突破 $125k？",
    category: "宏观趋势",
    volume: "$4.2M",
    yes: 0.62,
    no: 0.38,
    endTime: "2026-06-30"
  },
  {
    id: "eth-staking",
    title: "ETH 质押收益率保持 3.5% 以上？",
    category: "链上收益",
    volume: "$2.8M",
    yes: 0.55,
    no: 0.45,
    endTime: "2026-03-15"
  },
  {
    id: "sol-rwa",
    title: "SOL RWA 资产规模突破 $1B？",
    category: "RWA",
    volume: "$1.6M",
    yes: 0.48,
    no: 0.52,
    endTime: "2026-04-28"
  }
];

export const arenaMarkets: Market[] = [
  {
    id: "s1-01",
    title: "AI 预测：C10 指数 30 天涨幅超过 8%",
    liquidity: "$820k",
    participants: 1240,
    yes: 0.67,
    no: 0.33,
    status: "Live",
    signal: "强势多头"
  },
  {
    id: "s1-02",
    title: "NFT 蓝筹指数在 4 周内回到 Q4 高点",
    liquidity: "$410k",
    participants: 760,
    yes: 0.44,
    no: 0.56,
    status: "Live",
    signal: "中性偏空"
  },
  {
    id: "s1-03",
    title: "AI 情绪指标触发市场极度贪婪",
    liquidity: "$290k",
    participants: 580,
    yes: 0.53,
    no: 0.47,
    status: "Live",
    signal: "短线波动"
  },
  {
    id: "s1-04",
    title: "S1 Arena 预测者收益率超过 18%",
    liquidity: "$1.1M",
    participants: 1900,
    yes: 0.71,
    no: 0.29,
    status: "Final",
    signal: "完成结算"
  }
];

export const arenaSignals: Signal[] = [
  {
    label: "AI Score",
    value: "92.4",
    change: "+3.1",
    hint: "模型置信度"
  },
  {
    label: "资金热度",
    value: "高",
    change: "+11%",
    hint: "24h 资金流入"
  },
  {
    label: "社交情绪",
    value: "偏多",
    change: "+7%",
    hint: "舆情加权"
  }
];

export const leaderboard: LeaderboardEntry[] = [
  { name: "AlphaWolf", roi: "38.6%", streak: "12 连胜" },
  { name: "NebulaAI", roi: "33.2%", streak: "9 连胜" },
  { name: "QuantMuse", roi: "29.4%", streak: "6 连胜" }
];

