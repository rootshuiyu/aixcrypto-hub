"use client";

import { useEffect } from 'react';
import { useAuth } from '../../hooks/use-auth';

/**
 * AuthProvider 现在只负责基础的登录状态维护。
 * Privy 自带持久化存储，我们不再需要手动触发 login() 防止无限循环。
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === 'authenticated' && user) {
      console.log('User session active:', user.username);
    }
  }, [status, user]);

  return <>{children}</>;
}
