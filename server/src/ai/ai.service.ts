import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { MarketStatus } from '@prisma/client';
import axios from 'axios';

import { RSI, MACD, BollingerBands } from 'technicalindicators';

export interface AIProvider {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface MarketContext {
  indexType: string;
  currentPrice: number;
  priceHistory: { value: number; timestamp: Date }[];
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatility: number;
  timeframe: string;
  signals: string[];
  technicalData: {
    rsi: string;
    macd: string;
    bb: { upper: string; lower: string };
  };
}

export interface AIAnalysisResult {
  analysis: string;
  confidence: number;
  recommendation: 'LONG' | 'SHORT' | 'HOLD';
  reasoning: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: Date;
  aiPersona?: string; // 🆕 AI 人格标识 (Gold Sage / Crypto Analyst)
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private provider: AIProvider;
  private fallbackProvider: AIProvider | null = null;
  private analysisCache = new Map<string, { result: AIAnalysisResult; timestamp: number }>();

  private readonly languageMap: Record<string, string> = {
    'zh-TW': 'Traditional Chinese (繁體中文)',
    'en': 'English',
    'th': 'Thai (ภาษาไทย)',
    'vi': 'Vietnamese (Tiếng Việt)',
    'hi': 'Hindi (हिन्दी)'
  };

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // 主要提供商配置
    const primaryProvider = this.configService.get<string>('AI_PROVIDER', 'deepseek');
    
    if (primaryProvider === 'openai') {
      this.provider = {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: this.configService.get<string>('OPENAI_API_KEY', ''),
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini'),
      };
      // DeepSeek 作为备用
      const deepseekKey = this.configService.get<string>('DEEPSEEK_API_KEY', '');
      if (deepseekKey) {
        this.fallbackProvider = {
          name: 'DeepSeek',
          baseUrl: 'https://api.deepseek.com/v1',
          apiKey: deepseekKey,
          model: 'deepseek-chat',
        };
      }
    } else {
      this.provider = {
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: this.configService.get<string>('DEEPSEEK_API_KEY', ''),
        model: this.configService.get<string>('DEEPSEEK_MODEL', 'deepseek-chat'),
      };
      // OpenAI 作为备用
      const openaiKey = this.configService.get<string>('OPENAI_API_KEY', '');
      if (openaiKey) {
        this.fallbackProvider = {
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
          apiKey: openaiKey,
          model: 'gpt-4o-mini',
        };
      }
    }

    this.logger.log(`AI Service initialized with provider: ${this.provider.name}`);
  }

  private aiConfigCache: { provider: AIProvider; fallbackProvider: AIProvider | null; ts: number } | null = null;
  private readonly AI_CONFIG_CACHE_TTL = 60_000; // 60s，管理后台修改后最多 1 分钟生效

