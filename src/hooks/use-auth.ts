"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useLanguageStore } from "@/stores/language-store";
import { useUIStore } from "@/stores/ui-store";
import { api } from "@/lib/api";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function useAuth() {
  const { 
    ready, 
    authenticated, 
    user: privyUser, 
    login: privyLogin, 
    logout: privyLogout,
    linkWallet: privyLinkWallet,
    linkTwitter: privyLinkTwitter,
    linkDiscord: privyLinkDiscord,
    linkEmail: privyLinkEmail
  } = usePrivy();
  
  const { wallets } = useWallets();
  const { user: dbUser, setStatus, setUser, setToken, status, logout: storeLogout } = useAuthStore();
  const { t } = useLanguageStore();
  const { showNotification } = useUIStore();
  const syncingRef = useRef(false);

  const syncUserToBackend = useCallback(async (isReconnect = false) => {
    if (!privyUser || syncingRef.current) return;

    try {
      syncingRef.current = true;
      if (!isReconnect) setStatus('loading');

      const address = privyUser.wallet?.address || null;
      const email = privyUser.email?.address || null;
      const twitterId = privyUser.twitter?.username || null;
      const discordId = privyUser.discord?.username || null;
      
      // 获取推荐码
      const referrerCode = localStorage.getItem('referrerCode');

      const { data } = await axios.post(`${API_BASE}/auth/verify-privy`, {
        privyId: privyUser.id,
        address,
        email,
        twitterId,
        discordId,
        referrerCode
      });

      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
      }
      
      setUser(data.user);
      setStatus('authenticated');

      // 新用户欢迎提醒
      if (data.isNewUser && t?.welcome?.newUser) {
        showNotification(t.welcome.newUser, 'SUCCESS');
        localStorage.removeItem('referrerCode');
      }

    } catch (error) {
      console.error('Failed to sync user with backend:', error);
      setStatus('unauthenticated');
    } finally {
      syncingRef.current = false;
    }
  }, [privyUser, setUser, setToken, setStatus, showNotification, t]);

  // 初始化时从 localStorage 恢复 token
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, [setToken]);

  useEffect(() => {
    if (ready && authenticated && privyUser && !dbUser && !syncingRef.current) {
      syncUserToBackend();
    } else if (ready && !authenticated) {
      setStatus('unauthenticated');
    }
  }, [ready, authenticated, privyUser, dbUser, syncUserToBackend, setStatus]);

  // 监听 Privy 用户信息变更（如绑定新账号）
  const linkedAccountsKey = privyUser?.linkedAccounts?.map(a => a.type + (a as any).address + (a as any).username).join(',');
  
  useEffect(() => {
    if (ready && authenticated && privyUser && dbUser && !syncingRef.current) {
      const currentAddress = privyUser.wallet?.address;
      const currentEmail = privyUser.email?.address;
      const currentTwitter = privyUser.twitter?.username;
      const currentDiscord = privyUser.discord?.username;

      const needsSync = 
        (currentAddress && currentAddress !== dbUser.address) ||
        (currentEmail && currentEmail !== dbUser.email) ||
        (currentTwitter && currentTwitter !== dbUser.twitterId) ||
        (currentDiscord && currentDiscord !== dbUser.discordId);

      if (needsSync) {
        console.log('Detected new linked account, syncing to backend...');
        syncUserToBackend(true);
      }
    }
  }, [linkedAccountsKey, ready, authenticated, privyUser, dbUser, syncUserToBackend]);

  const login = () => {
    setStatus('loading');
    privyLogin();
  };

  const logout = () => {
    storeLogout();
    privyLogout();
    localStorage.removeItem('auth_token');
  };

  // 统一身份对象
  const user = dbUser ? {
    ...dbUser,
    username: dbUser.username || privyUser?.twitter?.username || privyUser?.discord?.username || "Explorer"
  } : null;

  return { 
    user, 
    status, 
    login, 
    logout, 
    linkWallet: privyLinkWallet,
    linkTwitter: privyLinkTwitter,
    linkDiscord: privyLinkDiscord,
    linkEmail: privyLinkEmail,
    isConnected: authenticated, 
    address: user?.address || privyUser?.wallet?.address 
  };
}
