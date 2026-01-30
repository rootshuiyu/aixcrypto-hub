/**
 * 支持的区块链网络配置
 */

export interface ChainConfig {
  id: number;
  name: string;
  type: 'testnet' | 'mainnet';
  rpcUrl: string;
  explorer: string;
  explorerApi: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  // 测试网
  {
    id: 11155111,
    name: 'Sepolia',
    type: 'testnet',
    rpcUrl: 'https://rpc.ankr.com/eth_sepolia',
    explorer: 'https://sepolia.etherscan.io',
    explorerApi: 'https://api-sepolia.etherscan.io/api',
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 84532,
    name: 'Base Sepolia',
    type: 'testnet',
    rpcUrl: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
    explorerApi: 'https://api-sepolia.basescan.org/api',
    nativeCurrency: { name: 'Base Sepolia ETH', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 421614,
    name: 'Arbitrum Sepolia',
    type: 'testnet',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorer: 'https://sepolia.arbiscan.io',
    explorerApi: 'https://api-sepolia.arbiscan.io/api',
    nativeCurrency: { name: 'Arbitrum Sepolia ETH', symbol: 'ETH', decimals: 18 },
  },
  // 主网
  {
    id: 1,
    name: 'Ethereum',
    type: 'mainnet',
    rpcUrl: 'https://rpc.ankr.com/eth',
    explorer: 'https://etherscan.io',
    explorerApi: 'https://api.etherscan.io/api',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 8453,
    name: 'Base',
    type: 'mainnet',
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    explorerApi: 'https://api.basescan.org/api',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 42161,
    name: 'Arbitrum One',
    type: 'mainnet',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    explorerApi: 'https://api.arbiscan.io/api',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
];

/**
 * 根据 chainId 获取链配置
 */
export function getChainById(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find(chain => chain.id === chainId);
}

/**
 * 获取所有支持的链
 */
export function getAllChains(): ChainConfig[] {
  return SUPPORTED_CHAINS;
}

/**
 * 获取测试网列表
 */
export function getTestnets(): ChainConfig[] {
  return SUPPORTED_CHAINS.filter(chain => chain.type === 'testnet');
}

/**
 * 获取主网列表
 */
export function getMainnets(): ChainConfig[] {
  return SUPPORTED_CHAINS.filter(chain => chain.type === 'mainnet');
}

/**
 * 合约类型定义
 */
export const CONTRACT_TYPES = {
  VAULT: 'vault',           // 资金金库合约
  PREDICTION: 'prediction', // 预测市场合约
  ORACLE: 'oracle',         // 预言机合约
  TOKEN: 'token',           // 代币合约
} as const;

export type ContractType = typeof CONTRACT_TYPES[keyof typeof CONTRACT_TYPES];

