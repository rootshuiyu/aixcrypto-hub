import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SeasonService } from './season.service';
import { TournamentService } from './tournament.service';
import { SpectateService } from './spectate.service';
import { AdminTokenGuard } from '../auth/guards/admin-token.guard';

@ApiTags('season')
@Controller('season')
export class SeasonController {
  constructor(
    private readonly seasonService: SeasonService,
    private readonly tournamentService: TournamentService,
    private readonly spectateService: SpectateService,
  ) {}

  // ==================== 赛季相关 ====================

  @Get('active')
  @ApiOperation({ summary: '获取当前活跃赛季' })
  @ApiQuery({ name: 'type', required: false, description: 'WEEKLY 或 MONTHLY' })
  async getActiveSeason(@Query('type') type?: string) {
    return this.seasonService.getActiveSeason(type);
  }

  @Get('list')
  @ApiOperation({ summary: '获取赛季列表' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getSeasonList(
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    return this.seasonService.getAllSeasons(type, limit ? parseInt(limit) : 10);
  }

  @Get(':seasonId/leaderboard')
  @ApiOperation({ summary: '获取赛季排行榜' })
  @ApiQuery({ name: 'limit', required: false })
  async getSeasonLeaderboard(
    @Param('seasonId') seasonId: string,
    @Query('limit') limit?: string,
  ) {
    return this.seasonService.getSeasonLeaderboard(seasonId, limit ? parseInt(limit) : 50);
  }

  @Post(':seasonId/claim-reward')
  @ApiOperation({ summary: '领取赛季奖励' })
  @ApiBody({ schema: { type: 'object', properties: { userId: { type: 'string' } } } })
  async claimSeasonReward(
    @Param('seasonId') seasonId: string,
    @Body() body: { userId: string },
  ) {
    return this.seasonService.claimSeasonReward(body.userId, seasonId);
  }

  // ==================== 锦标赛相关 ====================

  @Get('tournaments')
  @ApiOperation({ summary: '获取活跃锦标赛列表' })
  async getActiveTournaments() {
    return this.tournamentService.getActiveTournaments();
  }

  @Get('tournaments/:id')
  @ApiOperation({ summary: '获取锦标赛详情' })
  async getTournamentById(@Param('id') id: string) {
    return this.tournamentService.getTournamentById(id);
  }

  @Get('tournaments/:id/leaderboard')
  @ApiOperation({ summary: '获取锦标赛排行榜' })
  @ApiQuery({ name: 'limit', required: false })
  async getTournamentLeaderboard(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.tournamentService.getTournamentLeaderboard(id, limit ? parseInt(limit) : 50);
  }

  @Post('tournaments/:id/join')
  @ApiOperation({ summary: '报名参加锦标赛' })
  @ApiBody({ schema: { type: 'object', properties: { userId: { type: 'string' } } } })
  async joinTournament(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.tournamentService.joinTournament(body.userId, id);
  }

  @Post('tournaments/:id/claim-reward')
  @ApiOperation({ summary: '领取锦标赛奖励' })
  @ApiBody({ schema: { type: 'object', properties: { userId: { type: 'string' } } } })
  async claimTournamentReward(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.tournamentService.claimTournamentReward(body.userId, id);
  }

  // ==================== 观战相关 ====================

  @Get('live-battles')
  @ApiOperation({ summary: '获取实时对战列表（可观战）' })
  async getLiveBattles() {
    return this.spectateService.getLiveBattles();
  }

  @Get('highlights')
  @ApiOperation({ summary: '获取精彩对战回放' })
  @ApiQuery({ name: 'limit', required: false })
  async getHighlights(@Query('limit') limit?: string) {
    return this.spectateService.getRecentHighlights(limit ? parseInt(limit) : 20);
  }

  @Get('battle-replay/:id')
  @ApiOperation({ summary: '获取对战详情回放' })
  async getBattleReplay(@Param('id') id: string) {
    return this.spectateService.getBattleReplay(id);
  }

  @Post('spectate/:battleId/join')
  @ApiOperation({ summary: '加入观战' })
  @ApiBody({ schema: { type: 'object', properties: { userId: { type: 'string' } } } })
  async joinSpectate(
    @Param('battleId') battleId: string,
    @Body() body: { userId: string },
  ) {
    return this.spectateService.joinSpectate(battleId, body.userId);
  }

  @Post('spectate/:battleId/leave')
  @ApiOperation({ summary: '离开观战' })
  @ApiBody({ schema: { type: 'object', properties: { userId: { type: 'string' } } } })
  async leaveSpectate(
    @Param('battleId') battleId: string,
    @Body() body: { userId: string },
  ) {
    this.spectateService.leaveSpectate(battleId, body.userId);
    return { success: true };
  }

  @Post('battle/:battleId/toggle-visibility')
  @ApiOperation({ summary: '切换对战公开状态' })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: { 
      userId: { type: 'string' },
      isPublic: { type: 'boolean' }
    } 
  }})
  async toggleBattleVisibility(
    @Param('battleId') battleId: string,
    @Body() body: { userId: string, isPublic: boolean },
  ) {
    return this.spectateService.toggleBattleVisibility(battleId, body.userId, body.isPublic);
  }

  // ==================== 管理员 API ====================

  @Post('admin/create')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '[管理员] 创建赛季' })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: { 
      name: { type: 'string' },
      description: { type: 'string' },
      startDate: { type: 'string' },
      endDate: { type: 'string' },
      rewards: { type: 'object' }
    } 
  }})
  async createSeason(
    @Body() body: { name: string; description?: string; startDate: string; endDate: string; rewards?: any },
  ) {
    return this.seasonService.createSeason(body);
  }

  @Put('admin/:id')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '[管理员] 更新赛季' })
  async updateSeason(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; startDate?: string; endDate?: string },
  ) {
    return this.seasonService.updateSeason(id, body);
  }

  @Delete('admin/:id')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '[管理员] 删除赛季' })
  async deleteSeason(@Param('id') id: string) {
    return this.seasonService.deleteSeason(id);
  }

  @Post('admin/:id/end')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '[管理员] 结束赛季' })
  async endSeason(@Param('id') id: string) {
    return this.seasonService.endSeason(id);
  }

  @Post('admin/tournament/create')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '[管理员] 创建锦标赛' })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: { 
      name: { type: 'string' },
      description: { type: 'string' },
      startDate: { type: 'string' },
      endDate: { type: 'string' },
      entryFee: { type: 'number' },
      prizePool: { type: 'number' },
      maxParticipants: { type: 'number' }
    } 
  }})
  async createTournament(
    @Body() body: { 
      name: string; 
      description?: string; 
      startDate: string; 
      endDate: string; 
      entryFee?: number;
      prizePool?: number;
      maxParticipants?: number;
    },
  ) {
    return this.tournamentService.createTournament(body);
  }

  @Put('admin/tournament/:id')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '[管理员] 更新锦标赛' })
  async updateTournament(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.tournamentService.updateTournament(id, body);
  }

  @Delete('admin/tournament/:id')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '[管理员] 删除锦标赛' })
  async deleteTournament(@Param('id') id: string) {
    return this.tournamentService.deleteTournament(id);
  }

  @Post('admin/tournament/:id/end')
  @UseGuards(AdminTokenGuard)
  @ApiOperation({ summary: '[管理员] 结束锦标赛' })
  async endTournament(@Param('id') id: string) {
    return this.tournamentService.endTournament(id);
  }
}
