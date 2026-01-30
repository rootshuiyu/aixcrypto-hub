import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { ExchangePriceService } from './exchange-price.service';
import { ethers } from 'ethers';
import Decimal from 'decimal.js';

interface RpcNode {
  url: string;
  name: string;
  priority: number;
  enabled: boolean;
}

// Chainlink Feed Registry (Mainnet)
const CHAINLINK_ETH_MAINNET = {
  BTC_USD: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
  ETH_USD: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
  SOL_USD: '0x4ffC43a9107573f5800490a9A2C71C3403472A58',
  BNB_USD: '0x14e613AC84a31f709ecdabd0C69056d22BA62717',
  LINK_USD: '0x2c1d072e956affC0D435Cb7AC38EF18d24d9127c',
  ADA_USD: '0xAE48B247035336d3516966840eA8E65333C1e8ee',
  AVAX_USD: '0xFF3EE2131fE1d4393228f73BaE7F94129692474f',
  DOT_USD: '0x1C07AF535eba393e8964821a1b140A8A9448C3d0',
  MATIC_USD: '0x7b97E892f6b31a80Ba5209212c41793A248A0a0C',
  UNI_USD: '0x553303d460ee0af13d07a46870f474039C9bE1e1',
};

const GOLD_FEED = '0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6'; // XAU/USD

