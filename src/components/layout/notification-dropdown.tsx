"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// 图标
const BellIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// 通知类型颜色
const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    BET_WIN: "bg-green-500",
    BET_LOSE: "bg-red-500",
    BATTLE: "bg-purple-500",
    REFERRAL: "bg-cyan-500",
    REWARD: "bg-yellow-500",
    SYSTEM: "bg-blue-500",
  };
  return colors[type] || "bg-white/20";
};

export function NotificationDropdown() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 获取未读数量
  const { data: unreadData } = useQuery({
    queryKey: ["unreadCount", authUser?.id],
    queryFn: () => api.getUnreadNotificationCount(authUser!.id),
    enabled: !!authUser?.id,
    refetchInterval: 30000,
  });

  // 获取最近通知
  const { data: notificationsData } = useQuery({
    queryKey: ["recentNotifications", authUser?.id],
    queryFn: () => api.getNotifications(authUser!.id, 1, 5),
    enabled: !!authUser?.id && isOpen,
  });

  // 标记已读
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => api.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const notifications = notificationsData?.notifications || [];
  const unreadCount = unreadData?.count || 0;

  if (!authUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-cyan-400">{unreadCount} new</span>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                      !notification.isRead ? "bg-cyan-500/5" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`h-2 w-2 mt-2 rounded-full flex-shrink-0 ${getTypeColor(notification.type)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium truncate ${notification.isRead ? "text-white/60" : "text-white"}`}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-white/30 whitespace-nowrap">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-white/40 truncate mt-0.5">
                          {notification.content}
                        </p>
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markReadMutation.mutate(notification.id);
                            }}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 mt-1 flex items-center gap-1"
                          >
                            <CheckIcon />
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-white/30">No notifications</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block p-3 text-center text-sm text-cyan-400 hover:bg-white/[0.02] transition-colors border-t border-white/5"
            >
              View all notifications
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
