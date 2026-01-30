import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MarketService } from './market.service';
import { IndexService } from './index.service';
import { BacktestService } from './backtest.service';
import { MarketCalendarService } from './market-calendar.service';
import { AIService } from '../ai/ai.service';
import { MarketOutcome } from '@prisma/client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('market')
@Controller('market')
export class MarketController {
  constructor(
    private readonly marketService: MarketService,
    private readonly indexService: IndexService,
    private readonly backtestService: BacktestService,
    private readonly aiService: AIService,
    private readonly marketCalendarService: MarketCalendarService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取所有预测市场' })
  findAll() {
    return this.marketService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: '获取首页公开统计数据' })
  getPublicStats() {
    return this.marketService.getPublicStats();
  }

  @Get('history')
  @ApiOperation({ summary: '获取已结算的市场历史' })
  findHistory(
    @Query('category') category: string,
    @Query('timeframe') timeframe: string,
    @Query('limit') limit: number = 10
  ) {
    return this.marketService.findResolved(category, timeframe, Number(limit));
  }

  @Get('index/history')
  @ApiOperation({ summary: '获取指数历史数据' })
  getIndexHistory(
    @Query('type') type: string = 'C10',
    @Query('limit') limit: number = 20
  ) {
    return this.indexService.getHistory(type, Number(limit));
  }

  @Get('index/components')
  @ApiOperation({ summary: '获取 C10 指数实时成分股' })
  getIndexComponents() {
    return this.indexService.getComponents();
  }

  @Get('index/gold-components')
  @ApiOperation({ summary: '获取黄金市场实时盘口数据' })
  getGoldComponents() {
    return this.indexService.getGoldComponents();
  }

  @Post('index/reset')
  @ApiOperation({ summary: '重置指数历史数据' })
  resetIndexHistory() {
    return this.indexService.resetHistory();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取市场详情' })
  findOne(@Param('id') id: string) {
    return this.marketService.findOne(id);
  }

  @Get(':id/odds')
  @ApiOperation({ summary: '获取市场赔率和资金池信息' })
  getMarketOdds(@Param('id') id: string) {
    return this.marketService.getMarketOdds(id);
  }

  @Get(':id/snapshots')
  @ApiOperation({ summary: '获取市场快照和复盘数据' })
  getMarketSnapshots(@Param('id') id: string) {
    return this.marketService.getMarketSnapshots(id);
  }

  @Get(':id/backtest-stats')
  @ApiOperation({ summary: '获取市场历史回测胜率' })
  getBacktestStats(@Param('id') id: string) {
    return this.backtestService.getMarketBacktestStats(id);
  }

  @Get(':id/recent-bets')
  @ApiOperation({ summary: '获取市场的最近下注记录' })
  findRecentBets(
    @Param('id') marketId: string,
    @Query('limit') limit: number = 10
  ) {
    return this.marketService.findRecentBets(marketId, Number(limit));
  }

  @Post(':id/bet')
  @ApiOperation({ summary: '下注' })
  placeBet(
    @Param('id') marketId: string,
    @Body() body: { userId: string, position: MarketOutcome, amount: number }
  ) {
    return this.marketService.placeBet(
      marketId, 
      body.userId, 
      body.position, 
      body.amount
    );
  }

  @Get(':id/ai-analysis')
  @ApiOperation({ summary: '获取 AI 行情建议 (RAG 增强)' })
  async getAiAnalysis(
    @Param('id') marketId: string,
    @Query('lang') language: string = 'en'
  ) {
    // 使用 RAG AI 服务获取增强分析
    return this.aiService.analyzeMarket(marketId, language);
  }

  @Get(':id/ai-analysis/simple')
  @ApiOperation({ summary: '获取简单 AI 分析 (本地算法)' })
  getSimpleAnalysis(@Param('id') marketId: string) {
    return this.marketService.getAiAnalysis(marketId);
  }

  // ==================== 市场日历 API ====================

  @Get('calendar/status')
  @ApiOperation({ summary: '获取所有市场开市/休市状态' })
  getMarketsStatus() {
    return this.marketCalendarService.getAllMarketsStatus();
  }

  @Get('calendar/gold')
  @ApiOperation({ summary: '获取黄金市场状态详情' })
  getGoldMarketStatus() {
    return this.marketCalendarService.getGoldMarketStatus();
  }

  @Get('calendar/:market/countdown')
  @ApiOperation({ summary: '获取市场开/休市倒计时' })
  getMarketCountdown(@Param('market') market: 'GOLD' | 'C10') {
    return this.marketCalendarService.getCountdown(market);
  }
}
