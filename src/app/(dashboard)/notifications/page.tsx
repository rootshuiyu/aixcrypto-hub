"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingOctopus, InkParticles, TentacleWaves } from "@/components/ui/octopus-decorations";
import { SparklesCore } from "@/components/aceternity/sparkles";
import { OctoNotification } from "@/components/icons/octopus-icons";

// 章鱼主题图标
const OctoIcons = {
  Bell: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M6 17c-1 1 0 2 1 3" strokeLinecap="round" opacity="0.4" />
      <path d="M18 17c1 1 0 2-1 3" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  CheckAll: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="18 6 9 17 4 12" />
      <polyline points="22 6 13 17" opacity="0.5" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

// 通知类型配置
const notificationTypes: Record<string, { color: string; icon: string; bgColor: string }> = {
  BET_WIN: { color: "text-green-400", icon: "🎉", bgColor: "bg-green-500" },
  BET_LOSE: { color: "text-red-400", icon: "💔", bgColor: "bg-red-500" },
  BATTLE: { color: "text-purple-400", icon: "⚔️", bgColor: "bg-purple-500" },
  REFERRAL: { color: "text-cyan-400", icon: "🤝", bgColor: "bg-cyan-500" },
  REWARD: { color: "text-yellow-400", icon: "🎁", bgColor: "bg-yellow-500" },
  SYSTEM: { color: "text-blue-400", icon: "📢", bgColor: "bg-blue-500" },
};

// 通知卡片组件
const NotificationCard = ({ notification, onMarkRead, onDelete, index }: any) => {
  const config = notificationTypes[notification.type] || notificationTypes.SYSTEM;
  
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className={`relative group rounded-2xl border transition-all overflow-hidden ${
        notification.isRead 
          ? 'bg-white/[0.02] border-white/5' 
          : 'bg-cyan-500/5 border-cyan-500/20'
      }`}
    >
      {/* 未读指示条 */}
      {!notification.isRead && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-purple-400" />
      )}
      
      <div className="p-4 pl-5">
        <div className="flex gap-4">
          {/* 类型图标 */}
          <motion.div 
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
              notification.isRead ? 'bg-white/5' : `${config.bgColor}/20`
            }`}
            animate={!notification.isRead ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {config.icon}
          </motion.div>
          
          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-bold text-sm ${notification.isRead ? 'text-white/70' : 'text-white'}`}>
                {notification.title}
              </h3>
              <span className="text-[10px] text-white/30 whitespace-nowrap">
                {formatTime(notification.createdAt)}
              </span>
            </div>
            <p className={`text-xs mt-1 ${notification.isRead ? 'text-white/40' : 'text-white/60'}`}>
              {notification.content}
            </p>
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.isRead && (
                <button
                  onClick={() => onMarkRead(notification.id)}
                  className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider"
                >
                  <OctoIcons.Check />
                  Mark read
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="flex items-center gap-1 text-[10px] text-red-400/60 hover:text-red-400 font-bold uppercase tracking-wider"
              >
                <OctoIcons.Trash />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 触手装饰 */}
      <svg className="absolute bottom-0 right-0 w-16 h-8 text-white/[0.03]" viewBox="0 0 60 30" preserveAspectRatio="none">
        <path d="M60 30 Q 45 15, 35 25 T 15 30" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    </motion.div>
  );
};

export default function NotificationsPage() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // 获取通知列表
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["notifications", authUser?.id, page],
    queryFn: () => api.getNotifications(authUser!.id, page, 20),
    enabled: !!authUser?.id,
  });

  // 获取未读数量
  const { data: unreadData } = useQuery({
    queryKey: ["unreadCount", authUser?.id],
    queryFn: () => api.getUnreadNotificationCount(authUser!.id),
    enabled: !!authUser?.id,
  });

  // 标记已读
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => api.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["recentNotifications"] });
    },
  });

  // 标记全部已读
  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(authUser!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["recentNotifications"] });
    },
  });

  // 删除通知 (需要添加 API)
  const handleDelete = async (id: string) => {
    // TODO: Implement delete API
    console.log("Delete notification:", id);
  };

  const notifications = notificationsData?.notifications || [];
  const pagination = notificationsData?.pagination;
  const unreadCount = unreadData?.count || 0;

  // 过滤通知
  const filteredNotifications = filter === "unread" 
    ? notifications.filter((n: any) => !n.isRead)
    : notifications;

  if (!authUser) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <p className="text-white/40">Please login to view notifications</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white relative overflow-hidden">
      {/* 章鱼主题背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <SparklesCore
          background="transparent"
          minSize={0.3}
          maxSize={0.8}
          particleDensity={15}
          particleColor="#06b6d4"
          className="opacity-30"
        />
        <InkParticles count={20} />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/15 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/15 blur-[120px] rounded-full" />
      </div>
      <TentacleWaves />
      
      <FloatingOctopus className="absolute top-20 right-10 opacity-20 hidden xl:block" size="lg" color="cyan" />
      <FloatingOctopus className="absolute bottom-40 left-10 opacity-15 hidden lg:block" size="md" color="purple" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <motion.span 
              className="text-cyan-400"
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <OctoNotification className="w-8 h-8" />
            </motion.span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Message Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            Notifications
          </h1>
          <p className="mt-3 text-sm text-white/40">
            Stay updated with your predictions, battles, and rewards
          </p>
        </motion.div>

        {/* Stats & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                <motion.div 
                  className="w-2 h-2 bg-cyan-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-sm font-bold text-cyan-400">{unreadCount} unread</span>
              </div>
            )}
            
            {/* Filter */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
              {["all", "unread"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    filter === f
                      ? 'bg-cyan-500 text-white'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:border-cyan-500/30 transition-all"
            >
              <OctoIcons.CheckAll />
              Mark all read
            </motion.button>
          )}
        </motion.div>

        {/* Notification List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification: any, index: number) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id: string) => markReadMutation.mutate(id)}
                  onDelete={handleDelete}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <motion.svg 
              className="w-24 h-24 mx-auto text-white/10 mb-6"
              viewBox="0 0 80 80"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <ellipse cx="40" cy="35" rx="20" ry="15" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="35" cy="33" r="3" fill="currentColor" />
              <circle cx="45" cy="33" r="3" fill="currentColor" />
              <path d="M35 42 Q 40 46, 45 42" stroke="currentColor" strokeWidth="2" fill="none" />
              {[0, 1, 2, 3, 4].map((i) => (
                <path
                  key={i}
                  d={`M ${25 + i * 8} 48 Q ${23 + i * 8} 60, ${20 + i * 10} 70`}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.4"
                />
              ))}
            </motion.svg>
            <h3 className="text-xl font-black text-white/60 mb-2">
              {filter === "unread" ? "All caught up!" : "No notifications yet"}
            </h3>
            <p className="text-sm text-white/30">
              {filter === "unread" 
                ? "You've read all your notifications" 
                : "Your notification inbox is empty"}
            </p>
          </motion.div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="text-sm text-white/40">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
