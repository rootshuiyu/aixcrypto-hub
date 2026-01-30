"use client";

import React, { useState } from "react";
import { Plus, Gift, Target, Clock, Trash2, CheckCircle2, X, Edit3, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export default function QuestEngine() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState<'CREATE' | 'EDIT' | null>(null);
  const [currentQuest, setCurrentQuest] = useState<any>({ id: '', title: '', description: '', reward: 100, type: 'PREDICTION', goal: 1, isDaily: false });

  const { data: quests, isLoading, error: questError } = useQuery({
    queryKey: ["adminQuests"],
    queryFn: async () => {
      console.log("[ADMIN] Fetching quests...");
      const result = await api.getQuests();
      console.log("[ADMIN] Quests result:", result);
      return result;
    },
    retry: 1,
  });

  const { data: statsData, error: statsError } = useQuery({
    queryKey: ["adminQuestStats"],
    queryFn: async () => {
      console.log("[ADMIN] Fetching quest stats...");
      const result = await api.getQuestStats();
      console.log("[ADMIN] Stats result:", result);
      return result;
    },
    retry: 1,
  });

  // Debug logging
  React.useEffect(() => {
    if (questError) console.error("[ADMIN] Quest Error:", questError);
    if (statsError) console.error("[ADMIN] Stats Error:", statsError);
  }, [questError, statsError]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createQuest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminQuests"] });
      setShowModal(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateQuest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminQuests"] });
      setShowModal(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteQuest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminQuests"] });
    }
  });

  const resetDailyMutation = useMutation({
    mutationFn: () => api.resetDailyQuests(),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["adminQuests"] });
      queryClient.invalidateQueries({ queryKey: ["adminQuestStats"] });
      alert(res?.count != null ? `已重置 ${res.count} 条用户任务进度（${res.taskCount} 个每日任务）` : "每日任务已重置");
    },
    onError: (e: any) => alert(e?.response?.data?.message || "重置失败"),
  });

  const handleEdit = (quest: any) => {
    setCurrentQuest(quest);
    setShowModal('EDIT');
  };

  const handleCreate = () => {
    setCurrentQuest({ id: '', title: '', description: '', reward: 100, type: 'PREDICTION', goal: 1, isDaily: false });
    setShowModal('CREATE');
  };

  const handleSubmit = () => {
    if (showModal === 'CREATE') {
      createMutation.mutate(currentQuest);
    } else {
      updateMutation.mutate(currentQuest);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-end justify-between border-b border-border pb-8">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">Quest_Incentive_Engine</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-2">Dynamic Task Management & Reward Distribution · 每日任务每日 0 点自动重置</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => resetDailyMutation.mutate()}
            disabled={resetDailyMutation.isPending}
            className="flex items-center gap-2 px-4 py-3 border border-border text-[10px] font-black uppercase tracking-widest hover:border-admin-accent hover:text-admin-accent transition-all disabled:opacity-50"
            title="与每日 0 点定时重置逻辑一致"
          >
            <RefreshCw className={`w-3 h-3 ${resetDailyMutation.isPending ? "animate-spin" : ""}`} />
            {resetDailyMutation.isPending ? "RESETTING..." : "Reset_Daily_Quests"}
          </button>
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-admin-secondary hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <Plus className="w-3 h-3" /> Create_New_Quest
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Active Quests" value={statsData?.totalQuests || 0} sub="Currently running" color="text-admin-secondary" />
        <StatCard label="Total Claims" value={statsData?.totalClaims || 0} sub="Global settlements" color="text-admin-accent" />
        <StatCard label="PTS Distributed" value={(statsData?.totalPtsDistributed || 0).toLocaleString()} sub="Global incentive cost" color="text-admin-primary" />
        <StatCard label="Conversion Rate" value={`${statsData?.conversionRate || 0}%`} sub="Task completion" color="text-white" />
      </div>

      <div className="border border-border bg-card">
        <div className="p-4 border-b border-border bg-background/30 flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest">Active_Quest_Ledger</h3>
          <span className="text-[8px] font-mono text-muted-foreground">Real-time Sync Active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/20 font-black uppercase text-[9px] text-muted-foreground tracking-widest">
                <th className="p-4">Quest_ID</th>
                <th className="p-4">Title_Description</th>
                <th className="p-4">Reward (PTS)</th>
                <th className="p-4">Goal_Type</th>
                <th className="p-4">Daily</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="text-[10px] font-mono">
              {isLoading && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading quests...</td></tr>
              )}
              {!isLoading && (!quests || quests.length === 0) && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No quests found. Backend may not be synced.</td></tr>
              )}
              {quests?.map((q: any) => {
                const isDaily = q.isDaily || (q.type && String(q.type).startsWith("DAILY_"));
                return (
                  <tr key={q.id} className="border-b border-border hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 font-black text-admin-secondary">{q.id}</td>
                    <td className="p-4">
                      <p className="font-black uppercase">{q.title}</p>
                      <p className="text-[8px] text-muted-foreground italic mt-0.5">{q.description}</p>
                    </td>
                    <td className="p-4 font-black">{q.reward}</td>
                    <td className="p-4 tracking-tighter">{q.goal} / {q.type}</td>
                    <td className="p-4">
                      {isDaily ? (
                        <span className="px-2 py-0.5 border border-amber-500/40 text-amber-400 text-[8px] font-black uppercase tracking-tighter" title="每日 0 点自动重置">
                          DAILY
                        </span>
                      ) : (
                        <span className="text-[8px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 border border-green-500/20 text-green-500 text-[8px] font-black uppercase tracking-tighter`}>
                        ACTIVE
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(q)}
                          className="p-2 border border-border hover:border-admin-secondary hover:text-admin-secondary transition-all rounded"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Confirm deletion?')) deleteMutation.mutate(q.id);
                          }}
                          className="p-2 border border-border hover:border-admin-primary hover:text-admin-primary transition-all rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="w-full max-w-lg border border-border bg-card p-10 space-y-8 shadow-[0_0_50px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b border-border pb-6">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                {showModal === 'CREATE' ? 'Forge_New_Quest' : `Edit_Quest // ${currentQuest.id}`}
              </h3>
              <button onClick={() => setShowModal(null)} className="text-muted-foreground hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Unique_ID</label>
                    <input 
                      type="text" 
                      value={currentQuest.id}
                      disabled={showModal === 'EDIT'}
                      onChange={(e) => setCurrentQuest({...currentQuest, id: e.target.value})}
                      placeholder="e.g. Q-999"
                      className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-admin-secondary disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Action_Type</label>
                    <select 
                      value={currentQuest.type}
                      onChange={(e) => setCurrentQuest({...currentQuest, type: e.target.value})}
                      className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none"
                    >
                      <option value="PREDICTION">PREDICTION</option>
                      <option value="BATTLE">AI_BATTLE</option>
                      <option value="WALLET_LINK">WALLET_LINK</option>
                      <option value="REFERRAL">REFERRAL</option>
                      <option value="DAILY_SIGNIN">DAILY_SIGNIN</option>
                      <option value="DAILY_FIRST_BET">DAILY_FIRST_BET</option>
                      <option value="DAILY_PREDICTION">DAILY_PREDICTION</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input 
                      type="checkbox" 
                      id="isDaily"
                      checked={currentQuest.isDaily}
                      onChange={(e) => setCurrentQuest({...currentQuest, isDaily: e.target.checked})}
                      className="w-4 h-4 bg-background border border-border rounded"
                    />
                    <label htmlFor="isDaily" className="text-[9px] font-black uppercase text-muted-foreground cursor-pointer">Daily_Quest</label>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-muted-foreground">Quest_Title</label>
                  <input 
                    type="text" 
                    value={currentQuest.title}
                    onChange={(e) => setCurrentQuest({...currentQuest, title: e.target.value})}
                    className="w-full bg-background border border-border p-3 text-sm font-mono text-white outline-none focus:border-admin-secondary"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-muted-foreground">Description</label>
                  <textarea 
                    value={currentQuest.description}
                    onChange={(e) => setCurrentQuest({...currentQuest, description: e.target.value})}
                    className="w-full bg-background border border-border p-3 text-sm font-mono text-white outline-none focus:border-admin-secondary h-20 resize-none"
                  />
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Reward (PTS)</label>
                    <input 
                      type="number" 
                      value={currentQuest.reward}
                      onChange={(e) => setCurrentQuest({...currentQuest, reward: Number(e.target.value)})}
                      className="w-full bg-background border border-border p-3 text-sm font-mono text-white outline-none focus:border-admin-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground">Goal_Target</label>
                    <input 
                      type="number" 
                      value={currentQuest.goal}
                      onChange={(e) => setCurrentQuest({...currentQuest, goal: Number(e.target.value)})}
                      className="w-full bg-background border border-border p-3 text-sm font-mono text-white outline-none focus:border-admin-secondary"
                    />
                  </div>
               </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowModal(null)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border border-border hover:bg-white/5 transition-all">ABORT</button>
              <button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-admin-secondary hover:text-white transition-all disabled:opacity-50"
              >
                {showModal === 'CREATE' ? (createMutation.isPending ? 'FORGING...' : 'DEPLOY_QUEST') : (updateMutation.isPending ? 'SYNCING...' : 'COMMIT_CHANGES')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: any) {
  return (
    <div className="bg-card p-6 border border-border relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 -rotate-45 translate-x-6 -translate-y-6"></div>
      <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className={`mt-3 text-2xl font-black tracking-tighter italic ${color}`}>{value}</p>
      <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest mt-1 italic">{sub}</p>
    </div>
  );
}
