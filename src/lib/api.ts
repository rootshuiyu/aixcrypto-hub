const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * 带有重试机制的 fetch 封装
 * 针对 429 (频率限制) 和 5xx (服务器错误) 进行自动指数退避重试
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, backoff = 1000): Promise<Response> {
  try {
    const res = await fetch(url, options);
    
    // 如果返回 429 或 5xx 错误，且还有重试次数，则进行重试
    if (!res.ok && (res.status === 429 || res.status >= 500) && retries > 0) {
      console.warn(`[API_RETRY] ${res.status} error on ${url}. Retrying in ${backoff}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    
    return res;
  } catch (error) {
    // 针对网络超时或断网等异常进行重试
    if (retries > 0) {
      console.warn(`[API_RETRY] Network error on ${url}. Retrying in ${backoff}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}

// Types
export interface Market {
  id: string;
  title: string;
  description?: string;
  category: 'C10' | 'GOLD' | 'ESPORTS' | 'FOOTBALL'; // 补全分类
  timeframe: string;
  status: 'ACTIVE' | 'PENDING' | 'RESOLVED' | 'UPCOMING' | 'LIVE' | 'FINISHED'; // 补全状态
  poolSize?: number;
  yesPool?: number;
  noPool?: number;
  totalPool?: number;
  yesProbability?: number;
  noProbability?: number;
  yesOdds?: number;
  noOdds?: number;
  volume?: number;
  volume24h?: number;
  openPositions?: number;
  resolution?: string;
  resolutionTime?: string;
  outcome?: 'YES' | 'NO';
  priceHistory?: { timestamp: string | number; value: number }[];
  recentBets?: any[];
  startPrice?: number;
  endTime?: string;
  // 🆕 足球/电竞特有字段
  tvChannels?: { name: string }[];
  streamUrl?: string;
  league?: string;
  homeTeam?: { name: string; logo?: string };
  awayTeam?: { name: string; logo?: string };
}

export interface AIAnalysisResult {
  analysis: string;
  recommendation: 'LONG' | 'SHORT' | 'HOLD';
  confidence: number;
  riskLevel: string;
}

export interface AISuggestion {
  id: string;
  suggestion: 'YES' | 'NO';
  reasoning: string;
  confidence: number;
  recommendedAmount: number;
}

export const api = {
  // --- Feature Flags API ---
  /**
   * 获取所有功能开关状态
   */
  async getFeatureFlags(): Promise<Record<string, boolean>> {
    try {
      const res = await fetch(`${API_BASE_URL}/config/feature-flags`);
      if (!res.ok) return { playground: true, market: true, wallet: true, referral: true, tournaments: true, leaderboard: true };
      return res.json();
    } catch {
      return { playground: true, market: true, wallet: true, referral: true, tournaments: true, leaderboard: true };
    }
  },

  /**
   * 获取单个功能开关状态
   */
  async getFeatureFlag(feature: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/config/feature-flags/${feature}`);
      if (!res.ok) return true;
      const data = await res.json();
      return data.enabled ?? true;
    } catch {
      return true;
    }
  },

  // --- User & Profile API ---
  /**
   * 获取用户资料
   * @param userId 用户 ID（可选，为空时返回 null）
   */
  async getUserProfile(userId?: string) {
    if (!userId) return null;
    const res = await fetchWithRetry(`${API_BASE_URL}/user/${userId}/profile`);
    if (!res.ok) throw new Error("Failed to fetch user profile");
    return res.json();
  },

  async updateUsername(userId: string, username: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/user/${userId}/username`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error("Failed to update username");
    return res.json();
  },

  async getLeaderboard(limit: number = 100) {
    const res = await fetchWithRetry(`${API_BASE_URL}/user/leaderboard?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return res.json();
  },

  /**
   * 获取用户最近活动（下注/持仓/电竞/足球等）
   */
  async getRecentActivity(userId: string | undefined, limit: number = 10) {
    if (!userId) return { success: true, activities: [] };
    const res = await fetchWithRetry(`${API_BASE_URL}/user/${userId}/recent-activity?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch recent activity");
    return res.json();
  },

  /**
   * 获取用户当前赛季等级/排名
   */
  async getSeasonLevel(userId: string | undefined) {
    if (!userId) return { success: true, seasonName: null, rank: null, totalPts: 0, winRate: 0, level: "—" };
    const res = await fetchWithRetry(`${API_BASE_URL}/user/${userId}/season-level`);
    if (!res.ok) throw new Error("Failed to fetch season level");
    return res.json();
  },

  /**
   * 获取用户收益曲线（按日汇总 PnL）
   */
  async getProfitCurve(userId: string | undefined, days: number = 30) {
    if (!userId) return { success: true, curve: [] };
    const res = await fetchWithRetry(`${API_BASE_URL}/user/${userId}/profit-curve?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch profit curve");
    return res.json();
  },

  // --- Playground & Agent API ---
  async getAgents(userId?: string) {
    const url = userId 
      ? `${API_BASE_URL}/playground/agents?userId=${encodeURIComponent(userId)}`
      : `${API_BASE_URL}/playground/agents`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error("Failed to fetch agents");
    return res.json();
  },

  async startBattle(data: { userId: string; agentId: string; amount: number; marketType?: string; timeframe?: string; userPick: 'UP' | 'DOWN' | 'YES' | 'NO'; language?: string }) {
    const res = await fetchWithRetry(`${API_BASE_URL}/playground/battle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to start battle");
    return res.json();
  },

  // --- Team API ---
  async getMyTeam(userId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/team/my/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch team");
    return res.json();
  },

  async getTeamLeaderboard(limit: number = 100) {
    const res = await fetchWithRetry(`${API_BASE_URL}/team/leaderboard?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch team leaderboard");
    return res.json();
  },

  async createTeam(data: { userId?: string; leaderId?: string; name: string; description?: string; isPublic?: boolean }) {
    // 兼容 userId 和 leaderId
    const payload = {
      ...data,
      leaderId: data.leaderId || data.userId,
    };
    const res = await fetchWithRetry(`${API_BASE_URL}/team/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create team");
    return res.json();
  },

  /**
   * 通过邀请码加入团队
   * @param data 包含 userId 和 inviteCode 的对象
   */
  async joinTeamByInvite(data: { userId: string; inviteCode: string }) {
    const res = await fetchWithRetry(`${API_BASE_URL}/team/join/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to join team");
    }
    return res.json();
  },

  async joinPublicTeam(data: { userId: string; teamId: string }) {
    const res = await fetchWithRetry(`${API_BASE_URL}/team/join/public`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to join team");
    return res.json();
  },

  async leaveTeam(data: string | { userId: string }) {
    const userId = typeof data === 'string' ? data : data.userId;
    const res = await fetchWithRetry(`${API_BASE_URL}/team/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error("Failed to leave team");
    return res.json();
  },

  async searchTeams(query: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/team/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Failed to search teams");
    return res.json();
  },

  // --- Season & Tournament API ---
  async getActiveSeason() {
    const res = await fetchWithRetry(`${API_BASE_URL}/season/active`);
    if (!res.ok) throw new Error("Failed to fetch active season");
    return res.json();
  },

  async getSeasonList() {
    const res = await fetchWithRetry(`${API_BASE_URL}/season/list`);
    if (!res.ok) throw new Error("Failed to fetch season list");
    return res.json();
  },

  async getSeasonLeaderboard(seasonId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/season/${seasonId}/leaderboard`);
    if (!res.ok) throw new Error("Failed to fetch season leaderboard");
    return res.json();
  },

  async getTournaments() {
    const res = await fetchWithRetry(`${API_BASE_URL}/season/tournaments`);
    if (!res.ok) throw new Error("Failed to fetch tournaments");
    return res.json();
  },

  async getTournamentDetails(tournamentId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/season/tournaments/${tournamentId}`);
    if (!res.ok) throw new Error("Failed to fetch tournament details");
    return res.json();
  },

  async getTournamentLeaderboard(tournamentId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/season/tournaments/${tournamentId}/leaderboard`);
    if (!res.ok) throw new Error("Failed to fetch tournament leaderboard");
    return res.json();
  },

  async joinTournament(tournamentId: string, userId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/season/tournaments/${tournamentId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error("Failed to join tournament");
    return res.json();
  },

  async getLiveBattles() {
    const res = await fetchWithRetry(`${API_BASE_URL}/season/live-battles`);
    if (!res.ok) throw new Error("Failed to fetch live battles");
    return res.json();
  },

  async getHighlights() {
    const res = await fetchWithRetry(`${API_BASE_URL}/season/highlights`);
    if (!res.ok) throw new Error("Failed to fetch highlights");
    return res.json();
  },

  // --- Vault & Transaction API ---
  async getVaultInfo() {
    const res = await fetchWithRetry(`${API_BASE_URL}/vault/info`);
    if (!res.ok) throw new Error("Failed to fetch vault info");
    return res.json();
  },

  async prepareWithdraw(userAddress: string, amount: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/vault/prepare-withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAddress, amount }),
    });
    if (!res.ok) throw new Error("Failed to prepare withdraw");
    return res.json();
  },

  async recordDeposit(userId: string, txHash: string, amount: string, token: string = "ETH") {
    const res = await fetchWithRetry(`${API_BASE_URL}/vault/record-deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, txHash, amount, token }),
    });
    if (!res.ok) throw new Error("Failed to record deposit");
    return res.json();
  },

  async recordWithdraw(userId: string, txHash: string, amount: string, token: string = "ETH") {
    const res = await fetchWithRetry(`${API_BASE_URL}/vault/record-withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, txHash, amount, token }),
    });
    if (!res.ok) throw new Error("Failed to record withdraw");
    return res.json();
  },

  async getTransactionHistory(userId: string, limit: number = 20) {
    const res = await fetchWithRetry(`${API_BASE_URL}/vault/history/${userId}?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch transaction history");
    return res.json();
  },

  async confirmTransaction(txHash: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/vault/confirm/${txHash}`);
    if (!res.ok) throw new Error("Failed to confirm transaction");
    return res.json();
  },

  // --- Settlement API ---
  async getActivePositions(userId: string): Promise<any[]> {
    const res = await fetchWithRetry(`${API_BASE_URL}/settlement/active/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch active positions");
    return res.json();
  },

  async getPositionHistory(userId: string, limit: number = 20) {
    const res = await fetchWithRetry(`${API_BASE_URL}/settlement/history/${userId}?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch position history");
    return res.json();
  },

  // --- Market API ---
  async getMarkets(): Promise<Market[]> {
    const res = await fetchWithRetry(`${API_BASE_URL}/market`);
    if (!res.ok) throw new Error("Failed to fetch markets");
    return res.json();
  },

  async getPublicStats(): Promise<{
    activeUsers: number;
    totalTVL: number;
    totalMarkets: number;
    medianWinRate: number;
    volume24h: number;
    totalBets: number;
  }> {
    const res = await fetchWithRetry(`${API_BASE_URL}/market/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  },

  async getMarket(marketId: string): Promise<Market> {
    const res = await fetchWithRetry(`${API_BASE_URL}/market/${marketId}`);
    if (!res.ok) throw new Error("Failed to fetch market");
    return res.json();
  },

  async getMarketOdds(marketId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/market/${marketId}/odds`);
    if (!res.ok) throw new Error("Failed to fetch market odds");
    return res.json();
  },

  async getMarketSnapshots(marketId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/market/${marketId}/snapshots`);
    if (!res.ok) throw new Error("Failed to fetch market snapshots");
    return res.json();
  },

  async getBacktestStats(marketId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/market/${marketId}/backtest-stats`);
    if (!res.ok) throw new Error("Failed to fetch backtest stats");
    return res.json();
  },

  async getMarketHistory(category: string, timeframe: string): Promise<Market[]> {
    const res = await fetchWithRetry(`${API_BASE_URL}/market/history?category=${encodeURIComponent(category)}&timeframe=${encodeURIComponent(timeframe)}`);
    if (!res.ok) throw new Error("Failed to fetch market history");
    return res.json();
  },

  async getRecentBets(marketId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/market/${marketId}/recent-bets`);
    if (!res.ok) throw new Error("Failed to fetch recent bets");
    return res.json();
  },

  async placeBet(marketId: string, data: { userId?: string; position: 'YES' | 'NO'; amount: number }) {
    const res = await fetchWithRetry(`${API_BASE_URL}/market/${marketId}/bet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to place bet");
    }
    return res.json();
  },

  async getIndexHistory(category: "C10" | "GOLD" | string, limit: number = 80) {
    const res = await fetch(
      `${API_BASE_URL}/market/index/history?type=${encodeURIComponent(category)}&limit=${limit}`
    );
    if (!res.ok) throw new Error("Failed to fetch index history");
    return res.json();
  },

  async getIndexComponents() {
    const res = await fetchWithRetry(`${API_BASE_URL}/market/index/components`);
    if (!res.ok) throw new Error("Failed to fetch index components");
    return res.json();
  },

  async getGoldComponents() {
    const res = await fetchWithRetry(`${API_BASE_URL}/market/index/gold-components`);
    if (!res.ok) throw new Error("Failed to fetch gold components");
    return res.json();
  },

  // --- AI API ---
  async getAiStatus() {
    const res = await fetchWithRetry(`${API_BASE_URL}/ai/status`);
    if (!res.ok) throw new Error("Failed to fetch AI status");
    return res.json();
  },

  async getAiAnalysis(marketId: string, language: string = 'en'): Promise<AIAnalysisResult> {
    const res = await fetchWithRetry(`${API_BASE_URL}/market/${marketId}/ai-analysis?lang=${language}`);
    if (!res.ok) throw new Error("Failed to fetch AI analysis");
    return res.json();
  },

  /** 落地页真 AI 建议（一句通用洞察；fresh=true 时每次重新生成并带平台/热门市场上下文） */
  async getLandingSuggestion(language: string = "zh-CN", fresh?: boolean): Promise<{ suggestion: string }> {
    const params = new URLSearchParams({ language });
    if (fresh) params.set("fresh", "1");
    const res = await fetchWithRetry(`${API_BASE_URL}/ai/landing-suggestion?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch landing suggestion");
    return res.json();
  },

  // --- Strategy API ---
  async getPresetStrategies() {
    const res = await fetchWithRetry(`${API_BASE_URL}/strategy/presets`);
    if (!res.ok) throw new Error("Failed to fetch preset strategies");
    return res.json();
  },

  async getUserStrategies(userId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/strategy/user/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch user strategies");
    return res.json();
  },

  async generateSuggestion(data: { userId: string; marketId: string; strategyId?: string; language?: string }): Promise<AISuggestion> {
    const res = await fetchWithRetry(`${API_BASE_URL}/strategy/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to generate suggestion");
    }
    return res.json();
  },

  async generateSuggestionWithModel(data: { 
    userId: string; 
    marketId: string; 
    strategyId?: string;
    modelId: string;
    language?: string;
    customConfig?: {
      name: string;
      apiKey: string;
      baseUrl: string;
      model: string;
    };
  }): Promise<AISuggestion> {
    const res = await fetchWithRetry(`${API_BASE_URL}/strategy/suggest-with-model`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to generate suggestion with model");
    }
    return res.json();
  },

  async followSuggestion(userId: string, suggestionId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/strategy/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, suggestionId }),
    });
    if (!res.ok) throw new Error("Failed to follow suggestion");
    return res.json();
  },

  async getSuggestionHistory(userId: string, limit: number = 20) {
    const res = await fetchWithRetry(`${API_BASE_URL}/strategy/history/${userId}?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch suggestion history");
    return res.json();
  },

  // --- Quest API ---
  async getTasks(userId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/quest/tasks/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return res.json();
  },

  // ============================================
  // Round API (回合制预测)
  // ============================================

  async getCurrentRound(category: string = 'C10') {
    const res = await fetchWithRetry(`${API_BASE_URL}/round/current?category=${category}`);
    if (!res.ok) throw new Error("Failed to fetch current round");
    return res.json();
  },

  async getRoundHistory(category: string = 'C10', limit: number = 50) {
    const res = await fetchWithRetry(`${API_BASE_URL}/round/history?category=${category}&limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch round history");
    return res.json();
  },

  async getRoundConfig() {
    const res = await fetchWithRetry(`${API_BASE_URL}/round/config`);
    if (!res.ok) throw new Error("Failed to fetch round config");
    return res.json();
  },

  // === 辅助 API 方法 ===
  async getSettlementStats(userId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/settlement/stats/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch settlement stats");
    return res.json();
  },

  async getRecentBattles(userId?: string, limit?: number) {
    if (!userId) return [];
    const url = limit != null
      ? `${API_BASE_URL}/playground/recent/${userId}?limit=${limit}`
      : `${API_BASE_URL}/playground/recent/${userId}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error("Failed to fetch recent battles");
    return res.json();
  },

  /** 获取用户 Battle 统计（对战胜率、净盈亏、ROI） */
  async getBattleStats(userId: string | undefined) {
    if (!userId) return { totalBattles: 0, wins: 0, losses: 0, draws: 0, winRate: "0", totalWagered: 0, totalReward: 0, netProfit: 0, roi: "0" };
    const res = await fetchWithRetry(`${API_BASE_URL}/playground/stats/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch battle stats");
    return res.json();
  },

  async claimReward(taskId: string, userId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/quest/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, taskId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to claim reward");
    }
    return res.json();
  },

  /** 
   * @deprecated 请使用 joinTeamByInvite 代替
   * 保留此方法以兼容旧代码
   */
  async joinTeamByCode(data: { userId?: string; inviteCode: string } | string, userId?: string) {
    // 兼容两种调用方式，内部统一调用 joinTeamByInvite
    let payload: { userId: string; inviteCode: string };
    if (typeof data === 'string') {
      payload = { inviteCode: data, userId: userId || '' };
    } else {
      payload = { inviteCode: data.inviteCode, userId: data.userId || '' };
    }
    return this.joinTeamByInvite(payload);
  },

  async refreshInviteCode(leaderId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/team/refresh-invite-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaderId }),
    });
    if (!res.ok) throw new Error("Failed to refresh invite code");
    return res.json();
  },

  // ==================== 市场日历 API ====================

  async getMarketsStatus() {
    const res = await fetchWithRetry(`${API_BASE_URL}/market/calendar/status`);
    if (!res.ok) throw new Error("Failed to fetch markets status");
    return res.json();
  },

  async getGoldMarketStatus(): Promise<{
    isOpen: boolean;
    market: string;
    nextOpenTime?: string;
    nextCloseTime?: string;
    message: string;
    timezone: string;
  }> {
    const res = await fetchWithRetry(`${API_BASE_URL}/market/calendar/gold`);
    if (!res.ok) throw new Error("Failed to fetch gold market status");
    return res.json();
  },

  async getMarketCountdown(market: 'GOLD' | 'C10'): Promise<{
    type: 'until_close' | 'until_open';
    seconds: number;
    formatted: string;
  } | null> {
    const res = await fetchWithRetry(`${API_BASE_URL}/market/calendar/${market}/countdown`);
    if (!res.ok) throw new Error("Failed to fetch market countdown");
    return res.json();
  },

  // ==================== AMM 交易 API ====================

  async getAMMPool(roundId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/amm/pool/${roundId}`);
    if (!res.ok) throw new Error("Failed to fetch AMM pool");
    return res.json();
  },

  async getAMMPrices(roundId: string): Promise<{ 
    success: boolean; 
    yesPrice: number; 
    noPrice: number 
  }> {
    const res = await fetchWithRetry(`${API_BASE_URL}/amm/prices/${roundId}`);
    if (!res.ok) throw new Error("Failed to fetch AMM prices");
    return res.json();
  },

  async quoteBuy(roundId: string, side: 'YES' | 'NO', amount: number) {
    const res = await fetchWithRetry(`${API_BASE_URL}/amm/quote/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId, side, amount }),
    });
    if (!res.ok) throw new Error("Failed to get buy quote");
    return res.json();
  },

  async quoteSell(roundId: string, side: 'YES' | 'NO', shares: number) {
    const res = await fetchWithRetry(`${API_BASE_URL}/amm/quote/sell`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId, side, shares }),
    });
    if (!res.ok) throw new Error("Failed to get sell quote");
    return res.json();
  },

  async ammBuy(userId: string, roundId: string, side: 'YES' | 'NO', amount: number) {
    const res = await fetchWithRetry(`${API_BASE_URL}/amm/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, roundId, side, amount }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "Failed to execute buy");
    }
    return res.json();
  },

  async ammSell(userId: string, roundId: string, side: 'YES' | 'NO', shares: number) {
    const res = await fetchWithRetry(`${API_BASE_URL}/amm/sell`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, roundId, side, shares }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "Failed to execute sell");
    }
    return res.json();
  },

  async getPositions(userId: string, roundId?: string) {
    const url = roundId 
      ? `${API_BASE_URL}/amm/positions/${userId}?roundId=${roundId}`
      : `${API_BASE_URL}/amm/positions/${userId}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error("Failed to fetch positions");
    return res.json();
  },

  async getAMMTrades(roundId: string, limit: number = 100) {
    const res = await fetchWithRetry(`${API_BASE_URL}/amm/trades/${roundId}?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch trades");
    return res.json();
  },

  async getAMMCandles(roundId: string, interval: '1s' | '5s' | '1m' = '5s', limit: number = 100) {
    const res = await fetchWithRetry(
      `${API_BASE_URL}/amm/candles/${roundId}?interval=${interval}&limit=${limit}`
    );
    if (!res.ok) throw new Error("Failed to fetch candles");
    return res.json();
  },

  // --- Referral API ---
  async getReferralStats(userId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/referral/stats/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch referral stats");
    return res.json();
  },

  async getReferralList(userId: string, page: number = 1, limit: number = 20) {
    const res = await fetchWithRetry(
      `${API_BASE_URL}/referral/list/${userId}?page=${page}&limit=${limit}`
    );
    if (!res.ok) throw new Error("Failed to fetch referral list");
    return res.json();
  },

  async getReferralRewards(userId: string, page: number = 1, limit: number = 20) {
    const res = await fetchWithRetry(
      `${API_BASE_URL}/referral/rewards/${userId}?page=${page}&limit=${limit}`
    );
    if (!res.ok) throw new Error("Failed to fetch referral rewards");
    return res.json();
  },

  // --- Notification API ---
  async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    const res = await fetchWithRetry(
      `${API_BASE_URL}/notification/${userId}?page=${page}&limit=${limit}`
    );
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return res.json();
  },

  async getUnreadNotificationCount(userId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/notification/unread-count/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch unread count");
    return res.json();
  },

  async markNotificationRead(notificationId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/notification/${notificationId}/read`, {
      method: "PUT",
    });
    if (!res.ok) throw new Error("Failed to mark notification as read");
    return res.json();
  },

  async markAllNotificationsRead(userId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/notification/read-all/${userId}`, {
      method: "PUT",
    });
    if (!res.ok) throw new Error("Failed to mark all notifications as read");
    return res.json();
  },

  // ==================== Esports API ====================
  
  /**
   * 获取电竞比赛列表
   */
  async getEsportsMatches(params?: { game?: string; status?: string; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.game) searchParams.append('game', params.game);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const url = searchParams.toString() 
      ? `${API_BASE_URL}/esports/matches?${searchParams.toString()}`
      : `${API_BASE_URL}/esports/matches`;
    
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error("Failed to fetch esports matches");
    return res.json();
  },

  /**
   * 获取热门电竞比赛
   */
  async getHotEsportsMatches(limit: number = 5) {
    const res = await fetchWithRetry(`${API_BASE_URL}/esports/matches/hot?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch hot esports matches");
    return res.json();
  },

  /**
   * 获取单场电竞比赛详情
   */
  async getEsportsMatch(matchId: string) {
    const res = await fetchWithRetry(`${API_BASE_URL}/esports/matches/${matchId}`);
    if (!res.ok) throw new Error("Failed to fetch esports match");
    return res.json();
  },

  /**
   * 电竞下注
   */
  async placeEsportsBet(data: { userId: string; matchId: string; prediction: 'HOME' | 'AWAY'; amount: number }) {
    const res = await fetchWithRetry(`${API_BASE_URL}/esports/bet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to place esports bet");
    }
    return res.json();
  },

  /**
   * 获取用户电竞下注历史
   */
  async getEsportsBets(userId: string, limit: number = 20) {
    const res = await fetchWithRetry(`${API_BASE_URL}/esports/bets/${userId}?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch esports bets");
    return res.json();
  },

  /**
   * 获取电竞统计数据
   */
  async getEsportsStats() {
    const res = await fetchWithRetry(`${API_BASE_URL}/esports/stats`);
    if (!res.ok) throw new Error("Failed to fetch esports stats");
    return res.json();
  },

  /**
   * 获取实时交易流水
   */
  async getLiveFeed(category: string, limit: number = 20) {
    const res = await fetchWithRetry(`${API_BASE_URL}/round/live-feed?category=${category}&limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch live feed");
    return res.json();
  },

  async getGlobalActiveOrders(limit: number = 50) {
    const res = await fetchWithRetry(`${API_BASE_URL}/round/active-orders?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch global active orders");
    return res.json();
  },

  async getGlobalSettledOrders(limit: number = 50) {
    const res = await fetchWithRetry(`${API_BASE_URL}/round/settled-orders?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch global settled orders");
    return res.json();
  },

  // ==================== Football API ====================
  
  /**
   * 获取足球比赛列表
   */
  async getFootballMatches(params?: { league?: number; status?: string; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.league) searchParams.append('league', params.league.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const url = searchParams.toString() 
      ? `${API_BASE_URL}/api/football/matches?${searchParams.toString()}`
      : `${API_BASE_URL}/api/football/matches`;
    
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error("Failed to fetch football matches");
    return res.json();
  },

  /**
   * 获取正在进行的足球比赛
   */
  async getLiveFootballMatches() {
    const res = await fetchWithRetry(`${API_BASE_URL}/api/football/live`);
    if (!res.ok) throw new Error("Failed to fetch live football matches");
    return res.json();
  },

  /**
   * 获取热门足球比赛
   */
  async getHotFootballMatches(limit: number = 5) {
    const res = await fetchWithRetry(`${API_BASE_URL}/api/football/hot?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch hot football matches");
    return res.json();
  },

  /**
   * 获取足球比赛赔率
   */
  async getFootballOdds(fixtureId: number) {
    const res = await fetchWithRetry(`${API_BASE_URL}/api/football/odds/${fixtureId}`);
    if (!res.ok) throw new Error("Failed to fetch football odds");
    return res.json();
  },

  /**
   * 获取热门联赛列表
   */
  async getFootballLeagues() {
    const res = await fetchWithRetry(`${API_BASE_URL}/api/football/leagues`);
    if (!res.ok) throw new Error("Failed to fetch football leagues");
    return res.json();
  },

  /**
   * 足球下注
   */
  async placeFootballBet(data: { userId: string; matchId: string; prediction: 'HOME' | 'DRAW' | 'AWAY'; amount: number }) {
    const res = await fetchWithRetry(`${API_BASE_URL}/api/football/bet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to place football bet");
    }
    return res.json();
  },
};