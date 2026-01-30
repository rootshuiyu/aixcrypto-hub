import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { FootballLiveService } from './football-live.service';
import { FootballEvent } from './types/football-live.types';

/**
 * 足球直播 API 控制器
 * 用于管理和查询直播状态、事件等
 */
@Controller('api/football/live')
export class FootballLiveController {
  constructor(private readonly footballLiveService: FootballLiveService) {}

  /**
   * 获取所有当前直播的比赛 ID
   */
  @Get('matches')
  getAllLiveMatches() {
    const matches = this.footballLiveService.getAllLiveMatches();
    return {
      success: true,
      data: matches,
      count: matches.length,
    };
  }

  /**
   * 检查特定比赛是否在直播中
   */
  @Get('matches/:matchId/status')
  checkMatchLiveStatus(@Param('matchId') matchId: string) {
    const isLive = this.footballLiveService.isMatchLive(matchId);
    return {
      success: true,
      data: {
        matchId,
        isLive,
      },
    };
  }

  /**
   * 注册一场比赛为直播（手动触发）
   */
  @Post('matches/:matchId/register')
  registerLiveMatch(@Param('matchId') matchId: string) {
    this.footballLiveService.registerLiveMatch(matchId);
    return {
      success: true,
      message: `Match ${matchId} registered for live updates`,
    };
  }

  /**
   * 注销一场比赛的直播
   */
  @Post('matches/:matchId/unregister')
  unregisterLiveMatch(@Param('matchId') matchId: string) {
    this.footballLiveService.unregisterLiveMatch(matchId);
    return {
      success: true,
      message: `Match ${matchId} unregistered from live updates`,
    };
  }

  /**
   * 获取比赛的所有事件
   */
  @Get('matches/:matchId/events')
  getMatchEvents(@Param('matchId') matchId: string) {
    const events = this.footballLiveService.getMatchEvents(matchId);
    return {
      success: true,
      data: events,
      count: events.length,
    };
  }

  /**
   * 手动添加事件（用于管理员或 webhook 集成）
   */
  @Post('matches/:matchId/events')
  addEvent(
    @Param('matchId') matchId: string,
    @Body()
    event: {
      type: string;
      minute: number;
      team: 'HOME' | 'AWAY';
      player: { name: string; id?: number };
      detail?: string;
      relatedPlayer?: { name: string; id?: number };
    },
  ) {
    // 从 matchId 提取 fixtureId
    const fixtureId = parseInt(matchId.split('-')[1]);

    this.footballLiveService.addEvent(matchId, {
      ...event,
      matchId,
      fixtureId,
      timestamp: new Date(),
      type: event.type as any,
    });

    return {
      success: true,
      message: `Event added for match ${matchId}`,
    };
  }

  /**
   * 清除比赛的事件缓存（比赛结束时）
   */
  @Post('matches/:matchId/events/clear')
  clearMatchEvents(@Param('matchId') matchId: string) {
    this.footballLiveService.clearMatchEvents(matchId);
    return {
      success: true,
      message: `Events cleared for match ${matchId}`,
    };
  }
}
