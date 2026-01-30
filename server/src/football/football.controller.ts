import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { FootballService } from './football.service';

@Controller('api/football')
export class FootballController {
  constructor(private readonly footballService: FootballService) {}

  /**
   * 获取足球比赛列表
   */
  @Get('matches')
  async getMatches(
    @Query('league') league?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const matches = await this.footballService.getMatches({
      league: league ? parseInt(league) : undefined,
      status,
      limit: limit ? parseInt(limit) : 20,
    });

    return {
      success: true,
      data: matches,
      count: matches.length,
    };
  }

  /**
   * 获取正在进行的比赛
   */
  @Get('live')
  async getLiveMatches() {
    const matches = await this.footballService.getLiveMatches();

    return {
      success: true,
      data: matches,
      count: matches.length,
    };
  }

  /**
   * 获取热门比赛
   */
  @Get('hot')
  async getHotMatches(@Query('limit') limit?: string) {
    const matches = await this.footballService.getHotMatches(
      limit ? parseInt(limit) : 5,
    );

    return {
      success: true,
      data: matches,
      count: matches.length,
    };
  }

  /**
   * 获取比赛赔率
   */
  @Get('odds/:fixtureId')
  async getOdds(@Param('fixtureId') fixtureId: string) {
    const odds = await this.footballService.getOdds(parseInt(fixtureId));

    return {
      success: true,
      data: odds,
    };
  }

  /**
   * 获取热门联赛列表
   */
  @Get('leagues')
  async getLeagues() {
    const leagues = this.footballService.getPopularLeagues();

    return {
      success: true,
      data: leagues,
    };
  }

  /**
   * 足球下注
   */
  @Post('bet')
  async placeBet(
    @Body() body: { userId: string; matchId: string; prediction: 'HOME' | 'DRAW' | 'AWAY'; amount: number }
  ) {
    return this.footballService.placeBet(body);
  }

  /**
   * 手动同步比赛数据
   */
  @Get('sync')
  async syncMatches() {
    await this.footballService.syncMatches();

    return {
      success: true,
      message: 'Football matches sync initiated',
    };
  }
}
