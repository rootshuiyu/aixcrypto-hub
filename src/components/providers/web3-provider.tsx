"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '../../lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import { ErrorBoundary } from "react-error-boundary";

// 單例模式防止重複初始化
let globalQueryClient: QueryClient | null = null;

const getQueryClient = () => {
  if (typeof window === "undefined") return new QueryClient();
  if (!globalQueryClient) {
    globalQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5,
          gcTime: 1000 * 60 * 30,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
  }
  return globalQueryClient;
};

function Web3ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
      <p>Web3 Provider Error: {error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="mt-2 text-xs underline hover:no-underline"
      >
        Try again
      </button>
    </div>
  );
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // 使用 ref 保證在組件生命週期內 client 不變
  const queryClientRef = useRef<QueryClient>();
  if (!queryClientRef.current) {
    queryClientRef.current = getQueryClient();
  }

  return (
    <ErrorBoundary FallbackComponent={Web3ErrorFallback}>
      <WagmiProvider config={config} reconnectOnMount={false}>
        <QueryClientProvider client={queryClientRef.current}>
          <RainbowKitProvider 
            theme={darkTheme({
              accentColor: '#8a2be2',
              accentColorForeground: 'white',
              borderRadius: 'large',
              overlayBlur: 'small',
            })}
            initialChain={undefined}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}
