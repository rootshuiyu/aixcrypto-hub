import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AIService } from '../ai/ai.service';
import { MarketOutcome } from '@prisma/client';
import { QuestService } from '../quest/quest.service';
import { EventsGateway } from '../events/events.gateway';

export interface StrategyConfig {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  trendFollowing: boolean;
  volatilityPref: 'LOW' | 'NORMAL' | 'HIGH';
  holdDuration: '10M' | '30M' | '1H' | '12H' | '24H';
  maxBetPercent: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface AISuggestionResult {
  suggestion: 'YES' | 'NO';
  confidence: number;
  reasoning: string;
  recommendedAmount: number;
  riskWarning?: string;
  signals?: string[];
  technicalData?: any;
}

@Injectable()
export class StrategyService {
  private readonly logger = new Logger(StrategyService.name);

  // 预设策略模板
  private readonly presetStrategies: Record<string, StrategyConfig> = {
    'conservative': {
      riskLevel: 'LOW',
      trendFollowing: true,
      volatilityPref: 'LOW',
      holdDuration: '1H',
      maxBetPercent: 5,
      stopLoss: 10,
      takeProfit: 15,
    },
    'balanced': {
      riskLevel: 'MEDIUM',
      trendFollowing: true,
      volatilityPref: 'NORMAL',
      holdDuration: '30M',
      maxBetPercent: 10,
      stopLoss: 20,
      takeProfit: 30,
    },
    'aggressive': {
      riskLevel: 'HIGH',
      trendFollowing: false,
      volatilityPref: 'HIGH',
      holdDuration: '10M',
      maxBetPercent: 20,
      stopLoss: 30,
      takeProfit: 50,
    },
    'whale': {
      riskLevel: 'EXTREME',
      trendFollowing: false,
      volatilityPref: 'HIGH',
      holdDuration: '10M',
      maxBetPercent: 50,
    },
  };

  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
    @Inject(forwardRef(() => QuestService))
    private questService: QuestService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * 获取预设策略列表
   */
  getPresetStrategies() {
    return Object.entries(this.presetStrategies).map(([key, config]) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      ...config,
    }));
  }

  /**
   * 获取用户的自定义策略列表
   */
  async getUserStrategies(userId: string) {
    return this.prisma.userStrategy.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * 创建/更新用户策略
   */
  async saveUserStrategy(userId: string, data: {
    name: string;
    riskLevel?: string;
    trendFollowing?: boolean;
    volatilityPref?: string;
    holdDuration?: string;
    maxBetPercent?: number;
    stopLoss?: number;
    takeProfit?: number;
  }) {
    return this.prisma.userStrategy.upsert({
      where: { userId_name: { userId, name: data.name } },
      create: {
        userId,
        name: data.name,
        riskLevel: data.riskLevel || 'MEDIUM',
        trendFollowing: data.trendFollowing ?? true,
        volatilityPref: data.volatilityPref || 'NORMAL',
        holdDuration: data.holdDuration || '1H',
        maxBetPercent: data.maxBetPercent || 10,
        stopLoss: data.stopLoss,
        takeProfit: data.takeProfit,
      },
      update: {
        riskLevel: data.riskLevel,
        trendFollowing: data.trendFollowing,
        volatilityPref: data.volatilityPref,
        holdDuration: data.holdDuration,
        maxBetPercent: data.maxBetPercent,
        stopLoss: data.stopLoss,
        takeProfit: data.takeProfit,
      },
    });
  }

  /**
   * 删除用户策略
   */
  async deleteUserStrategy(userId: string, strategyId: string) {
    const strategy = await this.prisma.userStrategy.findUnique({
      where: { id: strategyId },
    });
    if (!strategy || strategy.userId !== userId) {
      throw new NotFoundException('Strategy not found');
    }
    return this.prisma.userStrategy.delete({ where: { id: strategyId } });
  }

  /**
   * 根据策略生成 AI 建议
   */
  async generateSuggestion(
    userId: string,
    marketId: string,
    strategyId?: string, // 可以是预设策略 key 或 用户策略 ID
    language: string = 'en',
  ): Promise<AISuggestionResult> {
    // 获取用户信息
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // 获取策略配置
    let strategy: StrategyConfig;
    let strategyName = 'balanced';

    if (strategyId && this.presetStrategies[strategyId]) {
      // 使用预设策略
      strategy = this.presetStrategies[strategyId];
      strategyName = strategyId;
    } else if (strategyId) {
      // 使用用户自定义策略
      const userStrategy = await this.prisma.userStrategy.findUnique({
        where: { id: strategyId },
      });
      if (userStrategy) {
        strategy = {
          riskLevel: userStrategy.riskLevel as any,
          trendFollowing: userStrategy.trendFollowing,
          volatilityPref: userStrategy.volatilityPref as any,
          holdDuration: userStrategy.holdDuration as any,
          maxBetPercent: userStrategy.maxBetPercent,
          stopLoss: userStrategy.stopLoss || undefined,
          takeProfit: userStrategy.takeProfit || undefined,
        };
        strategyName = userStrategy.name;
      } else {
        strategy = this.presetStrategies['balanced'];
      }
    } else {
      strategy = this.presetStrategies['balanced'];
    }

    // 获取市场上下文
    const context = await this.aiService.getMarketContext(marketId);

    // 根据策略参数调整 AI 建议
    let suggestion: MarketOutcome;
    let confidence: number;
    let reasoning: string;

    // 3. 使用大模型生成建议 (统一逻辑)
    try {
      // 显式传入真实的 marketId 以便 AIService 获取正确的上下文
      const result = await this.callSystemModel(userId, marketId, 'deepseek', context, strategy, language);
      suggestion = result.suggestion;
      confidence = result.confidence;
      reasoning = result.reasoning;
    } catch (error) {
      this.logger.error(`AI suggestion error: ${error.message}`);
      const result = this.algorithmicAnalysis(context, strategy, language);
      suggestion = result.suggestion;
      confidence = result.confidence;
      reasoning = result.reasoning;
    }

    // 风险警告
    let riskWarning: string | undefined;
    if (strategy.riskLevel === 'EXTREME') {
      riskWarning = language === 'zh-TW' ? '⚠️ 極端風險策略，請謹慎操作' : '⚠️ Extreme risk strategy, please operate with caution';
    } else if (context.volatility > 8) {
      riskWarning = language === 'zh-TW' ? '⚠️ 當前市場波動劇烈' : '⚠️ Current market volatility is high';
    }

    // 保存建议记录
    const finalReasoning = Array.isArray(reasoning) ? reasoning.join(' ') : String(reasoning);
    
    await this.prisma.aISuggestion.create({
      data: {
        userId,
        marketId,
        strategyId: strategyId || null,
        suggestion,
        confidence,
        reasoning: finalReasoning,
      },
    });

    this.logger.log(`Generated suggestion for user ${userId}: ${suggestion} (${(confidence * 100).toFixed(0)}%)`);

    // 计算推荐下注金额
    const recommendedAmount = Math.floor(user.pts * (strategy.maxBetPercent / 100));

    const response = {
      suggestion,
      confidence,
      reasoning,
      recommendedAmount,
      riskWarning,
      signals: context.signals || [],
      technicalData: context.technicalData || {
        rsi: '50.00',
        macd: '0.0000',
        bb: { upper: '0.00', lower: '0.00' }
      },
    };

    this.logger.log(`[AI_LOG] Result: ${suggestion}, Reasoning: ${reasoning.slice(0, 50)}...`);
    return response;
  }

  /**
   * 使用指定 AI 模型生成建议
   */
  async generateSuggestionWithModel(
    userId: string,
    marketId: string,
    strategyId?: string,
    modelId?: string,
    language: string = 'en',
    customConfig?: {
      name: string;
      apiKey: string;
      baseUrl: string;
      model: string;
    }
  ): Promise<AISuggestionResult> {
    this.logger.log(`[STRATEGY_API] generateSuggestionWithModel called. Lang: ${language}, Model: ${modelId}`);
    // 获取用户信息
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // 获取策略配置
    let strategy: StrategyConfig = this.presetStrategies['balanced'];
    let strategyName = 'balanced';

    if (strategyId && this.presetStrategies[strategyId]) {
      strategy = this.presetStrategies[strategyId];
      strategyName = strategyId;
    }

    // 获取市场上下文
    const context = await this.aiService.getMarketContext(marketId);

    // 3. 确定使用的模型并生成建议
    const modelName = modelId || 'deepseek';
    let suggestion: MarketOutcome;
    let confidence: number;
    let reasoning: string;

    // 情况 A: 如果是自定义模型
    if (modelId === 'custom' && customConfig?.apiKey) {
      try {
        const result = await this.callCustomModel(customConfig, context, strategy, language);
        suggestion = result.suggestion;
        confidence = result.confidence;
        reasoning = result.reasoning;
      } catch (error) {
        this.logger.error(`Custom model error: ${error.message}`);
        const fallback = this.algorithmicAnalysis(context, strategy, language);
        suggestion = fallback.suggestion;
        confidence = fallback.confidence;
        reasoning = fallback.reasoning + (language === 'zh-TW' ? ' (API調用失敗，使用算法備份)' : ' (API call failed, using algorithmic fallback)');
      }
    } 
    // 情况 B: 使用系统预设大模型 (DeepSeek, GPT-4o, etc.)
    else {
      try {
        const result = await this.callSystemModel(userId, marketId, modelName, context, strategy, language);
        suggestion = result.suggestion;
        confidence = result.confidence;
        reasoning = result.reasoning;
      } catch (error) {
        this.logger.error(`System AI model error: ${error.message}`);
        const result = this.algorithmicAnalysis(context, strategy, language);
        suggestion = result.suggestion;
        confidence = result.confidence;
        reasoning = `[${modelName.toUpperCase()} FALLBACK] ${result.reasoning}`;
      }
    }

    // 计算推荐下注金额
    const recommendedAmount = Math.floor(user.pts * (strategy.maxBetPercent / 100));

    // 风险警告
    let riskWarning: string | undefined;
    if (strategy.riskLevel === 'EXTREME') {
      riskWarning = language === 'zh-TW' ? '⚠️ 極端風險策略，請謹慎操作' : '⚠️ Extreme risk strategy, please operate with caution';
    } else if (context.volatility > 8) {
      riskWarning = language === 'zh-TW' ? '⚠️ 當前市場波動劇烈' : '⚠️ Current market volatility is high';
    }

    // 保存建议记录
    const finalReasoning = Array.isArray(reasoning) ? reasoning.join(' ') : String(reasoning);
    
    await this.prisma.aISuggestion.create({
      data: {
        userId,
        marketId,
        strategyId: strategyId || null,
        suggestion,
        confidence,
        reasoning: finalReasoning,
      },
    });

    this.logger.log(`Generated suggestion for user ${userId} with ${modelName}: ${suggestion} (${(confidence * 100).toFixed(0)}%)`);

    const response = {
      suggestion,
      confidence,
      reasoning,
      recommendedAmount,
      riskWarning,
      signals: context.signals || [],
      technicalData: context.technicalData || {
        rsi: '50.00',
        macd: '0.0000',
        bb: { upper: '0.00', lower: '0.00' }
      },
    };

    this.logger.log(`[AI_LOG] Result: ${suggestion}, Reasoning: ${reasoning.slice(0, 50)}...`);
    return response;
  }

  private algorithmicAnalysis(context: any, strategy: StrategyConfig, language: string = 'en') {
    const isBullish = context.trend === 'BULLISH';
    const isBearish = context.trend === 'BEARISH';
    const volatility = Number(context.volatility || 0.1);
    const rsi = Number(context.technicalData?.rsi || 50);
    const timeframe = context.timeframe || '10M';
    
    let suggestion: MarketOutcome;
    let confidence: number;

    // 1. [CRITICAL FIX] 横盘识别逻辑 (螃蟹行情)
    // 如果波动率极低 (< 0.1%)，不再默认看跌，而是进行随机概率对冲
    if (volatility < 0.1) {
      suggestion = Math.random() > 0.5 ? MarketOutcome.YES : MarketOutcome.NO;
      confidence = 0.45 + (Math.random() * 0.1); // 低置信度
      
      let sidewaysReason = "";
      if (language === 'zh-TW') {
        sidewaysReason = `[市場監控] 檢測到 ${context.indexType} 處於窄幅震盪（橫盤），當前波動率僅為 ${volatility.toFixed(3)}%。在這種低動能環境下，技術指標容易失效，建議暫時觀望或進行輕倉概率對沖。`;
      } else if (language === 'th') {
        sidewaysReason = `[การตรวจสอบตลาด] ตรวจพบว่า ${context.indexType} อยู่ในสภาวะ Sideways โดยมีความผันผวนเพียง ${volatility.toFixed(3)}% ในสภาพแวดล้อมที่มีโมเมนตัมต่ำเช่นนี้ ตัวชี้วัดทางเทคนิคมักจะผิดเพี้ยน แนะนำให้รอดูสถานการณ์หรือป้องกันความเสี่ยงตามความน่าจะเป็น`;
      } else {
        sidewaysReason = `[MARKET_ALERT] ${context.indexType} is currently in a "Crab Market" (sideways) with extreme low volatility (${volatility.toFixed(3)}%). Technical indicators may provide false signals in this range. Probabilistic hedging is recommended.`;
      }
      return { suggestion, confidence, reasoning: sidewaysReason };
    }

    // 2. 时间周期权重差异逻辑
    // 10M 周期增加随机性，减小技术指标权重
    const isShortTerm = timeframe === '10M' || timeframe === '30M';
    
    // 如果趋势是中性
    if (context.trend === 'NEUTRAL') {
      if (rsi < 45) {
        suggestion = strategy.trendFollowing ? MarketOutcome.YES : MarketOutcome.NO;
        confidence = isShortTerm ? 0.51 : 0.55;
      } else if (rsi > 55) {
        suggestion = strategy.trendFollowing ? MarketOutcome.NO : MarketOutcome.YES;
        confidence = isShortTerm ? 0.51 : 0.55;
      } else {
        const macd = Number(context.technicalData?.macd || 0);
        suggestion = macd >= 0 ? MarketOutcome.YES : MarketOutcome.NO;
        confidence = 0.51;
      }
    } else {
      // 有明确趋势时
      if (strategy.trendFollowing) {
        suggestion = isBullish ? MarketOutcome.YES : MarketOutcome.NO;
        confidence = 0.6 + (volatility < 3 ? 0.15 : 0);
      } else {
        suggestion = isBullish ? MarketOutcome.NO : MarketOutcome.YES;
        confidence = 0.55 + (volatility > 5 ? 0.1 : 0);
      }
    }

    // 3. 针对 10M 周期的特殊处理：如果用户一直赢，或者建议太单一，在这里注入微小抖动
    if (isShortTerm) {
      // 模拟高频噪声对置信度的侵蚀
      confidence *= 0.9;
    }

    // 波动偏好调整
    if (strategy.volatilityPref === 'LOW' && volatility > 5) {
      confidence -= 0.1;
    } else if (strategy.volatilityPref === 'HIGH' && volatility < 2) {
      confidence -= 0.1;
    }

    const riskMultiplier = { 'LOW': 0.9, 'MEDIUM': 1.0, 'HIGH': 1.1, 'EXTREME': 1.2 };
    confidence *= riskMultiplier[strategy.riskLevel];
    confidence = Math.min(0.95, Math.max(0.3, confidence));

    // 根据语言返回分析文字
    let reasoning = "";
    if (language === 'zh-TW') {
      reasoning = `[策略分析] ${context.indexType} 目前處於 ${context.trend} 趨勢，週期为 ${timeframe}。` +
        `結合您的 ${strategy.riskLevel} 風險偏好，系統識別到當前技術面支撐。建議${suggestion === 'YES' ? '看漲(LONG)' : '看跌(SHORT)'}。`;
    } else if (language === 'th') {
      reasoning = `[การวิเคราะห์กลยุทธ์] ${context.indexType} ปัจจุบันอยู่ในเทรนด์ ${context.trend} สำหรับกรอบเวลา ${timeframe} ` +
        `เมื่อรวมกับระดับความเสี่ยง ${strategy.riskLevel} ของคุณ ระบบตรวจพบการสนับสนุนทางเทคนิค แนะนำให้ ${suggestion === 'YES' ? 'LONG' : 'SHORT'}`;
    } else {
      reasoning = `[STRATEGY_REPORT] ${context.indexType} is showing ${context.trend} trend on ${timeframe} timeframe. ` +
        `Matching your ${strategy.riskLevel} risk profile with technical signals, suggesting ${suggestion === 'YES' ? 'LONG' : 'SHORT'}.`;
    }

    return { suggestion, confidence, reasoning };
  }

  private getLanguageName(code: string): string {
    const names = {
      'zh-TW': 'Traditional Chinese (Hong Kong/Taiwan)',
      'th': 'Thai (ภาษาไทย)',
      'vi': 'Vietnamese (Tiếng Việt)',
      'hi': 'Hindi (हिन्दी)',
      'en': 'English'
    };
    return names[code] || 'English';
  }

  /**
   * 调用系统预设的 AI 模型
   */
  private async callSystemModel(
    userId: string,
    marketId: string,
    modelId: string,
    context: any,
    strategy: StrategyConfig,
    language: string = 'en'
  ): Promise<{ suggestion: MarketOutcome; confidence: number; reasoning: string }> {
    const langName = this.getLanguageName(language);
    const prompt = `[STRICT_LANGUAGE_LOCK: ${langName}]
[TASK] Analyze ${context.indexType} market and provide trading advice in ${langName}.

Market Data:
- Price: ${context.currentPrice?.toFixed(2)}
- Volatility: ${context.volatility?.toFixed(1)}%
- Trend: ${context.trend}
- Technicals: RSI: ${context.technicalData?.rsi}, MACD: ${context.technicalData?.macd}
- Signals: ${context.signals?.join(', ')}

[REQUIREMENTS]
1. Your reasoning MUST be in ${langName}.
2. DO NOT use Chinese.
3. Suggest YES (LONG) or NO (SHORT) based on risk level ${strategy.riskLevel}.

[OUTPUT_FORMAT: JSON_ONLY]
{
  "suggestion": "YES" or "NO",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed professional analysis written EXCLUSIVELY in ${langName}"
}

[CRITICAL] FINALLY: YOU MUST USE THE LANGUAGE: ${langName}.`;

    const response = await this.aiService.chat(userId, prompt, { marketId: marketId }, language);
    this.logger.log(`[AI_PROMPT_DEBUG] Market: ${marketId}, Lang: ${language}, Model: ${modelId}`);
    const content = response.answer;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          suggestion: parsed.suggestion === 'YES' ? MarketOutcome.YES : MarketOutcome.NO,
          confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
          reasoning: parsed.reasoning || 'AI Suggestion'
        };
      }
    } catch (e) {
      this.logger.error('Failed to parse AI JSON, falling back to raw text');
    }

    // 兜底逻辑
    return {
      suggestion: content.includes('YES') || content.toLowerCase().includes('long') ? MarketOutcome.YES : MarketOutcome.NO,
      confidence: 0.7,
      reasoning: content.slice(0, 300)
    };
  }

  /**
   * 调用自定义模型
   */
  private async callCustomModel(
    config: { name: string; apiKey: string; baseUrl: string; model: string },
    context: any,
    strategy: StrategyConfig,
    language: string = 'en'
  ): Promise<{ suggestion: MarketOutcome; confidence: number; reasoning: string }> {
    const axios = require('axios');
    const langName = this.getLanguageName(language);
    
    const prompt = `[CRITICAL] TARGET_LANGUAGE: ${langName}
[CRITICAL] RESPONSE_MUST_BE_IN_${langName.toUpperCase().replace(/\s/g, '_')}
[CRITICAL] DO NOT USE CHINESE

Market Analysis Data:
- Price: ${context.currentPrice?.toFixed(2) || 'N/A'}
- Trend: ${context.trend}
- Volatility: ${context.volatility?.toFixed(1) || 0}%
- Technicals: RSI: ${context.technicalData?.rsi}, MACD: ${context.technicalData?.macd}
- Signals: ${context.signals?.join(', ') || 'None'}

Task:
1. Provide trading analysis in ${langName}.
2. Reasoning MUST be in ${langName}.

JSON Output format:
{
  "suggestion": "YES" or "NO",
  "confidence": 0.0-1.0,
  "reasoning": "Analysis in ${langName}"
}`;

    try {
      const response = await axios.post(
        `${config.baseUrl}/chat/completions`,
        {
          model: config.model || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: `You are a professional financial market analyst. Your response language MUST BE ${langName}. DO NOT USE CHINESE.` },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const content = response.data.choices[0]?.message?.content || '';
      // 尝试解析 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          suggestion: parsed.suggestion === 'YES' ? MarketOutcome.YES : MarketOutcome.NO,
          confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
          reasoning: parsed.reasoning || 'AI Analysis Report',
        };
      }
      throw new Error('Invalid response format');
    } catch (error) {
      this.logger.error(`Custom model API error: ${error.message}`);
      throw error;
    }
  }

  /**
   * 用户跟单 - AI 建议自动下单
   */
  async followSuggestion(userId: string, suggestionId: string) {
    const suggestion = await this.prisma.aISuggestion.findUnique({
      where: { id: suggestionId },
    });
    if (!suggestion || suggestion.userId !== userId) {
      throw new NotFoundException('Suggestion not found');
    }
    if (suggestion.followed) {
      throw new BadRequestException('Already followed this suggestion');
    }

    // 获取用户和市场信息
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const market = await this.prisma.market.findUnique({ where: { id: suggestion.marketId } });

    if (!user || !market) {
      throw new NotFoundException('User or Market not found');
    }
    if (market.status !== 'ACTIVE') {
      throw new BadRequestException('Market is not active');
    }

    // 获取策略计算推荐金额
    let betAmount = Math.floor(user.pts * 0.1); // 默认 10%
    if (suggestion.strategyId) {
      const strategy = await this.prisma.userStrategy.findUnique({
        where: { id: suggestion.strategyId },
      });
      if (strategy) {
        betAmount = Math.floor(user.pts * (strategy.maxBetPercent / 100));
      }
    }

    // 确保金额有效
    betAmount = Math.min(betAmount, user.pts);
    if (betAmount < 1) {
      throw new BadRequestException('Insufficient balance');
    }

    // 执行下单（使用乐观锁保证并发安全）
    const result = await this.prisma.$transaction(async (tx) => {
      // 重新获取用户最新信息（用于乐观锁）
      const latestUser = await tx.user.findUnique({ where: { id: userId } });
      if (!latestUser) {
        throw new NotFoundException('User not found');
      }
      if (latestUser.pts < betAmount) {
        throw new BadRequestException('Insufficient balance');
      }

      // 扣除积分（带乐观锁）
      const updatedUser = await tx.user.update({
        where: { id: userId, version: latestUser.version },
        data: { 
          pts: { decrement: betAmount },
          version: { increment: 1 }
        },
      });

      // 如果用户在团队中，同步更新团队积分
      if (updatedUser.teamId) {
        await tx.team.update({
          where: { id: updatedUser.teamId },
          data: { totalPts: { decrement: betAmount } },
        });
      }

      // 创建下注
      const bet = await tx.bet.create({
        data: {
          userId,
          marketId: suggestion.marketId,
          position: suggestion.suggestion,
          amount: betAmount,
        },
      });

      // 根据下注方向更新对应的资金池
      const poolUpdate: any = { poolSize: { increment: betAmount } };
      if (suggestion.suggestion === 'YES') {
        poolUpdate.yesPool = { increment: betAmount };
      } else {
        poolUpdate.noPool = { increment: betAmount };
      }

      await tx.market.update({
        where: { id: suggestion.marketId },
        data: poolUpdate,
      });

      // 标记建议已跟单
      await tx.aISuggestion.update({
        where: { id: suggestionId },
        data: { followed: true },
      });

      return { bet, newBalance: updatedUser.pts };
    });

    // 触发任务进度更新
    await this.questService.updateProgress(userId, 'PREDICTION');
    
    // 发送余额更新通知
    this.eventsGateway.emitBalanceUpdate(userId, result.newBalance);

    this.logger.log(`User ${userId} followed AI suggestion: ${suggestion.suggestion}, amount: ${betAmount}`);

    return {
      success: true,
      bet: result.bet,
      message: `Successfully placed ${suggestion.suggestion} bet of ${betAmount} PTS`,
      newBalance: result.newBalance,
    };
  }

  /**
   * 获取用户的 AI 建议历史
   */
  async getSuggestionHistory(userId: string, limit: number = 20) {
    return this.prisma.aISuggestion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