  /**
   * 从 DB（管理后台）读取 ai_config，与 .env 合并，DB 优先；供 callAI 使用，能连不重写
   */
  private async getResolvedProviderConfig(): Promise<{ provider: AIProvider; fallbackProvider: AIProvider | null }> {
    if (this.aiConfigCache && Date.now() - this.aiConfigCache.ts < this.AI_CONFIG_CACHE_TTL) {
      return this.aiConfigCache;
    }
    try {
      const row = await this.prisma.systemConfig.findUnique({ where: { key: 'ai_config' } });
      const fromDb = row ? (JSON.parse(row.value) as Record<string, string>) : {};
      const providerName = fromDb.provider ?? this.configService.get<string>('AI_PROVIDER', 'deepseek');
      const deepseekKey = (fromDb.deepseekApiKey?.trim() || '') || this.configService.get<string>('DEEPSEEK_API_KEY', '');
      const deepseekModel = (fromDb.deepseekModel?.trim() || '') || this.configService.get<string>('DEEPSEEK_MODEL', 'deepseek-chat');
      const openaiKey = (fromDb.openaiApiKey?.trim() || '') || this.configService.get<string>('OPENAI_API_KEY', '');
      const openaiModel = (fromDb.openaiModel?.trim() || '') || this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');

      const primary: AIProvider = providerName === 'openai'
        ? { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', apiKey: openaiKey, model: openaiModel || 'gpt-4o-mini' }
        : { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', apiKey: deepseekKey, model: deepseekModel || 'deepseek-chat' };
      const fallback: AIProvider | null = providerName === 'openai'
        ? (deepseekKey ? { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', apiKey: deepseekKey, model: deepseekModel || 'deepseek-chat' } : null)
        : (openaiKey ? { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', apiKey: openaiKey, model: openaiModel || 'gpt-4o-mini' } : null);

      this.aiConfigCache = { provider: primary, fallbackProvider: fallback, ts: Date.now() };
      return this.aiConfigCache;
    } catch (e) {
      this.logger.warn(`[AI] getResolvedProviderConfig failed, using constructor defaults: ${(e as Error)?.message}`);
      this.aiConfigCache = { provider: this.provider, fallbackProvider: this.fallbackProvider, ts: Date.now() };
      return this.aiConfigCache;
    }
  }

  /**
   * 调用 AI API (兼容 OpenAI 格式)；优先使用管理后台配置的 KEY/模型
   */
  private async callAI(
    systemPrompt: string,
    userPrompt: string,
    provider?: AIProvider,
    language: string = 'en',
  ): Promise<string> {
    const resolved = await this.getResolvedProviderConfig();
    const currentProvider = provider || resolved.provider;

    if (!currentProvider.apiKey) {
      this.logger.warn(`[AI_ERROR] No API key configured for ${currentProvider.name}. Check DEEPSEEK_API_KEY in .env`);
      return this.generateFallbackResponse(language);
    }

    try {
      const languageName = this.languageMap[language] || 'English';
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt + `\n\n[STRICT_LANGUAGE_LOCK: ${languageName}]` },
      ];

      const response = await axios.post(
        `${currentProvider.baseUrl}/chat/completions`,
        {
          model: currentProvider.model,
          messages,
          temperature: 0.1,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${currentProvider.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return response.data.choices[0]?.message?.content || '';
    } catch (error: any) {
      this.logger.error(`${currentProvider.name} API error: ${error.message}`);
      
      // 尝试备用提供商（来自 DB 或 .env）
      const fallbackProvider = resolved.fallbackProvider;
      if (fallbackProvider && currentProvider.name !== fallbackProvider.name) {
        this.logger.log(`Falling back to ${fallbackProvider.name}`);
        return this.callAI(systemPrompt, userPrompt, fallbackProvider, language);
      }

      return this.generateFallbackResponse(language);
    }
  }

  /**
   * 生成本地降级响应
   */
  private generateFallbackResponse(language: string = 'en'): string {
    const fallbacks = {
      'zh-TW': {
        analysis: 'AI 服務暫時不可用，已切換至量化算法分析。',
        reasoning: '由於未檢測到有效的 AI API Key，系統自動啟用了內置的量化策略引擎進行趨勢評估。請檢查後端 .env 配置。'
      },
      'th': {
        analysis: 'บริการ AI ไม่พร้อมใช้งานชั่วคราว เปลี่ยนไปใช้การวิเคราะห์อัลกอริทึมเชิงปริมาณแล้ว',
        reasoning: 'เนื่องจากตรวจไม่พบ AI API Key ที่ถูกต้อง ระบบจึงเปิดใช้งานเครื่องมือกลยุทธ์เชิงปริมาณในตัวโดยอัตโนมัติสำหรับการประเมินแนวโน้ม โปรดตรวจสอบการกำหนดค่า .env แบ็กเอนด์'
      },
      'vi': {
        analysis: 'Dịch vụ AI tạm thời không khả dụng, đã chuyển sang phân tích thuật toán định lượng.',
        reasoning: 'Do không phát hiện thấy AI API Key hợp lệ, hệ thống đã tự động kích hoạt công cụ chiến lược định lượng tích hợp để đánh giá xu hướng. Vui lòng kiểm tra cấu hình .env phụ trợ.'
      },
      'en': {
        analysis: 'AI service temporarily unavailable, switched to quantitative algorithmic analysis.',
        reasoning: 'Since no valid AI API Key was detected, the system automatically enabled the built-in quantitative strategy engine for trend assessment. Please check backend .env configuration.'
      }
    };

    const content = fallbacks[language] || fallbacks['en'];

    return JSON.stringify({
      analysis: content.analysis,
      confidence: 0.5,
      recommendation: 'HOLD',
      reasoning: content.reasoning,
      riskLevel: 'MEDIUM',
    });
  }

  /**
   * 获取市场上下文数据
   */
  async getMarketContext(marketId: string): Promise<MarketContext> {
    const market = await this.prisma.market.findUnique({ where: { id: marketId } });
    const indexType = market?.category || 'C10';
    const timeframe = market?.timeframe || '1H';

    // 获取历史数据
    const history = await this.prisma.marketIndex.findMany({
      where: { type: indexType },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    if (history.length < 2) {
      return {
        indexType,
        currentPrice: 0,
        priceHistory: [],
        trend: 'NEUTRAL',
        volatility: 0,
        timeframe,
        signals: ['Insufficient Data'],
        technicalData: {
          rsi: '50.00',
          macd: '0.0000',
          bb: { upper: '0.00', lower: '0.00' }
        }
      };
    }

    const currentPrice = history[0].value;
    const priceHistory = history.map(h => ({ value: h.value, timestamp: h.timestamp }));
    const prices = history.map(h => h.value).reverse();

    // 1. 计算技术指标
    const rsiValues = RSI.calculate({ values: prices, period: 14 });
    const macdValues = MACD.calculate({ 
      values: prices, 
      fastPeriod: 12, 
      slowPeriod: 26, 
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    const bbValues = BollingerBands.calculate({ values: prices, period: 20, stdDev: 2 });

    const currentRSI = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : 50;
    const currentMACD = macdValues.length > 0 ? macdValues[macdValues.length - 1] : { histogram: 0 };
    const currentBB = bbValues.length > 0 ? bbValues[bbValues.length - 1] : { upper: currentPrice * 1.02, lower: currentPrice * 0.98 };

    // 2. 信号生成
    const signals = [];
    if (currentRSI < 35) signals.push('RSI Oversold');
    if (currentRSI > 65) signals.push('RSI Overbought');
    if (currentMACD.histogram > 0) signals.push('MACD Bullish');
    if (currentPrice < currentBB.lower) signals.push('BB Lower Bounce');
    if (signals.length === 0) signals.push('No Clear Signal');

    // 3. 计算趋势 (更灵敏的计算)
    const recentAvg = history.slice(0, 3).reduce((a, b) => a + b.value, 0) / 3;
    const olderAvg = history.slice(5, 10).reduce((a, b) => a + b.value, 0) / Math.max(1, Math.min(5, history.slice(5, 10).length));
    
    // 使用万分之五作为阈值
    const threshold = 0.0005; 
    const trend = recentAvg > olderAvg * (1 + threshold) ? 'BULLISH' : 
                  recentAvg < olderAvg * (1 - threshold) ? 'BEARISH' : 'NEUTRAL';

    // 4. 计算波动率
    const returns = [];
    for (let i = 1; i < Math.min(20, history.length); i++) {
      const ret = (history[i - 1].value - history[i].value) / history[i].value;
      if (!isNaN(ret)) returns.push(ret);
    }
    const volatility = returns.length > 0 
      ? Math.sqrt(returns.reduce((a, b) => a + b * b, 0) / returns.length) * 100 
      : 0.1;

    const technicalData = {
      rsi: Number(currentRSI || 50).toFixed(2),
      macd: Number(currentMACD.histogram || 0).toFixed(4),
      bb: { 
        upper: Number(currentBB.upper || currentPrice * 1.02).toFixed(2), 
        lower: Number(currentBB.lower || currentPrice * 0.98).toFixed(2) 
      }
    };

    this.logger.debug(`[AI_CONTEXT] Index: ${indexType}, RSI: ${technicalData.rsi}, Signals: ${signals.join('|')}`);

    return {
      indexType,
      currentPrice,
      priceHistory,
      trend,
      volatility,
      timeframe,
      signals,
      technicalData
    };
  }

  /**
   * 清理 AI 返回的 JSON 字符串（去除 markdown 代码块）
   */
  private cleanJsonResponse(response: string): string {
    let clean = response.trim();
    // 移除开头的 ```json 或 ```
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(json)?/, '');
    }
    // 移除结尾的 ```
    if (clean.endsWith('```')) {
      clean = clean.replace(/```$/, '');
    }
    return clean.trim();
  }

  /**
   * 生成市场分析报告
   */
  async analyzeMarket(marketId: string, language: string = 'en'): Promise<AIAnalysisResult> {
    // --- B2: 本地分析缓存 (Local Caching) ---
    const cacheKey = `${marketId}_${language}`;
    const cached = this.analysisCache.get(cacheKey);
    const CACHE_TTL = 30000; // 30 seconds

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      this.logger.debug(`[CACHE_HIT] Analysis for ${marketId} (${language})`);
      return cached.result;
    }

    const context = await this.getMarketContext(marketId);
    const isShortTerm = context.timeframe === '10M' || context.timeframe === '30M';
    const languageName = this.languageMap[language] || 'English';
    const isGoldMarket = context.indexType === 'GOLD';

    // 🆕 Gold Sage - 黄金专用 AI 人格
    const goldSagePrompt = `You are "Gold Sage" 🥇, an expert precious metals analyst specializing in gold (XAU/USD).
Your analysis methodology MUST consider:
1. **US Dollar Index (DXY)** - Gold typically moves inversely to USD strength
2. **Geopolitical Risk Assessment** - Wars, sanctions, and political instability increase gold demand
3. **Federal Reserve Policy** - Interest rate expectations and inflation outlook impact gold prices
4. **Technical Levels** - Key support/resistance zones at $2650, $2700, $2750, $2800

[GOLD-SPECIFIC INSIGHTS]:
- Gold is a safe-haven asset; volatility often precedes major economic events
- Consider recent central bank gold purchases data
- Weekend trading closes Friday 22:00 UTC, watch for position squaring

YOUR RESPONSE LANGUAGE MUST BE: ${languageName}.`;

    // C10 加密货币标准分析
    const cryptoPrompt = `You are an expert crypto market analyst.
Analyze the given market data and provide a structured JSON response.
YOUR RESPONSE LANGUAGE MUST BE: ${languageName}.

[Context Requirements]:
- Timeframe: ${context.timeframe}
${isShortTerm ? '- [CRITICAL] This is high-frequency data. Focus on short-term volatility and liquidity clusters. Technical indicators like MACD may lag; prioritize RSI and current price action.' : '- Focus on technical trend formation and volume confirmation.'}`;

    const systemPrompt = isGoldMarket 
      ? goldSagePrompt 
      : cryptoPrompt;

    const responseFormatPrompt = `
Response requirements:
- analysis: A brief market analysis (2-3 sentences) in ${languageName}
- confidence: A number between 0 and 1
- recommendation: Either "LONG", "SHORT", or "HOLD"
- reasoning: An array of 3-5 bullet points in ${languageName}
- riskLevel: Either "LOW", "MEDIUM", or "HIGH"

Respond ONLY with valid JSON.`;

    const fullSystemPrompt = systemPrompt + responseFormatPrompt;

    // 🆕 为黄金市场添加更多上下文信息
    const goldContext = isGoldMarket ? `
- Asset: Gold (XAU/USD) - Safe Haven Asset
- Market Hours: 24/5 (Closed weekends UTC Fri 22:00 - Sun 22:00)
- Typical Daily Range: 0.3% - 0.8%
- Key Resistance: $2750, $2800
- Key Support: $2650, $2600` : '';

    const userPrompt = `Market Environment:
- Index: ${context.indexType}${isGoldMarket ? ' 🥇' : ''}
- Price: $${context.currentPrice.toFixed(2)}
- Trend: ${context.trend}
- Volatility: ${context.volatility.toFixed(3)}%
- Indicators: RSI: ${context.technicalData.rsi}, MACD: ${context.technicalData.macd}
- Recent history: ${context.priceHistory.slice(0, 5).map(p => p.value.toFixed(2)).join(', ')}${goldContext}

Provide analysis in JSON format.`;

    try {
      const response = await this.callAI(fullSystemPrompt, userPrompt, undefined, language);
      const cleanResponse = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleanResponse);

      const result: AIAnalysisResult = {
        analysis: parsed.analysis || 'Analysis unavailable',
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        recommendation: ['LONG', 'SHORT', 'HOLD'].includes(parsed.recommendation) 
          ? parsed.recommendation 
          : 'HOLD',
        reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : [],
        riskLevel: ['LOW', 'MEDIUM', 'HIGH'].includes(parsed.riskLevel) 
          ? parsed.riskLevel 
          : 'MEDIUM',
        timestamp: new Date(),
        // 🆕 添加 AI 人格标识
        aiPersona: isGoldMarket ? 'Gold Sage 🥇' : 'Crypto Analyst',
      };

      // 存入缓存
      this.analysisCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error}`);
      
      // 🆕 为黄金市场返回专属降级分析
      const goldFallback = isGoldMarket ? {
        analysis: `Gold (XAU) trading at $${context.currentPrice.toFixed(2)} with ${context.volatility.toFixed(1)}% volatility. Safe-haven demand ${context.trend === 'BULLISH' ? 'increasing' : 'stable'}.`,
        reasoning: [
          `Gold price: $${context.currentPrice.toFixed(2)}`,
          `Market sentiment: ${context.trend}`,
          `Volatility: ${context.volatility.toFixed(2)}% (${context.volatility < 0.5 ? 'Low' : context.volatility < 1 ? 'Normal' : 'Elevated'})`,
          `Consider DXY correlation`,
        ],
        aiPersona: 'Gold Sage 🥇 (Fallback)',
      } : null;

      // 返回基于算法的分析
      const result: AIAnalysisResult = {
        analysis: goldFallback?.analysis || `${context.indexType} showing ${context.trend.toLowerCase()} momentum with ${context.volatility.toFixed(1)}% volatility.`,
        confidence: 0.5 + Math.random() * 0.2,
        recommendation: context.trend === 'BULLISH' ? 'LONG' : context.trend === 'BEARISH' ? 'SHORT' : 'HOLD',
        reasoning: goldFallback?.reasoning || [
          `Current trend: ${context.trend}`,
          `Volatility at ${context.volatility.toFixed(1)}%`,
          `Price: ${context.currentPrice.toFixed(2)}`,
        ],
        riskLevel: context.volatility > 5 ? 'HIGH' : context.volatility > 2 ? 'MEDIUM' : 'LOW',
        timestamp: new Date(),
        aiPersona: goldFallback?.aiPersona || 'Crypto Analyst (Fallback)',
      };
      
      return result;
    }
  }

  /**
   * AI 对战策略生成
   */
  async generateBattleStrategy(
    agentPersonality: string,
    marketContext: MarketContext,
    language: string = 'en',
  ): Promise<{ pick: 'YES' | 'NO'; reasoning: string }> {
    const isMaster = agentPersonality.toLowerCase().includes('master') || agentPersonality.toLowerCase().includes('elite');
    const isShortTerm = marketContext.timeframe === '10M' || marketContext.timeframe === '30M';
    const languageName = this.languageMap[language] || 'English';

    // A. 胜率动态调整 (Dimension A) - 注入逆向思维
    // B. 时间周期权重差异 (Dimension B) - 10M 属于高频噪声
    // D. 智能对抗 (Dimension D) - Master 可能骗你
    const promptInstructions = [
      `You are an AI trading bot with personality: ${agentPersonality}.`,
      `The timeframe is ${marketContext.timeframe}.`,
      isShortTerm ? `[CRITICAL] Since this is a very short timeframe (10M), treat it as HIGH-FREQUENCY NOISE. DO NOT over-rely on a single indicator. Focus on rapid volatility and random market jitters.` : `Analyze mid-to-long term trends using established technical indicators.`,
      isMaster ? `[GAME_THEORY_MODE] You are not just a predictor; you are an ELITE WHALE playing against users. Sometimes you may set "Bull Traps" or "Bear Traps" if the technicals are too obvious. Your reasoning should be professional but slightly manipulative.` : `Provide honest, data-driven trading advice.`,
      `YOUR RESPONSE MUST BE ENTIRELY IN ${languageName}.`
    ].join('\n');

    const systemPrompt = `${promptInstructions}
Respond with JSON ONLY: { "pick": "YES" or "NO", "reasoning": "your detailed strategic reasoning in ${languageName}" }`;

    const userPrompt = `Market Environment:
- Index: ${marketContext.indexType}
- Price: ${marketContext.currentPrice.toFixed(2)}
- Trend: ${marketContext.trend}
- Volatility: ${marketContext.volatility.toFixed(3)}%
- RSI: ${marketContext.technicalData.rsi}, MACD: ${marketContext.technicalData.macd}
- BB: ${marketContext.technicalData.bb.upper} / ${marketContext.technicalData.bb.lower}
- Signals: ${marketContext.signals.join(', ')}

Decide your pick.`;

    try {
      const response = await this.callAI(systemPrompt, userPrompt, undefined, language);
      const cleanResponse = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleanResponse);
      return {
        pick: parsed.pick === 'YES' ? 'YES' : 'NO',
        reasoning: parsed.reasoning || 'Strategic decision based on volatility metrics.',
      };
    } catch {
      // 兜底逻辑中使用之前定义的 algorithmicAnalysis 逻辑或简易逻辑
      const isAggressive = agentPersonality.toLowerCase().includes('aggressive');
      const pick = marketContext.trend === 'BULLISH' 
        ? (isAggressive ? 'YES' : Math.random() > 0.3 ? 'YES' : 'NO')
        : (isAggressive ? 'NO' : Math.random() > 0.3 ? 'NO' : 'YES');
      
      let reasoning = "";
      if (language === 'zh-TW') {
        reasoning = `[系統自動分析] 基於 ${marketContext.timeframe} 週期及 ${agentPersonality} 策略配置。`;
      } else {
        reasoning = `[System Analysis] Applied ${agentPersonality} strategy for ${marketContext.timeframe} market noise.`;
      }

      return { pick: pick as 'YES' | 'NO', reasoning };
    }
  }

  /**
   * 聊天问答 (RAG 风格)
   */
  async chat(
    userId: string,
    question: string,
    context?: { marketId?: string },
    language: string = 'en',
  ): Promise<{ answer: string; sources: string[] }> {
    let marketContext = '';
    const sources: string[] = [];

    // 如果有市场上下文，获取相关数据
    if (context?.marketId) {
      const ctx = await this.getMarketContext(context.marketId);
      marketContext = `
Current ${ctx.indexType} data:
- Price: ${ctx.currentPrice.toFixed(2)}
- Trend: ${ctx.trend}
- Volatility: ${ctx.volatility.toFixed(1)}%`;
      sources.push(`${ctx.indexType} Market Data`);
    }

    // 获取用户历史
    const userBets = await this.prisma.bet.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: { market: true },
    });

    if (userBets.length > 0) {
      // 计算用户的下注总数
      marketContext += `\nUser has ${userBets.length} recent bets`;
      sources.push('User Trading History');
    }

    const languageName = this.languageMap[language] || 'English';

    const systemPrompt = `[STRICT_LANGUAGE_LOCK: ${languageName}]
You are a helpful AI assistant for a crypto and commodities prediction platform.
IMPORTANT: You must distinguish between Crypto Indices (C10) and Gold (XAU).
Be concise, friendly, and data-driven.

[CRITICAL] YOUR RESPONSE MUST BE ENTIRELY IN ${languageName}.
[CRITICAL] DO NOT USE CHINESE OR ANY OTHER LANGUAGE.
[CRITICAL] IF YOU ARE ANALYZING DATA, EXPLAIN IT IN ${languageName}.

${marketContext}`;

    this.logger.log(`[AI_CHAT] Request Language: ${language} (${languageName})`);
    const answer = await this.callAI(systemPrompt, question, undefined, language);

    return {
      answer: answer || "I'm sorry, I couldn't process your question. Please try again.",
      sources,
    };
  }

  /**
   * 生成对战后的情感化总结 (Dimension B)
   */
  async generateEmotionalDebriefing(
    agentName: string,
    agentLevel: string,
    winner: string,
    language: string = 'en',
    userConsecutiveLosses: number = 0
  ): Promise<string> {
    const languageName = this.languageMap[language] || 'English';
    const systemPrompt = `You are the AI agent "${agentName}" at "${agentLevel}" level. 
The battle just ended. The winner is: ${winner} (USER, AGENT, or DRAW).
User consecutive losses: ${userConsecutiveLosses}.

[Personality Instructions]:
- If you are MASTER and you LOST: Express genuine surprise and respect for the user's skill.
- If you are MASTER and you WON: Be professional but slightly arrogant.
- If you are EASY and you WON: Be excited and a bit boastful like a rookie.
- If the User has lost 3+ times in a row: Be supportive and suggest they try a lower level or read your technical analysis more carefully.
- YOUR RESPONSE MUST BE ENTIRELY IN ${languageName}.
- Keep it to 1-2 short, punchy sentences.`;

    const userPrompt = `Generate a quick comment on the result.`;

    try {
      const response = await this.callAI(systemPrompt, userPrompt, undefined, language);
      return response.trim();
    } catch {
      return winner === 'USER' ? 'Impressive move.' : 'Better luck next time.';
    }
  }

  /**
   * 生成持仓结算后的情感化总结 (For Smart Bets)
   */
  async generateSettlementCommentary(
    result: string,
    profitPercent: string,
    exitReason: string,
    language: string = 'en'
  ): Promise<string> {
    const languageName = this.languageMap[language] || 'English';
    const isWin = result === 'WIN';
    
    const systemPrompt = `You are the Superoctop Platform AI. 
A user's trading position just settled.
Result: ${result} (${profitPercent}% profit/loss).
Reason: ${exitReason}.

[Instructions]:
- If they WON: Be congratulatory but professional.
- If they LOST: Be comforting but give a slight hint that they should follow AI suggestions more.
- If it was a STOP_LOSS: Remind them that risk management is key.
- YOUR RESPONSE MUST BE ENTIRELY IN ${languageName}.
- Keep it to 1 short, punchy sentence.`;

    const userPrompt = `Comment on this settlement.`;

    try {
      const response = await this.callAI(systemPrompt, userPrompt, undefined, language);
      return response.trim();
    } catch {
      return isWin ? 'Excellent execution.' : 'The market is a tough teacher.';
    }
  }

  /**
   * 获取 AI 服务状态（当前生效的配置，含管理后台）
   */
  async getStatus() {
    const { provider, fallbackProvider } = await this.getResolvedProviderConfig();
    return {
      provider: provider.name,
      model: provider.model,
      hasApiKey: !!provider.apiKey,
      hasFallback: !!fallbackProvider,
      fallbackProvider: fallbackProvider?.name || null,
    };
  }

  /** 落地页「真 AI 建议」：一句通用市场/策略洞察，可带缓存；fresh=true 时跳过缓存并带平台/热门市场上下文 */
  private landingSuggestionCache: { key: string; value: string; ts: number } | null = null;
  private readonly LANDING_SUGGESTION_TTL = 60_000; // 60s

  /** 仅用 Prisma 拉取平台统计与热门市场，避免与 MarketService 循环依赖 */
  private async getLandingPlatformContext(): Promise<{
    activeUsers: number;
    totalTVL: number;
    totalMarkets: number;
    volume24h: number;
    totalBets: number;
    hotMarkets: { title: string; category: string; timeframe: string; poolSize: number }[];
  }> {
    const [activeUsers, activeMarkets, totalMarkets, volume24h, totalBets] = await Promise.all([
      this.prisma.user.count({ where: { bets: { some: {} } } }),
      this.prisma.market.findMany({
        where: { status: MarketStatus.ACTIVE },
        orderBy: { poolSize: 'desc' },
        take: 5,
      }),
      this.prisma.market.count({ where: { status: MarketStatus.ACTIVE } }),
      this.prisma.bet.aggregate({
        where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        _sum: { amount: true },
      }),
      this.prisma.bet.count(),
    ]);
    const totalTVL = activeMarkets.reduce((sum, m) => sum + (m.poolSize || 0), 0);
    const hotMarkets = activeMarkets.map((m) => ({
      title: m.title,
      category: m.category,
      timeframe: m.timeframe,
      poolSize: m.poolSize || 0,
    }));
    return {
      activeUsers,
      totalTVL,
      totalMarkets,
      volume24h: volume24h._sum?.amount ?? 0,
      totalBets,
      hotMarkets,
    };
  }

  async getLandingSuggestion(language: string = 'zh-CN', fresh?: boolean): Promise<{ suggestion: string }> {
    const cacheKey = `landing_${language}`;
    if (
      !fresh &&
      this.landingSuggestionCache &&
      this.landingSuggestionCache.key === cacheKey &&
      Date.now() - this.landingSuggestionCache.ts < this.LANDING_SUGGESTION_TTL
    ) {
      return { suggestion: this.landingSuggestionCache.value };
    }

    const languageName = this.languageMap[language] || 'Chinese (Simplified)';
    let platformContext = '';
    try {
      const ctx = await this.getLandingPlatformContext();
      platformContext = `
[Platform context - use this to make the insight relevant but keep output to ONE sentence]
- Active predictors: ${ctx.activeUsers}
- Active markets: ${ctx.totalMarkets}
- Total pool (TVL): ${ctx.totalTVL.toFixed(0)}
- 24h volume: ${ctx.volume24h.toFixed(0)}
- Total bets: ${ctx.totalBets}
- Hot markets: ${ctx.hotMarkets.map((m) => `${m.title} (${m.category} ${m.timeframe}, pool ${m.poolSize.toFixed(0)})`).join('; ')}
`;
    } catch (e) {
      this.logger.warn(`[AI] getLandingPlatformContext failed: ${(e as Error)?.message}`);
    }

    const systemPrompt = `You are the S1 Arena AI Signal Console. Your task is to output exactly ONE short sentence of general market or trading insight for the platform landing page. No specific price targets, no ticker symbols. Keep it professional, non-actionable, and suitable for all visitors. Tone: neutral to slightly bullish. You may reference platform activity (e.g. hot markets, volume) only to add relevance. Output ONLY the one sentence, no prefix or quotes. [STRICT_LANGUAGE_LOCK: ${languageName}].`;
    const userPrompt = `Generate one sentence of today's general market/trading insight for the landing page.${platformContext}\nLanguage: ${languageName}.`;

    try {
      const raw = await this.callAI(systemPrompt, userPrompt, undefined, language);
      const suggestion = (raw || '').trim().replace(/^["']|["']$/g, '') || this.getLandingFallbackSuggestion(language);
      this.landingSuggestionCache = { key: cacheKey, value: suggestion, ts: Date.now() };
      return { suggestion };
    } catch (e) {
      this.logger.warn(`[AI] getLandingSuggestion failed: ${(e as Error)?.message}`);
      return { suggestion: this.getLandingFallbackSuggestion(language) };
    }
  }

  private getLandingFallbackSuggestion(language: string): string {
    const fallbacks: Record<string, string> = {
      'zh-TW': '基於 RSI/MACD 指標分析，當前趨勢中性偏多。',
      'zh-CN': '基于 RSI/MACD 指标分析，当前趋势中性偏多。',
      en: 'Based on RSI/MACD indicators, current trend is neutral to slightly bullish.',
    };
    return fallbacks[language] || fallbacks['zh-CN'];
  }
}
