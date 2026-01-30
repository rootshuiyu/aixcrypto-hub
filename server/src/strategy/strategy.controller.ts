import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('strategy')
@Controller('strategy')
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  @Get('presets')
  @ApiOperation({ summary: '获取预设策略列表' })
  getPresetStrategies() {
    return this.strategyService.getPresetStrategies();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '获取用户自定义策略' })
  getUserStrategies(@Param('userId') userId: string) {
    return this.strategyService.getUserStrategies(userId);
  }

  @Post('user/:userId')
  @ApiOperation({ summary: '保存用户策略' })
  saveUserStrategy(
    @Param('userId') userId: string,
    @Body() body: {
      name: string;
      riskLevel?: string;
      trendFollowing?: boolean;
      volatilityPref?: string;
      holdDuration?: string;
      maxBetPercent?: number;
      stopLoss?: number;
      takeProfit?: number;
    }
  ) {
    return this.strategyService.saveUserStrategy(userId, body);
  }

  @Delete('user/:userId/:strategyId')
  @ApiOperation({ summary: '删除用户策略' })
  deleteUserStrategy(
    @Param('userId') userId: string,
    @Param('strategyId') strategyId: string
  ) {
    return this.strategyService.deleteUserStrategy(userId, strategyId);
  }

  @Post('suggest')
  @ApiOperation({ summary: '根据策略生成 AI 交易建议' })
  generateSuggestion(
    @Body() body: { userId: string; marketId: string; strategyId?: string; language?: string }
  ) {
    return this.strategyService.generateSuggestion(
      body.userId,
      body.marketId,
      body.strategyId,
      body.language
    );
  }

  @Post('suggest-with-model')
  @ApiOperation({ summary: '使用指定 AI 模型生成交易建议' })
  generateSuggestionWithModel(
    @Body() body: { 
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
    }
  ) {
    return this.strategyService.generateSuggestionWithModel(
      body.userId,
      body.marketId,
      body.strategyId,
      body.modelId,
      body.language,
      body.customConfig
    );
  }

  @Post('follow')
  @ApiOperation({ summary: '跟随 AI 建议下单' })
  followSuggestion(
    @Body() body: { userId: string; suggestionId: string }
  ) {
    return this.strategyService.followSuggestion(body.userId, body.suggestionId);
  }

  @Get('history/:userId')
  @ApiOperation({ summary: '获取 AI 建议历史' })
  getSuggestionHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: number
  ) {
    return this.strategyService.getSuggestionHistory(userId, limit || 20);
  }
}

