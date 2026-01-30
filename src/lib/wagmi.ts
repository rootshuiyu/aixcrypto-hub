import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { mainnet, arbitrum, optimism, polygon, sepolia } from 'viem/chains';

const RPC_ENDPOINTS = {
  mainnet: process.env.NEXT_PUBLIC_MAINNET_RPC || 'https://rpc.ankr.com/eth',
  arbitrum: process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://rpc.ankr.com/arbitrum',
  polygon: process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://rpc.ankr.com/polygon',
  optimism: process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'https://rpc.ankr.com/optimism',
  sepolia: process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://rpc.ankr.com/eth_sepolia',
};

export const config = getDefaultConfig({
  appName: 'Superoctop Hub',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id', 
  chains: [mainnet, arbitrum, optimism, polygon, sepolia],
  transports: {
    [mainnet.id]: http(RPC_ENDPOINTS.mainnet),
    [arbitrum.id]: http(RPC_ENDPOINTS.arbitrum),
    [polygon.id]: http(RPC_ENDPOINTS.polygon),
    [optimism.id]: http(RPC_ENDPOINTS.optimism),
    [sepolia.id]: http(RPC_ENDPOINTS.sepolia),
  },
  ssr: true, 
});
