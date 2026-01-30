"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    // 🆕 修复：WebSocket 连接不依赖用户登录，公共数据（如价格）需要实时推送
    const socketInstance = io('http://localhost:3001', {
      query: { userId: user?.id || 'guest' },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,  // 无限重连
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket Connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ WebSocket Disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ WebSocket Connection Error:', error);
    });

    // 🆕 调试：监听价格更新事件，确认数据流
    socketInstance.on('indexUpdate', (data) => {
      console.log('📊 indexUpdate received:', { 
        c10: data?.c10?.value, 
        gold: data?.gold?.value,
        timestamp: data?.timestamp 
      });
    });

    socketInstance.on('indexUpdateMicro', (data) => {
      console.log('⚡ indexUpdateMicro received:', { 
        c10: data?.c10?.value, 
        gold: data?.gold?.value,
        timestamp: data?.timestamp 
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.off('indexUpdate');
      socketInstance.off('indexUpdateMicro');
      socketInstance.disconnect();
    };
  }, [user?.id]);

  // 监听当前用户的特定事件
  useEffect(() => {
    if (socket && user?.id) {
      const userId = user.id;

      // 监听任务更新
      const taskUpdateHandler = (data: any) => {
        console.log('Real-time Task Update:', data);
        // 立即刷新任务查询
        queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
      };

      // 监听余额更新
      const balanceUpdateHandler = (pts: number) => {
        console.log('Real-time Balance Update:', pts);
        // 手动更新 React Query 缓存中的用户资料
        queryClient.setQueryData(["userProfile", userId], (oldData: any) => {
          if (!oldData) return oldData;
          return { ...oldData, pts };
        });
        queryClient.invalidateQueries({ queryKey: ["userRecentActivity", userId] });
        queryClient.invalidateQueries({ queryKey: ["battleStats", userId] });
      };

      // 监听下注成功
      const betSuccessHandler = (data: any) => {
        console.log('Real-time Bet Success:', data);
        queryClient.invalidateQueries({ queryKey: ["markets"] });
        queryClient.invalidateQueries({ queryKey: ["userRecentActivity", userId] });
      };

      // 监听全局系统广播
      const systemBroadcastHandler = (data: any) => {
        console.log('System Broadcast Received:', data);
        
        // 如果是任务更新广播，刷新所有任务列表
        if (data.type === 'QUEST_UPDATE') {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
      };

      // 🆕 监听回合结算事件
      const roundSettledHandler = (data: any) => {
        console.log('Round Settled:', data);
        queryClient.invalidateQueries({ queryKey: ["markets"] });
        queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
        queryClient.invalidateQueries({ queryKey: ["recentBets"] });
        queryClient.invalidateQueries({ queryKey: ["userRecentActivity", userId] });
      };

      // 🆕 监听新回合开始事件
      const roundStartHandler = (data: any) => {
        console.log('New Round Started:', data);
        queryClient.invalidateQueries({ queryKey: ["markets"] });
      };

      socket.on(`taskUpdate:${userId}`, taskUpdateHandler);
      socket.on(`balanceUpdate:${userId}`, balanceUpdateHandler);
      socket.on(`betSuccess:${userId}`, betSuccessHandler);
      socket.on('systemBroadcast', systemBroadcastHandler);
      socket.on('roundSettled', roundSettledHandler);
      socket.on('roundStart', roundStartHandler);

      return () => {
        socket.off(`taskUpdate:${userId}`, taskUpdateHandler);
        socket.off(`balanceUpdate:${userId}`, balanceUpdateHandler);
        socket.off(`betSuccess:${userId}`, betSuccessHandler);
        socket.off('systemBroadcast', systemBroadcastHandler);
        socket.off('roundSettled', roundSettledHandler);
        socket.off('roundStart', roundStartHandler);
      };
    }
  }, [socket, user?.id, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

