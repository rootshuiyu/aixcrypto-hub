import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { MarketService } from '../market/market.service';
import { IndexService } from '../market/index.service';
import { QuestService } from '../quest/quest.service';
import { EventsGateway } from '../events/events.gateway';
import { PrismaService } from '../prisma.service';
import { AdminTokenGuard } from '../auth/guards/admin-token.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('admin')
@Controller('super-admin-api')
@UseGuards(AdminTokenGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly marketService: MarketService,
    private readonly indexService: IndexService,
    private readonly questService: QuestService,
    private readonly eventsGateway: EventsGateway,
    private readonly prisma: PrismaService,
  ) {}

  @Get('health')
  async health() {
    return { status: 'OK', timestamp: new Date() };
  }

  // --- 回合与连击配置 ---
  @Get('system/round-config')
  @ApiOperation({ summary: '获取回合配置' })
  async getRoundConfig() {
    return this.adminService.getRoundConfig();
  }

  @Post('system/round-config')
  @ApiOperation({ summary: '更新回合配置' })
  async updateRoundConfig(@Body() data: any) {
    const result = await this.adminService.updateRoundConfig(data);
    this.eventsGateway.broadcastSystemMessage('ROUND_CONFIG_UPDATE', 'Round duration updated');
    return result;
  }

  @Get('system/combo-config')
  @ApiOperation({ summary: '获取连击配置' })
  async getComboConfig() {
    return this.adminService.getComboConfig();
  }

  @Post('system/combo-config')
  @ApiOperation({ summary: '更新连击配置' })
  async updateComboConfig(@Body() data: any) {
    const result = await this.adminService.updateComboConfig(data);
    this.eventsGateway.broadcastSystemMessage('COMBO_CONFIG_UPDATE', 'Combo multiplier updated');
    return result;
  }

  @Get('system/ai-config')
  @ApiOperation({ summary: '获取 AI 模型配置（KEY/模型名，与 .env 并存）' })
  async getAiConfig() {
    return this.adminService.getAiConfig();
  }

  @Post('system/ai-config')
  @ApiOperation({ summary: '更新 AI 模型配置' })
  async updateAiConfig(@Body() data: { provider?: string; deepseekApiKey?: string; deepseekModel?: string; openaiApiKey?: string; openaiModel?: string }) {
    return this.adminService.updateAiConfig(data);
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: '获取管理后台核心看板数据' })
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('operation-logs')
  @ApiOperation({ summary: '获取全局实时操作日志' })
  async getLogs() {
    return this.adminService.getGlobalLogs();
  }

  @Get('quest-list')
  @ApiOperation({ summary: '获取所有任务列表' })
  async getQuests() {
    return this.prisma.task.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  @Get('quest-stats')
  @ApiOperation({ summary: '获取任务系统全局统计数据' })
  async getQuestStats() {
    return this.adminService.getQuestStats();
  }

  @Get('user-audit/:id')
  @ApiOperation({ summary: '获取特定用户的资产与行为审计' })
  async getUserAudit(@Param('id') id: string) {
    return this.adminService.getUserAudit(id);
  }

  @Post('user/update-pts')
  @ApiOperation({ summary: '手动调整用户积分' })
  async updatePts(@Body() data: { userId: string, amount: number, reason: string }) {
    const updatedUser = await this.adminService.updateUserPts(data.userId, data.amount, data.reason);
    this.eventsGateway.emitBalanceUpdate(data.userId, updatedUser.pts);
    return updatedUser;
  }

  @Post('user/reset-combo')
  @ApiOperation({ summary: '手动重置用户连击状态' })
  async resetCombo(@Body() data: { userId: string }) {
    return this.adminService.resetUserCombo(data.userId);
  }

  @Delete('user/:id')
  @ApiOperation({ summary: '删除用户（彻底抹除）' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('agent/tune/:id')
  @ApiOperation({ summary: '调整 AI 机器人参数' })
  async updateAgent(@Param('id') id: string, @Body() data: { 
    winRate?: number,
    difficultyBias?: number,
    aggressiveness?: number,
    trapFrequency?: number,
    isActive?: boolean,
    personality?: string
  }) {
    return this.adminService.updateAgentConfig(id, data);
  }

  @Get('agents/configs')
  @ApiOperation({ summary: '获取所有 AI Agent 详细配置' })
  async getAgentConfigs() {
    return this.adminService.getAgentConfigs();
  }

  @Post('market/create')
  @ApiOperation({ summary: '手动创建预测市场' })
  async createMarket(@Body() data: { category: string, timeframe: string, title: string, duration: number }) {
    return this.adminService.createMarket(data.category, data.timeframe, data.title, data.duration);
  }

  @Post('market/resolve/:id')
  @ApiOperation({ summary: '强制结算预测市场' })
  async resolveMarket(@Param('id') id: string) {
    return this.marketService.resolveMarket(id);
  }

  @Post('quest/delete')
  @ApiOperation({ summary: '删除任务' })
  async deleteQuest(@Body() data: { id: string }) {
    await this.adminService.deleteQuest(data.id);
    this.eventsGateway.broadcastSystemMessage('QUEST_UPDATE', 'Quests modified');
    return { success: true };
  }

  @Post('quest/update')
  @ApiOperation({ summary: '更新任务' })
  async updateQuest(@Body() data: { id: string, title?: string, description?: string, reward?: number, type?: string, goal?: number, isDaily?: boolean }) {
    const quest = await this.adminService.updateQuest(data.id, data);
    this.eventsGateway.broadcastSystemMessage('QUEST_UPDATE', 'Quests modified');
    return quest;
  }

  @Post('quest/deploy')
  @ApiOperation({ summary: '创建新任务' })
  async createQuest(@Body() data: { id: string, title: string, description: string, reward: number, type: string, goal: number, isDaily?: boolean }) {
    const quest = await this.adminService.createQuest(data);
    this.eventsGateway.broadcastSystemMessage('QUEST_UPDATE', 'New quest deployed');
    return quest;
  }

  @Post('quest/reset-daily')
  @ApiOperation({ summary: '立即重置每日任务进度（与每日 0 点定时逻辑一致）' })
  async resetDailyQuests() {
    const result = await this.questService.resetDailyTasks();
    this.eventsGateway.broadcastSystemMessage('QUEST_UPDATE', 'Daily tasks reset');
    return { success: true, ...result };
  }

  @Post('system/broadcast')
  @ApiOperation({ summary: '发送全服系统广播' })
  async broadcast(@Body() data: { type: string, message: string }) {
    this.eventsGateway.broadcastSystemMessage(data.type, data.message);
    return { success: true };
  }

  @Get('vault/history')
  async getVaultHistory(@Query('limit') limit: number = 20) {
    return this.adminService.getGlobalVaultHistory(Number(limit));
  }

  @Get('vault/stats')
  async getVaultStats() {
    const stats = await this.adminService.getDashboardStats();
    return stats.economy;
  }

  @Get('users')
  @ApiOperation({ summary: '获取所有用户列表' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('system/online-users')
  async getOnlineUsers() {
    const onlineIds = this.eventsGateway.getOnlineUserIds();
    return this.adminService.getUsersByIds(onlineIds);
  }

  // --- RPC 节点管理 ---
  @Get('system/rpc-nodes')
  @ApiOperation({ summary: '获取 RPC 节点配置' })
  async getRpcNodes() {
    return this.adminService.getRpcNodes();
  }

  @Post('system/rpc-nodes')
  @ApiOperation({ summary: '更新 RPC 节点配置' })
  async updateRpcNodes(@Body() data: { nodes: { url: string; name: string; priority: number; enabled: boolean }[] }) {
    return this.adminService.updateRpcNodes(data.nodes);
  }

  @Post('system/rpc-nodes/add')
  @ApiOperation({ summary: '添加单个 RPC 节点' })
  async addRpcNode(@Body() data: { url: string; name: string; priority?: number }) {
    return this.adminService.addRpcNode(data);
  }

  @Post('system/rpc-nodes/delete')
  @ApiOperation({ summary: '删除 RPC 节点' })
  async deleteRpcNode(@Body() data: { url: string }) {
    return this.adminService.deleteRpcNode(data.url);
  }

  @Post('system/rpc-nodes/test')
  @ApiOperation({ summary: '测试 RPC 节点连接' })
  async testRpcNode(@Body() data: { url: string }) {
    return this.adminService.testRpcNode(data.url);
  }

  @Post('system/rpc-nodes/refresh')
  @ApiOperation({ summary: '刷新 RPC 节点配置（使 IndexService 重新加载）' })
  async refreshRpcNodes() {
    return this.indexService.refreshRpcProviders();
  }

  // ==========================================
  // 功能开关管理 API
  // ==========================================

  @Get('system/feature-flags')
  @ApiOperation({ summary: '获取所有功能开关状态' })
  async getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }

  @Get('system/feature-flags/:feature')
  @ApiOperation({ summary: '获取单个功能开关状态' })
  async getFeatureFlag(@Param('feature') feature: string) {
    const enabled = await this.adminService.getFeatureFlag(feature);
    return { feature, enabled };
  }

  @Post('system/feature-flags/:feature')
  @ApiOperation({ summary: '更新单个功能开关' })
  async updateFeatureFlag(
    @Param('feature') feature: string,
    @Body() data: { enabled: boolean }
  ) {
    const result = await this.adminService.updateFeatureFlag(feature, data.enabled);
    this.eventsGateway.broadcastSystemMessage('FEATURE_FLAG_UPDATE', `${feature}:${data.enabled}`);
    return result;
  }

  @Post('system/feature-flags')
  @ApiOperation({ summary: '批量更新功能开关' })
  async updateFeatureFlags(@Body() data: { flags: Record<string, boolean> }) {
    const result = await this.adminService.updateFeatureFlags(data.flags);
    this.eventsGateway.broadcastSystemMessage('FEATURE_FLAG_UPDATE', 'batch');
    return result;
  }
}
