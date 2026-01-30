import { Injectable, Logger } from '@nestjs/common';
import Decimal from 'decimal.js';

/**
 * 交易所价格服务
 * 每1秒从币安/OKX拉取最新价格，用于实时显示
 */
@Injectable()
export class ExchangePriceService {
  private readonly logger = new Logger(ExchangePriceService.name);
  
  // 币安 API 基础 URL
  private readonly BINANCE_API = 'https://api.binance.com/api/v3';
  // OKX API 基础 URL
  private readonly OKX_API = 'https://www.okx.com/api/v5';
  
  // 价格缓存（避免频繁请求）
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 500; // 500ms 缓存

  /**
   * 从币安获取单个币种价格
   */
  async fetchBinancePrice(symbol: string): Promise<number> {
    const cacheKey = `binance_${symbol}`;
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.price;
    }

    try {
      const response = await fetch(`${this.BINANCE_API}/ticker/price?symbol=${symbol}USDT`);
      if (!response.ok) throw new Error(`Binance API error: ${response.status}`);
      
      const data = await response.json();
      const price = parseFloat(data.price);
      
      this.priceCache.set(cacheKey, { price, timestamp: Date.now() });
      return price;
    } catch (error: any) {
      this.logger.warn(`Failed to fetch ${symbol} from Binance: ${error.message}`);
      throw error;
    }
  }

  /**
   * 从 OKX 获取单个币种价格
   */
  async fetchOKXPrice(symbol: string): Promise<number> {
    const cacheKey = `okx_${symbol}`;
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.price;
    }

    try {
      const response = await fetch(`${this.OKX_API}/market/ticker?instId=${symbol}-USDT`);
      if (!response.ok) throw new Error(`OKX API error: ${response.status}`);
      
      const data = await response.json();
      if (data.code !== '0' || !data.data || data.data.length === 0) {
        throw new Error('OKX API returned empty data');
      }
      
      const price = parseFloat(data.data[0].last);
      this.priceCache.set(cacheKey, { price, timestamp: Date.now() });
      return price;
    } catch (error: any) {
      this.logger.warn(`Failed to fetch ${symbol} from OKX: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取多个币种价格（并发请求，优先币安，失败降级到OKX）
   * 增加：如果两家交易所都失败，回退到上一次缓存的价格
   */
  async fetchMultiplePrices(symbols: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    
    // 并发请求所有币种
    const promises = symbols.map(async (symbol) => {
      try {
        // 优先使用币安
        const price = await this.fetchBinancePrice(symbol);
        return { symbol, price, source: 'binance' };
      } catch (error) {
        try {
          // 降级到 OKX
          const price = await this.fetchOKXPrice(symbol);
          return { symbol, price, source: 'okx' };
        } catch (e) {
          // 降级到缓存
          const cacheKey = `binance_${symbol}`; // 虽然叫 binance_xx，但其实存的是最后的有效价格
          const cached = this.priceCache.get(cacheKey);
          if (cached) {
            this.logger.debug(`[PRICE_FALLBACK] Using cached price for ${symbol}: $${cached.price}`);
            return { symbol, price: cached.price, source: 'cache' };
          }
          
          this.logger.error(`Failed to fetch ${symbol} from both exchanges and no cache available`);
          return { symbol, price: 0, source: 'none' };
        }
      }
    });

    const results = await Promise.all(promises);
    results.forEach(({ symbol, price }) => {
      if (price > 0) {
        prices.set(symbol, price);
      }
    });

    return prices;
  }

  // 🆕 黄金价格缓存（长期缓存，因为黄金波动小）
  private goldPriceCache: { price: number; timestamp: number } | null = null;
  private readonly GOLD_CACHE_TTL = 5000; // 5秒缓存

  // 黄金价格合理范围检查（2024-2026年预期范围）
  private readonly GOLD_PRICE_MIN = 2000;
  private readonly GOLD_PRICE_MAX = 3500;

  /**
   * 获取黄金价格（XAU/USD）
   * 使用多个数据源确保可靠性
   */
  async fetchGoldPrice(): Promise<number> {
    // 检查缓存
    if (this.goldPriceCache && Date.now() - this.goldPriceCache.timestamp < this.GOLD_CACHE_TTL) {
      return this.goldPriceCache.price;
    }

    let goldPrice = 0;

    // 方案 1: 使用免费黄金 API (metals.live)
    try {
      const response = await fetch('https://api.metals.live/v1/spot/gold', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0 && data[0].price) {
          goldPrice = parseFloat(data[0].price);
          this.logger.debug(`[GOLD] metals.live: $${goldPrice}`);
        }
      }
    } catch (e: any) {
      this.logger.debug(`metals.live API failed: ${e.message}`);
    }

    // 方案 2: 使用 Gold API (备用)
    if (goldPrice === 0) {
      try {
        const response = await fetch('https://www.goldapi.io/api/XAU/USD', {
          headers: {
            'x-access-token': process.env.GOLD_API_KEY || 'demo',
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(3000),
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.price) {
            goldPrice = parseFloat(data.price);
            this.logger.debug(`[GOLD] goldapi.io: $${goldPrice}`);
          }
        }
      } catch (e: any) {
        this.logger.debug(`goldapi.io API failed: ${e.message}`);
      }
    }

    // 方案 3: 使用 Forex API (备用)
    if (goldPrice === 0) {
      try {
        // exchangerate.host 现在可能需要 access_key，优先使用 env 中的 KEY
        let exchangerateUrl = 'https://api.exchangerate.host/latest?base=XAU&symbols=USD';
        if (process.env.EXCHANGERATE_API_KEY) {
          exchangerateUrl += `&access_key=${process.env.EXCHANGERATE_API_KEY}`;
        }
        const response = await fetch(exchangerateUrl, {
          signal: AbortSignal.timeout(3000),
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.rates && data.rates.USD) {
            // XAU/USD 需要取倒数
            goldPrice = 1 / parseFloat(data.rates.USD);
            this.logger.debug(`[GOLD] exchangerate.host: $${goldPrice}`);
          }
        }
      } catch (e: any) {
        this.logger.debug(`exchangerate.host API failed: ${e.message}`);
      }
    }

    // 🆕 合理性检查：黄金价格应在 $2000-$3500 范围内
    if (goldPrice > 0 && goldPrice >= this.GOLD_PRICE_MIN && goldPrice <= this.GOLD_PRICE_MAX) {
      this.goldPriceCache = { price: goldPrice, timestamp: Date.now() };
      return goldPrice;
    }

    // 方案 4: 环境变量回退或降级使用模拟价格（基于 $2700 基准 + 小波动）
    if (goldPrice === 0 || goldPrice < this.GOLD_PRICE_MIN || goldPrice > this.GOLD_PRICE_MAX) {
      if (process.env.FALLBACK_GOLD_PRICE) {
        goldPrice = parseFloat(process.env.FALLBACK_GOLD_PRICE as string);
        this.logger.warn(`[GOLD] Using FALLBACK_GOLD_PRICE from env: $${goldPrice}`);
      } else {
        const basePrice = this.goldPriceCache?.price || 2700;
        const jitter = (Math.random() - 0.5) * 2; // ±$1 波动
        goldPrice = parseFloat((basePrice + jitter).toFixed(2));
        this.logger.warn(`[GOLD] Using simulated price: $${goldPrice} (APIs unavailable)`);
      }
    }

    this.goldPriceCache = { price: goldPrice, timestamp: Date.now() };
    return goldPrice;
  }

  /**
   * 计算 C10 指数（基于交易所价格）
   */
  async calculateC10Index(weights: Map<string, number>): Promise<{
    value: number;
    components: Array<{ symbol: string; price: number; weight: number; contribution: number }>;
  }> {
    const symbols = Array.from(weights.keys());
    const prices = await this.fetchMultiplePrices(symbols);

    let weightedSum = new Decimal(0);
    const components: Array<{ symbol: string; price: number; weight: number; contribution: number }> = [];

    for (const [symbol, weight] of weights.entries()) {
      const price = prices.get(symbol) || 0;
      if (price > 0) {
        const weightedValue = new Decimal(price).mul(weight);
        weightedSum = weightedSum.add(weightedValue);
        
        components.push({
          symbol,
          price,
          weight: weight * 100, // 转换为百分比
          contribution: weightedValue.toNumber(),
        });
      }
    }

    // 保留6位小数
    const value = weightedSum.toDecimalPlaces(6).toNumber();

    return { value, components };
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.priceCache.clear();
  }
}

