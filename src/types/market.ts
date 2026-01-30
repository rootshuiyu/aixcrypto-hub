export type Market = {
  id: string;
  title: string;
  category?: string;
  volume?: string;
  yes?: number;  // 可选，兼容旧数据
  no?: number;    // 可选，兼容旧数据
  endTime?: string;
  liquidity?: string;
  poolSize?: number;
  yesPool?: number;
  noPool?: number;
  totalPool?: number;
  yesProbability?: number;
  noProbability?: number;
  yesOdds?: number;
  noOdds?: number;
  participants?: number;
  status?: string;
  signal?: string;
  lockTime?: string;
  timeToLock?: number;
  timeToEnd?: number;
  isLocked?: boolean;
  canBet?: boolean;
};

export type Signal = {
  label: string;
  value: string;
  change: string;
  hint: string;
};

export type LeaderboardEntry = {
  name: string;
  roi: string;
  streak: string;
};

