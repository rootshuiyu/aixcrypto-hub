import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { createPublicClient, http, isAddress } from 'viem';
import { getChainById, getAllChains, ChainConfig, CONTRACT_TYPES } from './chains.config';

interface CreateContractDto {
  name: string;
  type: string;
  version?: string;
  chainId: number;
  address: string;
  abi?: string;
  isPrimary?: boolean;
  deployedAt?: Date;
  deployTxHash?: string;
  deployer?: string;
  metadata?: string;
  notes?: string;
}

interface UpdateContractDto {
  name?: string;
  version?: string;
  address?: string;
  abi?: string;
  isActive?: boolean;
  isPrimary?: boolean;
  metadata?: string;
  notes?: string;
}

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);
  
  // 缓存：type -> ContractConfig
  private contractCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 分钟

  constructor(private prisma: PrismaService) {}

  /**
   * 获取所有合约配置
   */
  async getAllContracts() {
    const contracts = await this.prisma.contractConfig.findMany({
      orderBy: [
        { type: 'asc' },
        { chainId: 'asc' },
        { isPrimary: 'desc' },
      ],
    });

    // 按类型分组
    const grouped = contracts.reduce((acc, contract) => {
      if (!acc[contract.type]) {
        acc[contract.type] = [];
      }
      acc[contract.type].push({
        ...contract,
        chain: getChainById(contract.chainId),
      });
      return acc;
    }, {} as Record<string, any[]>);

    return {
      contracts,
      grouped,
      supportedChains: getAllChains(),
      contractTypes: CONTRACT_TYPES,
    };
  }

  /**
   * 获取指定类型的主合约配置
   */
  async getPrimaryContract(type: string, chainId?: number) {
    const cacheKey = `${type}_${chainId || 'any'}`;
    
    // 检查缓存
    if (this.contractCache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey) || 0;
      if (Date.now() < expiry) {
        return this.contractCache.get(cacheKey);
      }
    }

    const where: any = {
      type,
      isActive: true,
      isPrimary: true,
    };
    
    if (chainId) {
      where.chainId = chainId;
    }

    const contract = await this.prisma.contractConfig.findFirst({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    if (contract) {
      // 更新缓存
      this.contractCache.set(cacheKey, {
        ...contract,
        chain: getChainById(contract.chainId),
      });
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
    }

    return contract ? {
      ...contract,
      chain: getChainById(contract.chainId),
    } : null;
  }

  /**
   * 获取指定类型的所有合约
   */
  async getContractsByType(type: string) {
    const contracts = await this.prisma.contractConfig.findMany({
      where: { type },
      orderBy: [
        { isPrimary: 'desc' },
        { isActive: 'desc' },
        { chainId: 'asc' },
      ],
    });

    return contracts.map(c => ({
      ...c,
      chain: getChainById(c.chainId),
    }));
  }

  /**
   * 获取单个合约配置
   */
  async getContractById(id: string) {
    const contract = await this.prisma.contractConfig.findUnique({
      where: { id },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return {
      ...contract,
      chain: getChainById(contract.chainId),
    };
  }

  /**
   * 添加新合约配置
   */
  async addContract(data: CreateContractDto) {
    // 验证地址格式
    if (!isAddress(data.address)) {
      throw new BadRequestException('Invalid contract address format');
    }

    // 验证链 ID
    const chain = getChainById(data.chainId);
    if (!chain) {
      throw new BadRequestException(`Unsupported chain ID: ${data.chainId}`);
    }

    // 如果设为主合约，先取消其他主合约
    if (data.isPrimary) {
      await this.prisma.contractConfig.updateMany({
        where: {
          type: data.type,
          chainId: data.chainId,
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    const contract = await this.prisma.contractConfig.create({
      data: {
        name: data.name,
        type: data.type,
        version: data.version || '1.0.0',
        chainId: data.chainId,
        chainName: chain.name,
        address: data.address.toLowerCase(),
        abi: data.abi,
        isPrimary: data.isPrimary || false,
        deployedAt: data.deployedAt,
        deployTxHash: data.deployTxHash,
        deployer: data.deployer,
        metadata: data.metadata,
        notes: data.notes,
      },
    });

    this.logger.log(`Contract added: ${data.name} on ${chain.name} (${data.address})`);
    this.clearCache(data.type);

    return {
      ...contract,
      chain,
    };
  }

  /**
   * 更新合约配置
   */
  async updateContract(id: string, data: UpdateContractDto) {
    const existing = await this.prisma.contractConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Contract not found');
    }

    // 验证地址格式
    if (data.address && !isAddress(data.address)) {
      throw new BadRequestException('Invalid contract address format');
    }

    // 如果设为主合约，先取消其他主合约
    if (data.isPrimary && !existing.isPrimary) {
      await this.prisma.contractConfig.updateMany({
        where: {
          type: existing.type,
          chainId: existing.chainId,
          isPrimary: true,
          id: { not: id },
        },
        data: { isPrimary: false },
      });
    }

    const contract = await this.prisma.contractConfig.update({
      where: { id },
      data: {
        ...data,
        address: data.address?.toLowerCase(),
      },
    });

    this.logger.log(`Contract updated: ${contract.name} (${id})`);
    this.clearCache(existing.type);

    return {
      ...contract,
      chain: getChainById(contract.chainId),
    };
  }

  /**
   * 设为主合约
   */
  async setAsPrimary(id: string) {
    const contract = await this.prisma.contractConfig.findUnique({
      where: { id },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // 取消同类型同链的其他主合约
    await this.prisma.contractConfig.updateMany({
      where: {
        type: contract.type,
        chainId: contract.chainId,
        isPrimary: true,
        id: { not: id },
      },
      data: { isPrimary: false },
    });

    // 设为主合约
    const updated = await this.prisma.contractConfig.update({
      where: { id },
      data: { isPrimary: true, isActive: true },
    });

    this.logger.log(`Contract set as primary: ${contract.name} on chainId ${contract.chainId}`);
    this.clearCache(contract.type);

    return {
      ...updated,
      chain: getChainById(updated.chainId),
    };
  }

  /**
   * 切换启用状态
   */
  async toggleActive(id: string) {
    const contract = await this.prisma.contractConfig.findUnique({
      where: { id },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // 如果是主合约且要禁用，不允许
    if (contract.isPrimary && contract.isActive) {
      throw new BadRequestException('Cannot disable primary contract. Set another contract as primary first.');
    }

    const updated = await this.prisma.contractConfig.update({
      where: { id },
      data: { isActive: !contract.isActive },
    });

    this.logger.log(`Contract ${updated.isActive ? 'enabled' : 'disabled'}: ${contract.name}`);
    this.clearCache(contract.type);

    return {
      ...updated,
      chain: getChainById(updated.chainId),
    };
  }

  /**
   * 删除合约配置
   */
  async deleteContract(id: string) {
    const contract = await this.prisma.contractConfig.findUnique({
      where: { id },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // 不允许删除主合约
    if (contract.isPrimary) {
      throw new BadRequestException('Cannot delete primary contract. Set another contract as primary first.');
    }

    await this.prisma.contractConfig.delete({
      where: { id },
    });

    this.logger.log(`Contract deleted: ${contract.name} (${id})`);
    this.clearCache(contract.type);

    return { success: true, deleted: contract };
  }

  /**
   * 验证合约地址
   */
  async verifyAddress(chainId: number, address: string) {
    // 验证地址格式
    if (!isAddress(address)) {
      return { valid: false, error: 'Invalid address format' };
    }

    const chain = getChainById(chainId);
    if (!chain) {
      return { valid: false, error: 'Unsupported chain' };
    }

    try {
      const client = createPublicClient({
        transport: http(chain.rpcUrl),
      });

      // 检查地址是否是合约
      const code = await client.getBytecode({ address: address as `0x${string}` });
      
      if (!code || code === '0x') {
        return { 
          valid: false, 
          error: 'Address is not a contract (no bytecode found)',
          isContract: false,
        };
      }

      return {
        valid: true,
        isContract: true,
        chain: chain.name,
        explorerUrl: `${chain.explorer}/address/${address}`,
      };
    } catch (error: any) {
      this.logger.error(`Failed to verify address: ${error.message}`);
      return { valid: false, error: error.message };
    }
  }

  /**
   * 从区块浏览器获取 ABI
   */
  async fetchAbiFromExplorer(chainId: number, address: string) {
    const chain = getChainById(chainId);
    if (!chain) {
      throw new BadRequestException('Unsupported chain');
    }

    try {
      // 获取 API key（可从环境变量读取）
      const apiKey = process.env[`${chain.name.toUpperCase().replace(' ', '_')}_API_KEY`] || '';
      
      const url = `${chain.explorerApi}?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json() as { status: string; result?: string; message?: string };

      if (data.status === '1' && data.result) {
        return {
          success: true,
          abi: data.result,
          verified: true,
        };
      } else {
        return {
          success: false,
          error: data.message || 'Contract not verified or ABI not available',
          verified: false,
        };
      }
    } catch (error: any) {
      this.logger.error(`Failed to fetch ABI: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 测试合约连接
   */
  async testConnection(id: string) {
    const contract = await this.getContractById(id);
    const chain = getChainById(contract.chainId);

    if (!chain) {
      return { success: false, error: 'Invalid chain configuration' };
    }

    try {
      const startTime = Date.now();
      const client = createPublicClient({
        transport: http(chain.rpcUrl),
      });

      // 获取合约字节码验证合约存在
      const code = await client.getBytecode({ 
        address: contract.address as `0x${string}` 
      });
      
      const latency = Date.now() - startTime;

      if (!code || code === '0x') {
        return {
          success: false,
          error: 'Contract not found at address',
          latency,
        };
      }

      return {
        success: true,
        latency,
        bytecodeSize: code.length,
        chain: chain.name,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取支持的链列表
   */
  getSupportedChains(): ChainConfig[] {
    return getAllChains();
  }

  /**
   * 清除缓存
   */
  clearCache(type?: string) {
    if (type) {
      // 清除指定类型的缓存
      for (const key of this.contractCache.keys()) {
        if (key.startsWith(type)) {
          this.contractCache.delete(key);
          this.cacheExpiry.delete(key);
        }
      }
    } else {
      // 清除所有缓存
      this.contractCache.clear();
      this.cacheExpiry.clear();
    }
    this.logger.log(`Cache cleared${type ? ` for type: ${type}` : ''}`);
  }

  /**
   * 刷新所有缓存
   */
  async refreshCache() {
    this.clearCache();
    // 预热常用合约缓存
    await this.getPrimaryContract('vault');
    return { success: true, message: 'Cache refreshed' };
  }
}

