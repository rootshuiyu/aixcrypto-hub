"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 忽略 MetaMask 相关的错误
    if (error?.message?.includes("MetaMask") || 
        error?.message?.includes("ethereum") ||
        error?.stack?.includes("chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn")) {
      console.warn("Ignoring MetaMask extension error:", error.message);
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 忽略 MetaMask 扩展错误
    if (error?.message?.includes("MetaMask") || 
        error?.message?.includes("ethereum") ||
        error?.stack?.includes("chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn")) {
      console.warn("Ignoring MetaMask extension error:", error.message);
      return;
    }
    
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 border border-border bg-card">
            <h2 className="text-xl font-black uppercase mb-4">Error</h2>
            <p className="text-sm text-muted-foreground mb-4">{this.state.error.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-admin-accent text-[10px] font-black uppercase"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

