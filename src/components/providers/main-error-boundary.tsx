"use client";

import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * 专门用于屏蔽 MetaMask 注入错误导致的页面白屏
 */
export class MainErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 检测是否为 MetaMask 相关错误
    const errorMsg = error.message?.toLowerCase() || "";
    const isMetaMaskError = 
      errorMsg.includes("metamask") || 
      errorMsg.includes("injected") ||
      errorMsg.includes("provider") ||
      errorMsg.includes("walletconnect");

    if (isMetaMaskError) {
      console.warn("Caught and ignored Web3/MetaMask error:", error.message);
      // 仍然标记为没有崩溃，因为我们要静默忽略它
      return { hasError: false };
    }

    // 🆕 记录所有错误到控制台以供调试
    console.error("MainErrorBoundary caught an error:", error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 可以在这里记录到日志系统
    console.debug("Error Info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-center">
          <h2 className="mb-4 text-xl font-bold text-white">Something went wrong</h2>
          <button
            className="rounded bg-white px-4 py-2 text-black"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

