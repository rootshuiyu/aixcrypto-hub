"use client";

import { useEffect } from "react";

/**
 * 检查错误是否来自 MetaMask 扩展
 */
function isMetaMaskError(message: string, source?: string): boolean {
  const metaMaskKeywords = [
    "MetaMask",
    "metamask",
    "ethereum",
    "连接MetaMask",
    "连接 MetaMask",
    "MetaMask connection",
    "chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn",
  ];
  
  const lowerMessage = message.toLowerCase();
  const hasKeyword = metaMaskKeywords.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase()) || 
    source?.includes(keyword)
  );
  
  return hasKeyword;
}

/**
 * 全局错误处理组件
 * 用于忽略 MetaMask 扩展注入的错误
 */
export function ErrorHandler() {
  useEffect(() => {
    // 捕获未处理的 Promise 拒绝
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = typeof reason === "string" 
        ? reason 
        : reason?.message || reason?.toString() || "";
      
      if (isMetaMaskError(message)) {
        console.warn("Ignoring MetaMask extension error:", message);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    // 捕获全局错误
    const handleError = (event: ErrorEvent) => {
      const { message, filename, error } = event;
      const errorMessage = message || error?.message || "";
      const source = filename || error?.stack || "";
      
      if (isMetaMaskError(errorMessage, source)) {
        console.warn("Ignoring MetaMask extension error:", errorMessage);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    // 捕获 console.error（某些错误可能通过 console.error 输出）
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === "string" ? arg : JSON.stringify(arg)
      ).join(" ");
      
      if (isMetaMaskError(message)) {
        // 静默忽略，不输出到控制台
        return;
      }
      
      originalConsoleError.apply(console, args);
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection, true);
    window.addEventListener("error", handleError, true);

    // 清理
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection, true);
      window.removeEventListener("error", handleError, true);
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}

