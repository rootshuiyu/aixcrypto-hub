"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Send, 
  Users, 
  User,
  Globe,
  RefreshCw,
  Trash2,
  MessageSquare,
  AlertCircle,
  Gift,
  Info,
  CheckCircle
} from "lucide-react";
import { api } from "../../lib/api";

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const NOTIFICATION_TYPES = [
  { value: "SYSTEM", label: "系统通知", icon: <AlertCircle className="w-4 h-4" />, color: "text-blue-400" },
  { value: "REWARD", label: "奖励通知", icon: <Gift className="w-4 h-4" />, color: "text-yellow-400" },
  { value: "ANNOUNCEMENT", label: "公告", icon: <Globe className="w-4 h-4" />, color: "text-purple-400" },
  { value: "INFO", label: "信息", icon: <Info className="w-4 h-4" />, color: "text-cyan-400" },
  { value: "SUCCESS", label: "成功", icon: <CheckCircle className="w-4 h-4" />, color: "text-green-400" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 发送表单
  const [sendMode, setSendMode] = useState<"single" | "global">("global");
  const [formData, setFormData] = useState({
    userId: "",
    type: "ANNOUNCEMENT",
    title: "",
    message: ""
  });

  useEffect(() => {
    loadNotifications();
  }, [page]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getAllNotifications(page, 20);
      setNotifications(data.notifications || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      alert("请填写标题和内容");
      return;
    }
    
    if (sendMode === "single" && !formData.userId.trim()) {
      alert("请输入用户 ID");
      return;
    }

    setSending(true);
    try {
      if (sendMode === "global") {
        await api.sendGlobalNotification({
          type: formData.type,
          title: formData.title,
          message: formData.message
        });
        alert("全局通知已发送！");
      } else {
        await api.sendNotification({
          userId: formData.userId,
          type: formData.type,
          title: formData.title,
          message: formData.message
        });
        alert("通知已发送给用户！");
      }
      
      // 重置表单
      setFormData({ userId: "", type: "ANNOUNCEMENT", title: "", message: "" });
      loadNotifications();
    } catch (error) {
      console.error("Failed to send notification:", error);
      alert("发送失败，请重试");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这条通知？")) return;
    
    try {
      await api.deleteNotification(id);
      loadNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
      alert("删除失败");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTypeInfo = (type: string) => {
    return NOTIFICATION_TYPES.find(t => t.value === type) || NOTIFICATION_TYPES[0];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Bell className="w-7 h-7 text-admin-primary" />
            Notifications
          </h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            通知管理 // 向用户发送系统通知
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Notification Form */}
        <div className="border border-border bg-card/30">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-admin-primary flex items-center gap-2">
              <Send className="w-4 h-4" />
              发送通知
            </h2>
            
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setSendMode("global")}
                className={`flex items-center gap-1 px-3 py-1 border transition-colors ${
                  sendMode === "global" 
                    ? "border-admin-primary bg-admin-primary/20 text-admin-primary" 
                    : "border-border hover:bg-white/5"
                }`}
              >
                <Globe className="w-3 h-3" />
                全局
              </button>
              <button
                onClick={() => setSendMode("single")}
                className={`flex items-center gap-1 px-3 py-1 border transition-colors ${
                  sendMode === "single" 
                    ? "border-admin-primary bg-admin-primary/20 text-admin-primary" 
                    : "border-border hover:bg-white/5"
                }`}
              >
                <User className="w-3 h-3" />
                单用户
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSend} className="p-4 space-y-4">
            {sendMode === "single" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                  用户 ID
                </label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={e => setFormData({ ...formData, userId: e.target.value })}
                  placeholder="输入目标用户 ID"
                  className="w-full bg-background border border-border p-3 text-sm focus:outline-none focus:border-admin-primary"
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                通知类型
              </label>
              <div className="grid grid-cols-3 gap-2">
                {NOTIFICATION_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`flex items-center gap-2 p-2 border text-xs transition-colors ${
                      formData.type === type.value
                        ? `border-admin-primary bg-admin-primary/10 ${type.color}`
                        : "border-border hover:bg-white/5"
                    }`}
                  >
                    {type.icon}
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                标题
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="通知标题"
                className="w-full bg-background border border-border p-3 text-sm focus:outline-none focus:border-admin-primary"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                内容
              </label>
              <textarea
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="通知内容..."
                rows={4}
                className="w-full bg-background border border-border p-3 text-sm focus:outline-none focus:border-admin-primary resize-none"
              />
            </div>
            
            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-admin-primary text-black text-xs font-black uppercase tracking-wider hover:bg-admin-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? "发送中..." : sendMode === "global" ? "发送全局通知" : "发送通知"}
            </button>
          </form>
        </div>

        {/* Recent Notifications */}
        <div className="border border-border bg-card/30">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              历史通知
            </h2>
            <button
              onClick={loadNotifications}
              disabled={loading}
              className="p-2 hover:bg-white/5 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 text-admin-primary animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs uppercase">暂无通知记录</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map(notification => {
                  const typeInfo = getTypeInfo(notification.type);
                  return (
                    <div key={notification.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={typeInfo.color}>{typeInfo.icon}</span>
                            <span className="text-xs font-bold truncate">{notification.title}</span>
                            {!notification.isRead && (
                              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] uppercase">未读</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/60">
                            <span>ID: {notification.userId.slice(0, 8)}...</span>
                            <span>{formatDate(notification.createdAt)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-border text-xs hover:bg-white/5 disabled:opacity-50"
              >
                上一页
              </button>
              <span className="text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-border text-xs hover:bg-white/5 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