@Injectable()
export class IndexService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndexService.name);
  private lastC10Value = new Decimal(0);
  private lastGoldValue = new Decimal(0);
  private componentsCache: any[] = [];
  private goldComponentsCache: any[] = [];
  private providers: ethers.JsonRpcProvider[] = [];

  // 推拉结合配置
  private exchangePriceInterval: NodeJS.Timeout | null = null;
  private oracleValidationInterval: NodeJS.Timeout | null = null;
  private millisecondPushInterval: NodeJS.Timeout | null = null; // 毫秒级推送
  private lastOraclePrice: { c10: number; gold: number } | null = null;
  private priceDeviationThreshold = 0.01; // 1% 偏差阈值

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private exchangePriceService: ExchangePriceService,
  ) {
    // RPC 节点将在 onModuleInit 中从数据库动态加载
    this.logger.log('IndexService constructor called, RPC will be loaded from database');
  }

  // 从数据库加载 RPC 配置
  private async loadRpcProviders() {
    try {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key: 'rpc_nodes' }
      });

      let rpcUrls: string[] = [];

      // 1. 优先从数据库读取
      if (config) {
        try {
          const nodes = JSON.parse(config.value) as RpcNode[];
          rpcUrls = nodes
            .filter(n => n.enabled)
            .sort((a, b) => b.priority - a.priority)
            .map(n => n.url);
          this.logger.log(`Loaded ${rpcUrls.length} RPC nodes from database`);
        } catch (e) {
          this.logger.error('Failed to parse RPC config from database');
        }
      }

      // 2. 环境变量补充（最高优先级）
      const customRpc = process.env.ETH_RPC_URL;
      const alchemyKey = process.env.ALCHEMY_API_KEY;
      const infuraKey = process.env.INFURA_API_KEY;

      if (alchemyKey) {
        const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
        rpcUrls = [alchemyUrl, ...rpcUrls.filter(u => u !== alchemyUrl)];
        this.logger.log('Alchemy RPC added with highest priority');
      }
      if (infuraKey) {
        const infuraUrl = `https://mainnet.infura.io/v3/${infuraKey}`;
        rpcUrls = [infuraUrl, ...rpcUrls.filter(u => u !== infuraUrl)];
        this.logger.log('Infura RPC added with high priority');
      }
      if (customRpc) {
        rpcUrls = [customRpc, ...rpcUrls.filter(u => u !== customRpc)];
        this.logger.log(`Custom RPC added: ${customRpc.substring(0, 30)}...`);
      }

      // 3. 如果仍然为空，使用默认公共节点
      if (rpcUrls.length === 0) {
        rpcUrls = [
          'https://rpc.ankr.com/eth',
          'https://cloudflare-eth.com',
          'https://ethereum.publicnode.com',
          'https://eth.llamarpc.com',
          'https://1rpc.io/eth'
        ];
        this.logger.log('Using default public RPC nodes');
      }

      // 创建 providers - 明确指定 mainnet (chainId: 1)
      this.providers = rpcUrls.map(url => 
        new ethers.JsonRpcProvider(url, 1, { staticNetwork: true })
      );
      this.logger.log(`Initialized ${this.providers.length} RPC providers`);

    } catch (error: any) {
      this.logger.error(`Failed to load RPC providers: ${error.message}`);
      // 降级到默认节点
      this.providers = [
        new ethers.JsonRpcProvider('https://rpc.ankr.com/eth', 1, { staticNetwork: true })
      ];
    }
  }

  async onModuleInit() {
    this.logger.log('Index service initializing...');
    // 先加载 RPC 配置
    await this.loadRpcProviders();
    
    // 启动推拉结合更新机制
    this.startHybridUpdate();
    
    this.logger.log('Index service initialized with hybrid oracle mode');
  }

  /**
   * 启动推拉结合更新机制
   */
  private startHybridUpdate() {
    // 1. 高频拉取层：每1秒从交易所获取价格（实时显示）
    this.exchangePriceInterval = setInterval(() => {
      this.updateFromExchange().catch(err => {
        this.logger.error(`Exchange update failed: ${err.message}`);
      });
    }, 1000);

    // 2. 校验层：每10秒从预言机获取价格（验证准确性）
    this.oracleValidationInterval = setInterval(() => {
      this.validateWithOracle().catch(err => {
        this.logger.error(`Oracle validation failed: ${err.message}`);
      });
    }, 10000);

    // 3. 实时推送：每100ms推送一次（每秒10条，保持极度流畅）
    this.millisecondPushInterval = setInterval(() => {
      this.pushMillisecondUpdate();
    }, 100); // 🆕 恢复到 100ms，确保前端采集跳动感强烈

    // 4. 首次更新
    setTimeout(() => {
      this.updateFromExchange();
      this.validateWithOracle();
    }, 2000);
  }

  // 🆕 线性插值状态
  private interpolationState = {
    c10: { from: 0, to: 0, progress: 0 },
    gold: { from: 0, to: 0, progress: 0 },
  };

  /**
   * 设置插值目标（当收到新的价格时调用）
   */
  private setInterpolationTarget(market: 'c10' | 'gold', newPrice: number) {
    const state = this.interpolationState[market];
    state.from = state.progress > 0 
      ? this.lerp(state.from, state.to, state.progress) // 从当前插值位置开始
      : (market === 'c10' ? this.lastC10Value.toNumber() : this.lastGoldValue.toNumber());
    state.to = newPrice;
    state.progress = 0;
  }

  /**
   * 线性插值函数
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * Math.min(1, Math.max(0, t));
  }

  /**
   * 毫秒级推送（线性插值 + 微动效果）
   * 实现平滑的价格动画，黄金使用更细腻的插值
   */
  private pushMillisecondUpdate() {
    if (this.lastC10Value.isZero() && this.lastGoldValue.isZero()) return;

    // 插值进度递增（每100ms调用，约0.7秒完成插值，保持领先感）
    const interpolationStep = 0.15;
    
    // C10 插值
    this.interpolationState.c10.progress = Math.min(1, this.interpolationState.c10.progress + interpolationStep);
    const c10Interpolated = this.lerp(
      this.interpolationState.c10.from || this.lastC10Value.toNumber(),
      this.interpolationState.c10.to || this.lastC10Value.toNumber(),
      this.interpolationState.c10.progress
    );

    // GOLD 插值（步长稍小保持稳重，但依然比之前快）
    const goldInterpolationStep = 0.12; 
    this.interpolationState.gold.progress = Math.min(1, this.interpolationState.gold.progress + goldInterpolationStep);
    const goldInterpolated = this.lerp(
      this.interpolationState.gold.from || this.lastGoldValue.toNumber(),
      this.interpolationState.gold.to || this.lastGoldValue.toNumber(),
      this.interpolationState.gold.progress
    );

    // 🆕 黄金专用微动：更小的波动范围（因为黄金本身波动小）
    const c10Jitter = () => new Decimal(1).add((Math.random() - 0.5) * 0.00002); // ±0.001%
    const goldJitter = () => new Decimal(1).add((Math.random() - 0.5) * 0.000005); // ±0.00025% (更小)
    
    const c10MicroValue = new Decimal(c10Interpolated).mul(c10Jitter()).toDecimalPlaces(6).toNumber();
    const goldMicroValue = new Decimal(goldInterpolated).mul(goldJitter()).toDecimalPlaces(6).toNumber();

    if (this.eventsGateway?.server) {
      this.eventsGateway.server.emit('indexUpdateMicro', {
        c10: { 
          value: c10MicroValue,
          interpolatedValue: c10Interpolated, // 🆕 提供纯插值值（无抖动）
          components: this.componentsCache,
          interpolationProgress: this.interpolationState.c10.progress,
        },
        gold: { 
          value: goldMicroValue,
          interpolatedValue: goldInterpolated, // 🆕 提供纯插值值（无抖动）
          components: this.goldComponentsCache,
          interpolationProgress: this.interpolationState.gold.progress,
        },
        timestamp: new Date(),
        source: 'micro',
      });
    }
  }

  /**
   * 从交易所更新价格（高频，1秒）
   */
  private async updateFromExchange() {
    try {
      // 获取权重配置
      const weights = await this.prisma.indexWeight.findMany({
        where: { category: 'C10', isActive: true }
      });
      const weightMap = new Map(weights.map(w => [w.symbol, w.weight]));

      // 计算 C10 指数
      const c10Result = await this.exchangePriceService.calculateC10Index(weightMap);
      
      // 获取黄金价格
      let goldPrice = 0;
      try {
        goldPrice = await this.exchangePriceService.fetchGoldPrice();
      } catch (e) {
        // 如果交易所获取失败，使用上次价格
        goldPrice = this.lastGoldValue.toNumber();
      }

      // 更新缓存
      if (c10Result.value > 0) {
        // 🆕 设置线性插值目标
        this.setInterpolationTarget('c10', c10Result.value);
        this.lastC10Value = new Decimal(c10Result.value);
        this.componentsCache = c10Result.components;
      }
      if (goldPrice > 0) {
        // 🆕 设置线性插值目标
        this.setInterpolationTarget('gold', goldPrice);
        this.lastGoldValue = new Decimal(goldPrice);
      }

      // 保存到数据库（6位小数精度）
      const timestamp = new Date();
      await this.prisma.marketIndex.createMany({
        data: [
          { 
            type: 'C10', 
            value: this.lastC10Value.toDecimalPlaces(6).toNumber(), 
            timestamp 
          },
          { 
            type: 'GOLD', 
            value: this.lastGoldValue.toDecimalPlaces(6).toNumber(), 
            timestamp 
          }
        ]
      });

      // WebSocket 实时推送（用于前端毫秒级显示）
      if (this.eventsGateway?.server) {
        this.eventsGateway.server.emit('indexUpdate', {
          c10: { 
            value: this.lastC10Value.toDecimalPlaces(6).toNumber(), 
            components: this.componentsCache 
          },
          gold: { 
            value: this.lastGoldValue.toDecimalPlaces(6).toNumber(), 
            components: [{ symbol: 'XAU', price: goldPrice }] 
          },
          timestamp,
          source: 'exchange', // 标记数据来源
        });
      }

    } catch (error: any) {
      this.logger.error(`Exchange price update failed: ${error.message}`);
      // 降级：使用插值点
      await this.generateInterpolatedPoint();
    }
  }

  /**
   * 从预言机验证价格（低频，10秒）
   */
  private async validateWithOracle() {
    try {
      const results = await Promise.all([
        this.fetchC10Index(),
        this.fetchGoldIndex()
      ]);

      const [c10Oracle, goldOracle] = results;
      
      if (c10Oracle.value > 0) {
        // 计算偏差 - 增加对 lastC10Value 为 0 的处理
        let deviation = 0;
        if (this.lastC10Value.isZero()) {
          this.logger.warn(`[PRICE_SYNC] C10 last value was zero, initializing with Oracle: ${c10Oracle.value.toFixed(6)}`);
          deviation = 1; // 强制更新
        } else {
          deviation = Math.abs(
            (c10Oracle.value - this.lastC10Value.toNumber()) / this.lastC10Value.toNumber()
          );
        }

        if (deviation > this.priceDeviationThreshold || this.lastC10Value.isZero()) {
          if (!this.lastC10Value.isZero()) {
            this.logger.warn(
              `[PRICE_DEVIATION] C10 deviation: ${(deviation * 100).toFixed(2)}% ` +
              `(Exchange: ${this.lastC10Value.toFixed(6)}, Oracle: ${c10Oracle.value.toFixed(6)})`
            );
          }
          
          // 偏差过大时，使用预言机价格（更可信）
          this.lastC10Value = new Decimal(c10Oracle.value);
          this.componentsCache = c10Oracle.components;
          // 同时更新插值目标
          this.setInterpolationTarget('c10', c10Oracle.value);
        }

        this.lastOraclePrice = {
          c10: c10Oracle.value,
          gold: goldOracle.value || this.lastGoldValue.toNumber(),
        };
      }

      if (goldOracle.value > 0) {
        let goldDeviation = 0;
        if (this.lastGoldValue.isZero()) {
          this.logger.warn(`[PRICE_SYNC] GOLD last value was zero, initializing with Oracle: ${goldOracle.value.toFixed(6)}`);
          goldDeviation = 1;
        } else {
          goldDeviation = Math.abs(
            (goldOracle.value - this.lastGoldValue.toNumber()) / this.lastGoldValue.toNumber()
          );
        }

        if (goldDeviation > this.priceDeviationThreshold || this.lastGoldValue.isZero()) {
          if (!this.lastGoldValue.isZero()) {
            this.logger.warn(
              `[PRICE_DEVIATION] GOLD deviation: ${(goldDeviation * 100).toFixed(2)}%`
            );
          }
          this.lastGoldValue = new Decimal(goldOracle.value);
          // 同时更新插值目标
          this.setInterpolationTarget('gold', goldOracle.value);
        }
      }

    } catch (error: any) {
      this.logger.error(`Oracle validation failed: ${error.message}`);
    }
  }

  // 刷新 RPC 配置（供管理后台调用）
  async refreshRpcProviders() {
    this.logger.log('Refreshing RPC providers...');
    await this.loadRpcProviders();
    return { success: true, providerCount: this.providers.length };
  }

  /**
   * 兼容旧接口：保留 updateIndex 方法（已由推拉结合机制替代）
   * @deprecated 使用 startHybridUpdate 替代
   */
  @Cron('*/30 * * * * *')
  async updateIndex() {
    // 此方法已被推拉结合机制替代，保留用于兼容
    // 实际更新由 updateFromExchange 和 validateWithOracle 完成
  }

  private async fetchC10Index() {
    // 1. 获取所有成分币价格
    const promises = Object.entries(CHAINLINK_ETH_MAINNET).map(async ([symbol, address]) => {
      try {
        const price = await this.callChainlinkFeed(address);
        return { symbol: symbol.replace('_USD', ''), price };
      } catch (e) {
        return { symbol: symbol.replace('_USD', ''), price: 0 };
      }
    });

    const components = await Promise.all(promises);
    const validComponents = components.filter(c => c.price > 0);
    
    if (validComponents.length === 0) return { value: 0, components: [] };

    // 2. 加载市值权重配置
    const weights = await this.prisma.indexWeight.findMany({
      where: { category: 'C10', isActive: true }
    });

    // 3. 构建权重映射
    const weightMap = new Map(weights.map(w => [w.symbol, w.weight]));
    
    // 4. 市值加权计算
    let weightedSum = new Decimal(0);
    let totalWeight = new Decimal(0);
    
    const enrichedComponents = validComponents.map(c => {
      const weight = weightMap.get(c.symbol) || 0;
      const weightedValue = new Decimal(c.price).mul(weight);
      weightedSum = weightedSum.add(weightedValue);
      totalWeight = totalWeight.add(weight);
      
      return {
        ...c,
        weight: weight * 100, // 转换为百分比显示
        contribution: weightedValue.toNumber()
      };
    });

    // 5. 计算加权指数值
    // 如果有权重配置，使用加权平均；否则使用简单平均
    let value: number;
    if (totalWeight.greaterThan(0)) {
      // 市值加权：Index = Σ(Price × Weight)
      // 这里不除以 totalWeight，因为权重已经是归一化的（总和为 1）
      // 提高精度到6位小数
      value = weightedSum.toDecimalPlaces(6).toNumber();
      this.logger.debug(`C10 weighted calculation: ${weightedSum.toFixed(6)} (total weight: ${totalWeight.toFixed(6)})`);
    } else {
      // 降级到简单平均
      const total = validComponents.reduce((sum, c) => sum.add(c.price), new Decimal(0));
      value = total.div(validComponents.length).toDecimalPlaces(6).toNumber();
      this.logger.debug(`C10 simple average: ${value}`);
    }

    return { value, components: enrichedComponents };
  }

  private async fetchGoldIndex() {
    try {
      const price = await this.callChainlinkFeed(GOLD_FEED);
      return { value: price, components: [{ symbol: 'XAU', price }] };
    } catch (e) {
      return { value: 0, components: [] };
    }
  }

  private async callChainlinkFeed(address: string): Promise<number> {
    const abi = ['function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)'];
    
    // 強制轉換為小寫再獲取 Checksum 地址，徹底解決 ethers 報錯
    const checksumAddress = ethers.getAddress(address.toLowerCase());

    const callProvider = async (provider: ethers.JsonRpcProvider) => {
      const contract = new ethers.Contract(checksumAddress, abi, provider);
      const result = await contract.latestRoundData();
      return Number(ethers.formatUnits(result[1], 8));
    };

    try {
      return await Promise.any(this.providers.map(p => callProvider(p)));
    } catch (error) {
      return await callProvider(this.providers[0]);
    }
  }

  async generateInterpolatedPoint() {
    if (this.lastC10Value.isZero()) return;
    const jitter = () => new Decimal(1).add((Math.random() - 0.5) * 0.0005);
    const c10Value = this.lastC10Value.mul(jitter()).toDecimalPlaces(6).toNumber();
    const goldValue = this.lastGoldValue.mul(jitter()).toDecimalPlaces(6).toNumber();
    const timestamp = new Date();

    try {
      await this.prisma.marketIndex.createMany({
        data: [
          { type: 'C10', value: c10Value, timestamp },
          { type: 'GOLD', value: goldValue, timestamp }
        ]
      });
      if (this.eventsGateway?.server) {
        this.eventsGateway.server.emit('indexUpdate', {
          c10: { value: c10Value, components: this.componentsCache },
          gold: { value: goldValue, components: this.goldComponentsCache },
          timestamp,
          source: 'interpolated',
        });
      }
    } catch (e) {}
  }

  /**
   * 清理定时器
   */
  onModuleDestroy() {
    if (this.exchangePriceInterval) {
      clearInterval(this.exchangePriceInterval);
    }
    if (this.oracleValidationInterval) {
      clearInterval(this.oracleValidationInterval);
    }
    if (this.millisecondPushInterval) {
      clearInterval(this.millisecondPushInterval);
    }
  }

  async getHistory(type: string, limit: number = 60) {
    return this.prisma.marketIndex.findMany({
      where: { type },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  getComponents() { return this.componentsCache; }
  getGoldComponents() { return this.goldComponentsCache; }

  async resetHistory() {
    await this.prisma.marketIndex.deleteMany({});
    return { success: true };
  }
}