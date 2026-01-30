import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReferralService } from './referral.service';

@ApiTags('referral')
@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('stats/:userId')
  @ApiOperation({ summary: '获取用户推荐统计数据' })
  @ApiParam({ name: 'userId', description: '用户 ID' })
  async getStats(@Param('userId') userId: string) {
    return this.referralService.getReferralStats(userId);
  }

  @Get('list/:userId')
  @ApiOperation({ summary: '获取用户推荐的用户列表' })
  @ApiParam({ name: 'userId', description: '用户 ID' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认 1' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认 20' })
  async getList(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.referralService.getReferralList(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Get('rewards/:userId')
  @ApiOperation({ summary: '获取用户推荐奖励明细' })
  @ApiParam({ name: 'userId', description: '用户 ID' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认 1' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认 20' })
  async getRewards(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.referralService.getRewardHistory(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }
}
