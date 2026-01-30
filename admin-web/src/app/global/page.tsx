"use client";

import React from "react";
import { Users, Send, Bell, Zap, Radio } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import Link from "next/link";

export default function GlobalSystem() {
  const queryClient = useQueryClient();
  const [message, setMessage] = React.useState("");
  const [broadcastType, setBroadcastType] = React.useState("INFO");

  const { data: onlineUsers, isLoading } = useQuery({
    queryKey: ["adminOnlineUsers"],
    queryFn: () => api.getOnlineUsers(),
    refetchInterval: 5000, // 每5秒自动刷新在线人数
  });

  const broadcastMutation = useMutation({
    mutationFn: (data: { type: string, message: string }) => api.broadcastMessage(data),
    onSuccess: () => {
      setMessage("");
      alert("Broadcast sent to all active sessions");
    }
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-end justify-between border-b border-border pb-8">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">Global_System_Sync</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-2">Active Session Control & Mass Communication</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Online Users List */}
        <div className="border border-border bg-card p-8 space-y-8 flex flex-col h-[600px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="text-admin-secondary w-5 h-5" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Active_Operator_Registry</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-mono text-white">{onlineUsers?.length || 0} ONLINE</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {onlineUsers?.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                <Radio className="w-12 h-12 mb-4 animate-ping" />
                <p className="text-[10px] uppercase tracking-widest">No active sessions detected...</p>
              </div>
            )}
            {onlineUsers?.map((u: any) => (
              <div key={u.id} className="p-4 bg-background border border-border flex items-center justify-between group hover:border-admin-secondary transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded border border-border bg-white/5 flex items-center justify-center text-[10px] font-black italic group-hover:bg-admin-secondary group-hover:text-black transition-colors">
                    {u.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase">{u.username || 'Anonymous'}</p>
                    <p className="text-[8px] font-mono text-muted-foreground">{u.pts.toLocaleString()} PTS // Combo: {u.combo}</p>
                  </div>
                </div>
                <Link 
                  href={`/users?id=${u.id}`}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  Quick_Gift
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Global Broadcast */}
        <div className="border border-border bg-card p-8 space-y-8">
          <div className="flex items-center gap-3">
            <Bell className="text-admin-primary w-5 h-5" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Emergency_Broadcast_Relay</h3>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-muted-foreground">Broadcast_Urgency</label>
              <div className="flex gap-2">
                {['INFO', 'WARNING', 'CRITICAL'].map(type => (
                  <button
                    key={type}
                    onClick={() => setBroadcastType(type)}
                    className={`flex-1 py-2 text-[10px] font-black border transition-all ${
                      broadcastType === type 
                        ? 'bg-white text-black border-white' 
                        : 'bg-transparent text-muted-foreground border-border hover:border-white/50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-muted-foreground">Message_Content</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter system announcement to be displayed on all connected client terminals..."
                className="w-full h-40 bg-background border border-border p-4 text-xs font-mono text-white outline-none focus:border-admin-primary transition-all resize-none"
              />
            </div>

            <button 
              onClick={() => broadcastMutation.mutate({ type: broadcastType, message })}
              disabled={broadcastMutation.isPending || !message}
              className="w-full py-4 bg-admin-primary text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
            >
              {broadcastMutation.isPending ? 'TRANSMITTING...' : 'INITIATE_GLOBAL_SYNC'}
            </button>
          </div>

          <div className="pt-8 border-t border-border">
             <div className="flex items-center gap-3 mb-4">
                <Zap className="text-admin-accent w-4 h-4" />
                <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-admin-accent">System_Heartbeat</h4>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-background border border-border">
                   <p className="text-[8px] font-black text-muted-foreground uppercase">WebSocket_Node</p>
                   <p className="text-[10px] font-mono text-green-500 mt-1">HEALTHY // 12ms</p>
                </div>
                <div className="p-3 bg-background border border-border">
                   <p className="text-[8px] font-black text-muted-foreground uppercase">Payload_Integrity</p>
                   <p className="text-[10px] font-mono text-green-500 mt-1">SECURE // 256-AES</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
