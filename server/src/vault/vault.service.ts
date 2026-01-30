import { Injectable, Logger, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createPublicClient, createWalletClient, http, parseEther, formatEther, parseAbi, PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia, base, mainnet, arbitrum } from 'viem/chains';
import { EventsGateway } from '../events/events.gateway';
import { getChainById, CONTRACT_TYPES, ChainConfig } from '../contract/chains.config';

// Vault 合约 ABI (只包含我们需要调用的函数)
const VAULT_ABI = parseAbi([
  'function balances(address user, address token) view returns (uint256)',
  'function getBalance(address user, address token) view returns (uint256)',
  'function depositETH() payable',
  'function withdrawETH(uint256 amount)',
  'function depositToken(address token, uint256 amount)',
  'function withdrawToken(address token, uint256 amount)',
  'event Deposit(address indexed user, address indexed token, uint256 amount, uint256 timestamp)',
  'event Withdraw(address indexed user, address indexed token, uint256 amount, uint256 timestamp)',
]);

// 支持的链配置
const CHAIN_MAP: Record<number, any> = {
  1: mainnet,
  11155111: sepolia,
  8453: base,
  42161: arbitrum,
};

interface VaultConfig {
  address: `0x${string}`;
  chainId: number;
  chainName: string;
  rpcUrl: string;
  abi?: any;
}

@Injectable()
export class VaultService implements OnModuleInit {
  private readonly logger = new Logger(VaultService.name);
  private publicClient: PublicClient | null = null;
  private currentConfig: VaultConfig | null = null;
  private isVaultConfigured: boolean = false;

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * 模块初始化时加载合约配置
   */
  async onModuleInit() {
    await this.loadVaultConfig();
  }

