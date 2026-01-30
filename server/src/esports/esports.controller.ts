import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { EsportsService } from './esports.service';

@ApiTags('Esports')
@Controller('esports')
export class EsportsController {
  private readonly logger = new Logger(EsportsController.name);

  constructor(private readonly esportsService: EsportsService) {}

  /**
   * 获取所有比赛列表
   */
  @Get('matches')
  @ApiOperation({ summary: '获取电竞比赛列表' })
  @ApiQuery({ name: 'game', required: false, description: '游戏类型: LOL, DOTA2, CS2' })
  @ApiQuery({ name: 'status', required: false, description: '比赛状态: UPCOMING, LIVE, FINISHED' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  async getMatches(
    @Query('game') game?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const matches = await this.esportsService.getMatches({
        game: game?.toUpperCase(),
        status: status?.toUpperCase(),
        limit: limit ? parseInt(limit) : undefined,
      });
      
      return {
        success: true,
        data: matches,
        total: matches.length,
      };
    } catch (error) {
      this.logger.error('Failed to get matches', error);
      throw new HttpException(
        'Failed to fetch matches',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取热门比赛
   */
  @Get('matches/hot')
  @ApiOperation({ summary: '获取热门比赛（按下注量排序）' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制，默认5' })
  async getHotMatches(@Query('limit') limit?: string) {
    try {
      const matches = await this.esportsService.getHotMatches(
        limit ? parseInt(limit) : 5,
      );
      
      return {
        success: true,
        data: matches,
      };
    } catch (error) {
      this.logger.error('Failed to get hot matches', error);
      throw new HttpException(
        'Failed to fetch hot matches',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取单场比赛详情
   */
  @Get('matches/:id')
  @ApiOperation({ summary: '获取比赛详情' })
  @ApiParam({ name: 'id', description: '比赛 ID' })
  async getMatch(@Param('id') id: string) {
    try {
      const match = await this.esportsService.getMatchById(id);
      
      if (!match) {
        throw new HttpException('Match not found', HttpStatus.NOT_FOUND);
      }
      
      return {
        success: true,
        data: match,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      this.logger.error('Failed to get match', error);
      throw new HttpException(
        'Failed to fetch match',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 下注
   */
  @Post('bet')
  @ApiOperation({ summary: '电竞下注' })
  async placeBet(
    @Body()
    body: {
      userId: string;
      matchId: string;
      prediction: 'HOME' | 'AWAY';
      amount: number;
    },
  ) {
    try {
      const { userId, matchId, prediction, amount } = body;
      
      if (!userId || !matchId || !prediction || !amount) {
        throw new HttpException(
          'Missing required fields',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      if (amount <= 0) {
        throw new HttpException(
          'Amount must be positive',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      const bet = await this.esportsService.placeBet(
        userId,
        matchId,
        prediction,
        amount,
      );
      
      return {
        success: true,
        data: bet,
        message: 'Bet placed successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      this.logger.error('Failed to place bet', error);
      throw new HttpException(
        error.message || 'Failed to place bet',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取用户下注历史
   */
  @Get('bets/:userId')
  @ApiOperation({ summary: '获取用户电竞下注历史' })
  @ApiParam({ name: 'userId', description: '用户 ID' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  async getUserBets(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const bets = await this.esportsService.getUserBets(
        userId,
        limit ? parseInt(limit) : 20,
      );
      
      return {
        success: true,
        data: bets,
      };
    } catch (error) {
      this.logger.error('Failed to get user bets', error);
      throw new HttpException(
        'Failed to fetch user bets',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 手动同步比赛数据（管理员接口）
   */
  @Post('sync')
  @ApiOperation({ summary: '手动同步电竞比赛数据' })
  async syncMatches() {
    try {
      await this.esportsService.syncAllMatches();
      
      return {
        success: true,
        message: 'Matches synced successfully',
      };
    } catch (error) {
      this.logger.error('Failed to sync matches', error);
      throw new HttpException(
        'Failed to sync matches',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取游戏统计
   */
  @Get('stats')
  @ApiOperation({ summary: '获取电竞统计数据' })
  async getStats() {
    try {
      const [lolMatches, dota2Matches, cs2Matches] = await Promise.all([
        this.esportsService.getMatches({ game: 'LOL' }),
        this.esportsService.getMatches({ game: 'DOTA2' }),
        this.esportsService.getMatches({ game: 'CS2' }),
      ]);
      
      return {
        success: true,
        data: {
          lol: {
            total: lolMatches.length,
            live: lolMatches.filter(m => m.status === 'LIVE').length,
          },
          dota2: {
            total: dota2Matches.length,
            live: dota2Matches.filter(m => m.status === 'LIVE').length,
          },
          cs2: {
            total: cs2Matches.length,
            live: cs2Matches.filter(m => m.status === 'LIVE').length,
          },
        },
      };
    } catch (error) {
      this.logger.error('Failed to get stats', error);
      throw new HttpException(
        'Failed to fetch stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
