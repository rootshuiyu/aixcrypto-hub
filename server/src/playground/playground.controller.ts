import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { PlaygroundService } from './playground.service';
import { MarketOutcome } from '@prisma/client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('playground')
@Controller('playground')
export class PlaygroundController {
  private readonly logger = new Logger(PlaygroundController.name);

  constructor(private readonly playgroundService: PlaygroundService) {}

  @Get('agents')
  @ApiOperation({ summary: '获取所有 AI 代理' })
  getAgents(@Query('userId') userId?: string) {
    return this.playgroundService.getAgents(userId);
  }

  @Post('battle')
  @ApiOperation({ summary: '开始一场 AI 对战' })
  async startBattle(
    @Body() body: { userId: string, agentId: string, userPick: MarketOutcome, language?: string, amount?: number }
  ) {
    try {
      return await this.playgroundService.startBattle(body.userId, body.agentId, body.userPick, body.language, body.amount);
    } catch (error) {
      this.logger.error(`[BATTLE_ERROR] ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('recent/:userId')
  @ApiOperation({ summary: '获取用户最近的对战记录' })
  getRecentBattles(
    @Param('userId') userId: string,
    @Query('limit') limit?: string
  ) {
    return this.playgroundService.getRecentBattles(userId, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('stats/:userId')
  @ApiOperation({ summary: '获取用户 Battle 统计（对战胜率、净盈亏、ROI）' })
  getBattleStats(@Param('userId') userId: string) {
    return this.playgroundService.getBattleStats(userId);
  }
}












