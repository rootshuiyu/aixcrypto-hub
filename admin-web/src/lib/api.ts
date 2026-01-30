import axios from "axios";

const BACKEND_URL = "http://localhost:3001";
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "iDaAIHfveMczXR05NwkGd4L9q2PsoKQr";

export const adminApi = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
    "x-admin-token": ADMIN_TOKEN,
  },
});

// Response interceptor for error handling
adminApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("Admin API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// We use absolute URLs to ensure consistency and avoid any origin mismatch or baseURL stripping
export const api = {
  // Dashboard & System
  getStats: () => adminApi.get(`${BACKEND_URL}/super-admin-api/dashboard-stats`),
  getLogs: () => adminApi.get(`${BACKEND_URL}/super-admin-api/operation-logs`),
  getOnlineUsers: () => adminApi.get(`${BACKEND_URL}/super-admin-api/system/online-users`),
  broadcastMessage: (data: { type: string, message: string }) => adminApi.post(`${BACKEND_URL}/super-admin-api/system/broadcast`, data),

  // AI Agents
  getAgentConfigs: () => adminApi.get(`${BACKEND_URL}/super-admin-api/agents/configs`),
  updateAgent: (id: string, data: {
    winRate?: number,
    difficultyBias?: number,
    aggressiveness?: number,
    trapFrequency?: number,
    isActive?: boolean,
    personality?: string
  }) => adminApi.post(`${BACKEND_URL}/super-admin-api/agent/tune/${id}`, data),

  // Users
  getUsers: () => adminApi.get(`${BACKEND_URL}/super-admin-api/users`),
  getUserAudit: (id: string) => adminApi.get(`${BACKEND_URL}/super-admin-api/user-audit/${id}`),
  updateUserPts: (data: { userId: string, amount: number, reason: string }) => adminApi.post(`${BACKEND_URL}/super-admin-api/user/update-pts`, data),
  resetUserCombo: (userId: string) => adminApi.post(`${BACKEND_URL}/super-admin-api/user/reset-combo`, { userId }),
  deleteUser: (id: string) => adminApi.delete(`${BACKEND_URL}/super-admin-api/user/${id}`),

  // Market
  createMarket: (data: any) => adminApi.post(`${BACKEND_URL}/super-admin-api/market/create`, data),
  resolveMarket: (id: string) => adminApi.post(`${BACKEND_URL}/super-admin-api/market/resolve/${id}`),

  // Quests
  getQuests: () => adminApi.get(`${BACKEND_URL}/super-admin-api/quest-list`),
  getQuestStats: () => adminApi.get(`${BACKEND_URL}/super-admin-api/quest-stats`),
  createQuest: (data: any) => adminApi.post(`${BACKEND_URL}/super-admin-api/quest/deploy`, data),
  updateQuest: (data: any) => adminApi.post(`${BACKEND_URL}/super-admin-api/quest/update`, data),
  deleteQuest: (id: string) => adminApi.post(`${BACKEND_URL}/super-admin-api/quest/delete`, { id }),
  resetDailyQuests: () => adminApi.post(`${BACKEND_URL}/super-admin-api/quest/reset-daily`),

  // Vault
  getGlobalVaultHistory: (limit?: number) => adminApi.get(`${BACKEND_URL}/super-admin-api/vault/history${limit ? `?limit=${limit}` : ''}`),
  getVaultStats: () => adminApi.get(`${BACKEND_URL}/super-admin-api/vault/stats`),

  // ============================================
  // Feature Flags 功能开关
  // ============================================
  getFeatureFlags: () => adminApi.get(`${BACKEND_URL}/super-admin-api/system/feature-flags`),
  getFeatureFlag: (feature: string) => adminApi.get(`${BACKEND_URL}/super-admin-api/system/feature-flags/${feature}`),
  updateFeatureFlag: (feature: string, enabled: boolean) => 
    adminApi.post(`${BACKEND_URL}/super-admin-api/system/feature-flags/${feature}`, { enabled }),
  updateFeatureFlags: (flags: Record<string, boolean>) => 
    adminApi.post(`${BACKEND_URL}/super-admin-api/system/feature-flags`, { flags }),

  // ============================================
  // Notifications 通知管理
  // ============================================
  getAllNotifications: (page = 1, limit = 20) => 
    adminApi.get(`${BACKEND_URL}/notification/admin/all?page=${page}&limit=${limit}`),
  sendNotification: (data: { userId?: string, type: string, title: string, message: string, metadata?: any }) => 
    adminApi.post(`${BACKEND_URL}/notification/admin/send`, data),
  sendBulkNotification: (data: { userIds: string[], type: string, title: string, message: string }) => 
    adminApi.post(`${BACKEND_URL}/notification/admin/send-bulk`, data),
  sendGlobalNotification: (data: { type: string, title: string, message: string }) => 
    adminApi.post(`${BACKEND_URL}/notification/admin/send-global`, data),
  deleteNotification: (id: string) => 
    adminApi.delete(`${BACKEND_URL}/notification/admin/${id}`),

  // ============================================
  // Seasons 赛季管理
  // ============================================
  getSeasons: () => adminApi.get(`${BACKEND_URL}/season/list`),
  getActiveSeason: () => adminApi.get(`${BACKEND_URL}/season/active`),
  createSeason: (data: { name: string, startDate: string, endDate: string, description?: string, rewards?: any }) => 
    adminApi.post(`${BACKEND_URL}/season/admin/create`, data),
  updateSeason: (id: string, data: any) => 
    adminApi.put(`${BACKEND_URL}/season/admin/${id}`, data),
  deleteSeason: (id: string) => 
    adminApi.delete(`${BACKEND_URL}/season/admin/${id}`),
  endSeason: (id: string) => 
    adminApi.post(`${BACKEND_URL}/season/admin/${id}/end`),

  // ============================================
  // Tournaments 锦标赛管理
  // ============================================
  getTournaments: () => adminApi.get(`${BACKEND_URL}/season/tournaments`),
  createTournament: (data: { 
    name: string, 
    startDate: string, 
    endDate: string, 
    entryFee?: number, 
    prizePool?: number, 
    maxParticipants?: number,
    description?: string 
  }) => adminApi.post(`${BACKEND_URL}/season/admin/tournament/create`, data),
  updateTournament: (id: string, data: any) => 
    adminApi.put(`${BACKEND_URL}/season/admin/tournament/${id}`, data),
  deleteTournament: (id: string) => 
    adminApi.delete(`${BACKEND_URL}/season/admin/tournament/${id}`),
  endTournament: (id: string) => 
    adminApi.post(`${BACKEND_URL}/season/admin/tournament/${id}/end`),
  getTournamentParticipants: (id: string) => 
    adminApi.get(`${BACKEND_URL}/season/tournaments/${id}/leaderboard`),

  // ============================================
  // Referrals 推荐系统
  // ============================================
  getReferralStats: () => adminApi.get(`${BACKEND_URL}/referral/admin/stats`),
  getTopReferrers: (limit = 20) => adminApi.get(`${BACKEND_URL}/referral/admin/top?limit=${limit}`),

  // ============================================
  // Round & Combo System Config
  // ============================================
  getRoundConfig: () => adminApi.get(`${BACKEND_URL}/super-admin-api/system/round-config`),
  updateRoundConfig: (data: any) => adminApi.post(`${BACKEND_URL}/super-admin-api/system/round-config`, data),
  getComboConfig: () => adminApi.get(`${BACKEND_URL}/super-admin-api/system/combo-config`),
  updateComboConfig: (data: any) => adminApi.post(`${BACKEND_URL}/super-admin-api/system/combo-config`, data),

  getAiConfig: () => adminApi.get(`${BACKEND_URL}/super-admin-api/system/ai-config`),
  updateAiConfig: (data: { provider?: string; deepseekApiKey?: string; deepseekModel?: string; openaiApiKey?: string; openaiModel?: string }) =>
    adminApi.post(`${BACKEND_URL}/super-admin-api/system/ai-config`, data),
};
