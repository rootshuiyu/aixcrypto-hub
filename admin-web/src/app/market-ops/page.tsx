"use client";

import React, { useState } from "react";
import { ShieldAlert, Zap, Lock, RefreshCw, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export default function MarketOps() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreate] = useState(false);
  const [newMarket, setNewMarket] = useState({ category: 'C10', timeframe: '10M', title: 'New Market', duration: 10 });

  const { data: stats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => api.getStats(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createMarket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      setShowCreate(false);
      alert("Market created successfully");
    }
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.resolveMarket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      alert("Market resolved manually");
    }
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-end justify-between border-b border-border pb-8">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">Market_Operations</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-2">Real-time Market Control & Risk Management</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-admin-secondary hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <Plus className="w-3 h-3" /> Initiate_New_Market
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ControlCard 
          icon={<Zap className="text-admin-secondary" />}
          title="Slippage_Buffer" 
          desc="Configure dynamic slippage for ultra-short markets (10M)."
          value="0.15%"
          action="Modify_Params"
        />
        <ControlCard 
          icon={<Lock className="text-admin-primary" />}
          title="Circuit_Breaker" 
          desc="Emergency pause for all trading activities across clusters."
          value="STATUS: ARMED"
          variant="danger"
          action="Trigger_Pause"
        />
        <ControlCard 
          icon={<RefreshCw className="text-admin-accent" />}
          title="Global_Sync" 
          desc="Refresh all market indices and validate price feeds."
          value="STABLE"
          action="Re-sync_Feeds"
        />
      </div>

      <div className="border border-border bg-card">
        <div className="p-4 border-b border-border bg-background/30 flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest">Live_Market_Clusters</h3>
          <span className="text-[8px] font-mono text-muted-foreground">{stats?.markets?.length || 0} ACTIVE_NODES</span>
        </div>
        <div className="p-8">
          <div className="space-y-4">
             {stats?.markets?.map((m: any) => (
               <div key={m.id} className="flex items-center justify-between p-4 bg-background/50 border border-border group hover:border-admin-secondary transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <div>
                      <p className="text-[11px] font-black uppercase">{m.title}</p>
                      <p className="text-[8px] font-mono text-muted-foreground">ID: {m.id.slice(0,8)} // Pool: {m.poolSize?.toLocaleString()} PTS // Category: {m.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => resolveMutation.mutate(m.id)}
                      disabled={resolveMutation.isPending}
                      className="px-4 py-1.5 border border-admin-accent/20 text-[9px] font-black text-admin-accent uppercase hover:bg-admin-accent hover:text-black transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3 h-3" /> {resolveMutation.isPending ? 'Resolving...' : 'Force_Resolve'}
                    </button>
                    <button className="px-4 py-1.5 border border-border text-[9px] font-bold uppercase hover:bg-white hover:text-black transition-colors">Audit</button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="w-full max-w-lg border border-border bg-card p-10 space-y-8 shadow-[0_0_50px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b border-border pb-6">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Initiate_Market</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Category</label>
                    <select 
                      value={newMarket.category}
                      onChange={(e) => setNewMarket({...newMarket, category: e.target.value})}
                      className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none"
                    >
                      <option value="C10">C10_CRYPTO</option>
                      <option value="GOLD">GOLD_INDEX</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Timeframe</label>
                    <select 
                      value={newMarket.timeframe}
                      onChange={(e) => setNewMarket({...newMarket, timeframe: e.target.value})}
                      className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none"
                    >
                      <option value="10M">10_MINUTES</option>
                      <option value="30M">30_MINUTES</option>
                      <option value="1H">1_HOUR</option>
                      <option value="24H">24_HOURS</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-muted-foreground">Market_Title</label>
                  <input 
                    type="text" 
                    value={newMarket.title}
                    onChange={(e) => setNewMarket({...newMarket, title: e.target.value})}
                    className="w-full bg-background border border-border p-3 text-sm font-mono text-white outline-none focus:border-admin-secondary"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-muted-foreground">Duration (Minutes)</label>
                  <input 
                    type="number" 
                    value={newMarket.duration}
                    onChange={(e) => setNewMarket({...newMarket, duration: Number(e.target.value)})}
                    className="w-full bg-background border border-border p-3 text-sm font-mono text-white outline-none focus:border-admin-secondary"
                  />
               </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border border-border hover:bg-white/5 transition-all">ABORT</button>
              <button 
                onClick={() => createMutation.mutate(newMarket)}
                disabled={createMutation.isPending}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-admin-secondary hover:text-white transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? 'DEPLOYING...' : 'COMMIT_TO_LEDGER'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlCard({ icon, title, desc, value, action, variant = 'default' }: any) {
  return (
    <div className="border border-border bg-card p-8 space-y-6 relative group overflow-hidden">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-[11px] font-black uppercase tracking-widest">{title}</h3>
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-black italic tracking-tighter">{value}</p>
        <p className="text-[10px] text-muted-foreground leading-relaxed italic">{desc}</p>
      </div>
      <button className={`w-full py-3 text-[10px] font-black uppercase tracking-widest transition-all border ${
        variant === 'danger' 
          ? 'border-admin-primary/20 text-admin-primary hover:bg-admin-primary hover:text-white' 
          : 'border-border text-foreground hover:bg-white hover:text-black'
      }`}>
        {action}
      </button>
    </div>
  );
}