  /**
   * 从数据库加载 Vault 合约配置
   */
  async loadVaultConfig(): Promise<void> {
    try {
      // 首先尝试从数据库获取主 Vault 合约配置
      const dbConfig = await this.prisma.contractConfig.findFirst({
        where: {
          type: CONTRACT_TYPES.VAULT,
          isActive: true,
          isPrimary: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (dbConfig) {
        // 使用数据库配置
        const chainConfig = getChainById(dbConfig.chainId);
        this.currentConfig = {
          address: dbConfig.address as `0x${string}`,
          chainId: dbConfig.chainId,
          chainName: dbConfig.chainName,
          rpcUrl: chainConfig?.rpcUrl || process.env.SEPOLIA_RPC_URL || 'https://rpc.ankr.com/eth_sepolia',
          abi: dbConfig.abi ? JSON.parse(dbConfig.abi) : VAULT_ABI,
        };
        this.isVaultConfigured = true;
        this.logger.log(`✅ Vault config loaded from DB: ${dbConfig.name} on ${dbConfig.chainName} (${dbConfig.address})`);
      } else {
        // 回退到环境变量配置
        const envAddress = process.env.VAULT_CONTRACT_ADDRESS;
        if (envAddress && envAddress !== '0x0000000000000000000000000000000000000000') {
          this.currentConfig = {
            address: envAddress as `0x${string}`,
            chainId: 11155111, // Sepolia
            chainName: 'Sepolia',
            rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.ankr.com/eth_sepolia',
          };
          this.isVaultConfigured = true;
          this.logger.log(`✅ Vault config loaded from ENV: ${envAddress}`);
        } else {
          this.isVaultConfigured = false;
          this.logger.warn('⚠️ No Vault contract configured. Please configure via Admin Panel or .env');
          this.logger.warn('   1. Admin Panel: /admin/contracts → Add Vault Contract');
          this.logger.warn('   2. Or set VAULT_CONTRACT_ADDRESS in .env');
        }
      }

      // 创建 PublicClient
      if (this.currentConfig) {
        const chain = CHAIN_MAP[this.currentConfig.chainId] || sepolia;
        this.publicClient = createPublicClient({
          chain,
          transport: http(this.currentConfig.rpcUrl),
        }) as any;
      }
    } catch (error: any) {
      this.logger.error(`Failed to load Vault config: ${error.message}`);
      this.isVaultConfigured = false;
    }
  }

  /**
   * 刷新合约配置（供外部调用）
   */
  async refreshConfig(): Promise<{ success: boolean; config?: VaultConfig }> {
    await this.loadVaultConfig();
    return {
      success: this.isVaultConfigured,
      config: this.currentConfig || undefined,
    };
  }

  /**
   * 获取当前配置状态
   */
  getConfigStatus() {
    return {
      isConfigured: this.isVaultConfigured,
      config: this.currentConfig ? {
        address: this.currentConfig.address,
        chainId: this.currentConfig.chainId,
        chainName: this.currentConfig.chainName,
      } : null,
    };
  }

  /**
   * 获取用户链上余额
   */
  async getOnChainBalance(userAddress: string, tokenAddress: string = '0x0000000000000000000000000000000000000000') {
    // 如果 Vault 合约未配置，返回模拟数据
    if (!this.isVaultConfigured || !this.publicClient || !this.currentConfig) {
      this.logger.warn('Vault contract not configured, returning mock balance');
      return {
        address: userAddress,
        token: tokenAddress === '0x0000000000000000000000000000000000000000' ? 'ETH' : tokenAddress,
        balance: '0',
        balanceWei: '0',
        isConfigured: false,
        message: 'Vault contract not configured. Please configure via Admin Panel.',
      };
    }

    try {
      const abi = this.currentConfig.abi || VAULT_ABI;
      const balance = await (this.publicClient as any).readContract({
        address: this.currentConfig.address,
        abi,
        functionName: 'getBalance',
        args: [userAddress as `0x${string}`, tokenAddress as `0x${string}`],
      });

      return {
        address: userAddress,
        token: tokenAddress === '0x0000000000000000000000000000000000000000' ? 'ETH' : tokenAddress,
        balance: formatEther(balance as bigint),
        balanceWei: (balance as bigint).toString(),
        isConfigured: true,
        chain: this.currentConfig.chainName,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get on-chain balance: ${error.message}`);
      throw new BadRequestException('Failed to fetch on-chain balance');
    }
  }

  /**
   * 生成充值交易数据 (前端签名)
   */
  async prepareDepositTx(userAddress: string, amount: string) {
    if (!this.currentConfig) {
      throw new BadRequestException('Vault contract not configured');
    }
    
    const amountWei = parseEther(amount);
    
    return {
      to: this.currentConfig.address,
      value: amountWei.toString(),
      data: '0xf6326fb3', // depositETH() 函数选择器
      chainId: this.currentConfig.chainId,
      chainName: this.currentConfig.chainName,
      estimatedGas: '50000',
    };
  }

  /**
   * 生成提现交易数据 (前端签名)
   * 增加风控：单笔提现金额限制
   */
  async prepareWithdrawTx(userAddress: string, amount: string) {
    if (!this.currentConfig) {
      throw new BadRequestException('Vault contract not configured');
    }
    
    // 增加风控限制：单笔提现不能超过 1 ETH (示例)
    const amountFloat = parseFloat(amount);
    if (amountFloat > 1.0) {
      this.logger.warn(`[RISK_CONTROL] Large withdrawal attempt: ${amount} ETH from ${userAddress}`);
      throw new BadRequestException('Withdrawal amount exceeds single transaction limit (1.0 ETH). Please contact support for large transfers.');
    }
    
    const amountWei = parseEther(amount);
    
    // 编码 withdrawETH(uint256) 函数调用
    const data = `0x2e1a7d4d${amountWei.toString(16).padStart(64, '0')}`;
    
    return {
      to: this.currentConfig.address,
      value: '0',
      data,
      chainId: this.currentConfig.chainId,
      chainName: this.currentConfig.chainName,
      estimatedGas: '80000',
    };
  }

  /**
   * 创建充值记录 (等待链上确认) - 持久化到数据库
   */
  async createDepositRecord(userId: string, txHash: string, amount: string, token: string = 'ETH') {
    // 检查是否已存在相同的交易哈希
    const existing = await this.prisma.transaction.findUnique({
      where: { txHash }
    });
    
    if (existing) {
      this.logger.warn(`Deposit record already exists: ${txHash}`);
      return existing;
    }

    const record = await this.prisma.transaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        amount: parseFloat(amount),
        token,
        txHash,
        status: 'PENDING',
      }
    });

    this.logger.log(`Deposit recorded to DB: ${txHash} - ${amount} ${token}`);
    
    // 🆕 实时通知管理后台
    this.eventsGateway.server.emit('admin:newTransaction', {
      type: 'DEPOSIT',
      userId,
      amount,
      txHash,
      timestamp: record.createdAt
    });

    return record;
  }

  /**
   * 创建提现记录 (等待链上确认) - 持久化到数据库
   */
  async createWithdrawRecord(userId: string, txHash: string, amount: string, token: string = 'ETH') {
    // 检查是否已存在相同的交易哈希
    const existing = await this.prisma.transaction.findUnique({
      where: { txHash }
    });
    
    if (existing) {
      this.logger.warn(`Withdraw record already exists: ${txHash}`);
      return existing;
    }

    const record = await this.prisma.transaction.create({
      data: {
        userId,
        type: 'WITHDRAW',
        amount: parseFloat(amount),
        token,
        txHash,
        status: 'PENDING',
      }
    });

    this.logger.log(`Withdraw recorded to DB: ${txHash} - ${amount} ${token}`);

    // 🆕 实时通知管理后台
    this.eventsGateway.server.emit('admin:newTransaction', {
      type: 'WITHDRAW',
      userId,
      amount,
      txHash,
      timestamp: record.createdAt
    });

    return record;
  }

  /**
   * 确认交易状态 - 从链上验证并更新数据库
   */
  async confirmTransaction(txHash: string) {
    try {
      // 从数据库获取记录
      const tx = await this.prisma.transaction.findUnique({
        where: { txHash }
      });

      if (!tx) {
        throw new NotFoundException('Transaction not found');
      }

      // 如果已经确认，直接返回
      if (tx.status === 'CONFIRMED') {
        return { status: 'CONFIRMED', transaction: tx };
      }

      // 检查 publicClient 是否可用
      if (!this.publicClient) {
        this.logger.warn('PublicClient not available, cannot confirm transaction');
        return { status: 'PENDING', message: 'Chain client not configured' };
      }

      // 从链上获取交易收据
      const receipt = await this.publicClient.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      if (receipt.status === 'success') {
        // 更新数据库状态
        const updatedTx = await this.prisma.transaction.update({
          where: { txHash },
          data: {
            status: 'CONFIRMED',
            confirmedAt: new Date(),
          }
        });

        // 如果是充值，增加用户 PTS (1 ETH = 10000 PTS 的示例比例)
        if (tx.type === 'DEPOSIT') {
          const ptsAmount = tx.amount * 10000;
          
          const updatedUser = await this.prisma.$transaction(async (ptx) => {
            const user = await ptx.user.findUnique({ where: { id: tx.userId } });
            if (!user) throw new Error('User not found');
            
            return ptx.user.update({
              where: { id: tx.userId, version: user.version },
              data: { 
                pts: { increment: ptsAmount },
                version: { increment: 1 }
              }
            });
          });
          
          // 通知用户余额更新
          this.eventsGateway.emitBalanceUpdate(tx.userId, updatedUser.pts);
          
          this.logger.log(`Deposit confirmed: ${txHash}, +${ptsAmount} PTS for user ${tx.userId}`);
        }

        return { status: 'CONFIRMED', transaction: updatedTx, receipt };
      } else {
        // 交易失败
        const updatedTx = await this.prisma.transaction.update({
          where: { txHash },
          data: { status: 'FAILED' }
        });
        return { status: 'FAILED', transaction: updatedTx, receipt };
      }
    } catch (error) {
      this.logger.error(`Failed to confirm transaction: ${error.message}`);
      // 交易可能还在 pending 状态
      return { status: 'PENDING' };
    }
  }

  /**
   * 定时检查待确认的交易 (每30秒)
   */
  @Cron('*/30 * * * * *')
  async checkPendingTransactions() {
    try {
      const pendingTxs = await this.prisma.transaction.findMany({
        where: { status: 'PENDING' },
        take: 20,
        orderBy: { createdAt: 'asc' }
      });

      for (const tx of pendingTxs) {
        try {
          await this.confirmTransaction(tx.txHash);
        } catch (error) {
          // 单个交易失败不影响其他交易
          this.logger.error(`Failed to check tx ${tx.txHash}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Pending transaction check error: ${error.message}`);
    }
  }

  /**
   * 获取用户交易历史 - 从数据库查询
   */
  async getTransactionHistory(userId: string, limit: number = 20) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * 获取全局交易历史（管理后台用）
   */
  async getGlobalTransactionHistory(limit: number = 50) {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { username: true, address: true }
        }
      }
    });
  }

  /**
   * 获取合约信息
   */
  getContractInfo() {
    if (!this.currentConfig) {
      return {
        isConfigured: false,
        message: 'Vault contract not configured',
      };
    }
    
    const chainConfig = getChainById(this.currentConfig.chainId);
    return {
      isConfigured: true,
      address: this.currentConfig.address,
      chainId: this.currentConfig.chainId,
      chainName: this.currentConfig.chainName,
      rpcUrl: this.currentConfig.rpcUrl,
      explorer: chainConfig?.explorer,
    };
  }

  /**
   * 获取金库统计数据
   */
  async getVaultStats() {
    const totalDeposits = await this.prisma.transaction.aggregate({
      where: { type: 'DEPOSIT', status: 'CONFIRMED' },
      _sum: { amount: true },
      _count: true,
    });

    const totalWithdraws = await this.prisma.transaction.aggregate({
      where: { type: 'WITHDRAW', status: 'CONFIRMED' },
      _sum: { amount: true },
      _count: true,
    });

    const pendingCount = await this.prisma.transaction.count({
      where: { status: 'PENDING' }
    });

    return {
      totalDeposited: totalDeposits._sum.amount || 0,
      depositCount: totalDeposits._count,
      totalWithdrawn: totalWithdraws._sum.amount || 0,
      withdrawCount: totalWithdraws._count,
      pendingTransactions: pendingCount,
      netFlow: (totalDeposits._sum.amount || 0) - (totalWithdraws._sum.amount || 0),
    };
  }
}
