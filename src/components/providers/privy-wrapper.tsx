"use client";

import { PrivyProvider } from '@privy-io/react-auth';
import { mainnet, arbitrum, optimism, polygon, sepolia } from 'viem/chains';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

export function PrivyWrapper({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmkgl3ppv04scjy0cbvjco4h1";
  
  // 配置 Solana 錢包連接器
  const solanaConnectors = toSolanaWalletConnectors({
    shouldAutoConnect: false,
  });

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['wallet', 'email', 'google', 'twitter', 'discord'],
        appearance: {
          theme: 'dark',
          accentColor: '#8a2be2',
          showWalletLoginFirst: false,
          logo: '/octopus-logo.png',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        // EVM 鏈配置
        defaultChain: arbitrum,
        supportedChains: [mainnet, arbitrum, optimism, polygon, sepolia],
        // Solana 錢包配置
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
        // 錢包連接配置
        walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      }}
    >
      {children}
    </PrivyProvider>
  );
}