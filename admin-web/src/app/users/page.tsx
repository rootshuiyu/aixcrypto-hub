"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Users, Search, ShieldCheck, History, AlertTriangle, Coins, RefreshCcw, Save, Trash2, UserPlus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useSearchParams } from "next/navigation";

function UserAuditContent() {
  const searchParams = useSearchParams();
  const [searchId, setSearchId] = useState("");
  const [ptsAdjustment, setPtsAdjustment] = useState<number>(0);
  const [adjustReason, setReason] = useState("Manual adjustment by admin");
  const queryClient = useQueryClient();

  // 获取所有用户列表
  const { data: users, isLoading: usersLoading, refetch: refetchList } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => api.getUsers(),
  });

  useEffect(() => {
    const idFromQuery = searchParams.get("id");
    if (idFromQuery) {
      setSearchId(idFromQuery);
    }
  }, [searchParams]);

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["adminUserAudit", searchId],
    queryFn: () => api.getUserAudit(searchId),
    enabled: !!searchId && searchId.trim().length > 0,
  });

  const ptsMutation = useMutation({
    mutationFn: (data: { userId: string, amount: number, reason: string }) => api.updateUserPts(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUserAudit", searchId] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setPtsAdjustment(0);
      alert("PTS adjusted successfully");
    }
  });

  const comboMutation = useMutation({
    mutationFn: (userId: string) => api.resetUserCombo(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUserAudit", searchId] });
      alert("Combo reset successfully");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.deleteUser(userId),
    onSuccess: () => {
      alert("User deleted successfully and all records wiped.");
      setSearchId("");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    }
  });

  const handleDeleteUser = (userId: string) => {
    if (confirm("🚨 WARNING: Are you sure you want to PERMANENTLY DELETE this user and all their history? This action cannot be undone.")) {
      deleteMutation.mutate(userId);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-end justify-between border-b border-border pb-8">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">User_Registry_Audit</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-2">Behavioral Forensics & Asset Management</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-white transition-colors" />
          <input 
            type="text" 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="ENTER_USER_ID_OR_WALLET_ADDRESS"
            className="w-full bg-card border border-border p-5 pl-12 text-sm font-mono text-white focus:border-admin-secondary outline-none transition-all"
          />
        </div>
        <button 
          onClick={() => refetch()}
          className="px-12 bg-admin-secondary text-black text-[10px] font-black uppercase tracking-widest hover:bg-admin-secondary/80 hover:text-white transition-all active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
        >
          Initiate_Audit
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* 左侧：用户列表 */}
        <div className="xl:col-span-4 border border-border bg-card overflow-hidden flex flex-col h-[800px]">
          <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-muted-foreground" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Master_User_Registry</h2>
            </div>
            <span className="text-[8px] font-mono text-muted-foreground">{users?.length || 0} Records</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {usersLoading ? (
              <div className="p-4 text-[10px] italic opacity-50 animate-pulse uppercase">Syncing_Registry...</div>
            ) : users?.map((u: any) => (
              <button
                key={u.id}
                onClick={() => setSearchId(u.address || u.id)}
                className={`w-full p-4 border transition-all text-left flex justify-between items-center group ${
                  searchId === u.id || searchId === u.address
                    ? 'bg-admin-secondary/10 border-admin-secondary shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                    : 'bg-background/30 border-border hover:bg-background hover:border-admin-secondary/30'
                }`}
              >
                <div className="min-w-0">
                  <div className={`text-xs font-black uppercase tracking-tighter truncate ${searchId === u.id ? 'text-admin-secondary' : 'text-foreground'}`}>
                    {u.username || 'Anonymous'}
                  </div>
                  <div className="text-[8px] font-mono text-muted-foreground mt-1 truncate">
                    {u.address || u.id}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono font-black text-admin-accent">{u.pts?.toLocaleString()}</div>
                  <div className="text-[7px] text-muted-foreground uppercase mt-0.5">pts</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧：审计详情 */}
        <div className="xl:col-span-8 space-y-8">
          {isLoading ? (
            <div className="h-full border border-border bg-card/30 flex items-center justify-center italic text-muted-foreground text-[10px] uppercase tracking-widest animate-pulse">
              Running_Audit_Diagnostic...
            </div>
          ) : user ? (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 基础资料 */}
                <div className="border border-border bg-card p-8 space-y-8">
                  <div className="text-center pb-8 border-b border-border">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border mx-auto flex items-center justify-center text-4xl font-black text-white italic mb-4 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                      {user.username?.[0]?.toUpperCase() || "U"}
                    </div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">{user.username || 'Anonymous'}</h3>
                    <p className="text-[8px] font-mono text-muted-foreground mt-2 truncate max-w-full">{user.id}</p>
                  </div>

                  <div className="space-y-4">
                    <AuditItem label="Bound_Address" value={user.address || 'N/A'} color="text-muted-foreground" isAddress />
                    <AuditItem label="Twitter_Handle" value={user.twitterId ? `@${user.twitterId}` : 'NOT_LINKED'} color={user.twitterId ? "text-admin-secondary" : "text-muted-foreground"} />
                    <AuditItem label="Discord_ID" value={user.discordId || 'NOT_LINKED'} color={user.discordId ? "text-admin-secondary" : "text-muted-foreground"} />
                    <AuditItem label="Email_Source" value={user.email || 'N/A'} color="text-muted-foreground" />
                    <AuditItem label="PTS_Balance" value={user.pts?.toLocaleString()} color="text-white" />
                    <AuditItem label="Combo_Streak" value={user.combo} color="text-admin-secondary" />
                    <AuditItem label="Multiplier" value={`${user.multiplier}x`} color="text-admin-accent" />
                    <AuditItem label="Integrity_Ver" value={`v${user.version}`} color="text-muted-foreground" />
                  </div>
                </div>

                {/* 资产管理 */}
                <div className="border border-border bg-card p-8 space-y-6">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-admin-accent" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-admin-accent">Asset_Manual_Override</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-muted-foreground uppercase">Adjustment Amount (PTS)</label>
                      <div className="flex gap-2 mb-2">
                        {[500, 1000, 5000].map(amt => (
                          <button 
                            key={amt}
                            onClick={() => setPtsAdjustment(amt)}
                            className="flex-1 py-1 border border-border text-[8px] font-black hover:border-admin-accent hover:text-admin-accent transition-colors bg-background/50"
                          >
                            +{amt}
                          </button>
                        ))}
                      </div>
                      <input 
                        type="number" 
                        value={ptsAdjustment}
                        onChange={(e) => setPtsAdjustment(Number(e.target.value))}
                        className="w-full bg-background border border-border p-3 text-sm font-mono text-white outline-none focus:border-admin-accent"
                        placeholder="+ / - PTS"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-muted-foreground uppercase">Override Reason</label>
                      <textarea 
                        value={adjustReason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full bg-background border border-border p-3 text-[10px] font-mono text-muted-foreground h-20 outline-none focus:border-admin-accent"
                      />
                    </div>
                    <button 
                      onClick={() => ptsMutation.mutate({ userId: user.id, amount: ptsAdjustment, reason: adjustReason })}
                      disabled={ptsMutation.isPending}
                      className="w-full py-3 bg-admin-accent text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,184,0,0.1)]"
                    >
                      {ptsMutation.isPending ? 'PROCESSING...' : 'COMMIT_PTS_OVERRIDE'}
                    </button>

                    <div className="pt-4 flex gap-2">
                      <button 
                        onClick={() => comboMutation.mutate(user.id)}
                        disabled={comboMutation.isPending}
                        className="flex-1 py-2 bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-admin-secondary hover:text-black transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCcw className="w-3 h-3" /> Reset_Combo
                      </button>
                      <button className="flex-1 py-2 bg-admin-primary/10 border border-admin-primary/20 text-[9px] font-black uppercase tracking-widest text-admin-primary hover:bg-admin-primary hover:text-white transition-all">
                        FLAG_ACCOUNT
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-red-500/20 space-y-4">
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertTriangle className="w-4 h-4" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Danger_Zone</h4>
                    </div>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={deleteMutation.isPending}
                      className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" /> {deleteMutation.isPending ? 'TERMINATING...' : 'PERMANENT_WIPE_USER'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 交易账本 */}
              <div className="border border-border bg-card/60 flex flex-col h-[400px]">
                <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-3 h-3 text-muted-foreground" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Transaction_Ledger_Audit</h2>
                  </div>
                  <span className="text-[8px] font-mono text-muted-foreground">Recent Activities</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 font-mono text-[10px] space-y-3 no-scrollbar">
                  {(!user.bets || user.bets.length === 0) && (!user.battles || user.battles.length === 0) && (
                    <div className="h-full flex items-center justify-center text-muted-foreground italic">NO_RECORDS_FOUND</div>
                  )}
                  {user.bets?.map((bet: any) => (
                    <div key={bet.id} className="p-4 bg-background/30 border-l-4 border-purple-500/30 flex justify-between items-center group hover:bg-background transition-colors">
                      <div>
                        <span className="text-muted-foreground">[{new Date(bet.timestamp).toLocaleString()}]</span>
                        <span className="ml-4 text-foreground font-bold uppercase tracking-widest">Prediction_Open</span>
                        <p className="text-[9px] text-muted-foreground mt-1 italic">POS: {bet.position} // AMT: {bet.amount} PTS</p>
                      </div>
                      <span className="text-admin-primary font-black text-sm">-{bet.amount} PTS</span>
                    </div>
                  ))}
                  {user.battles?.map((battle: any) => (
                    <div key={battle.id} className="p-4 bg-background/30 border-l-4 border-cyan-500/30 flex justify-between items-center group hover:bg-background transition-colors">
                      <div>
                        <span className="text-muted-foreground">[{new Date(battle.timestamp).toLocaleString()}]</span>
                        <span className="ml-4 text-foreground font-bold uppercase tracking-widest">Arena_Battle_Result</span>
                        <p className="text-[9px] text-muted-foreground mt-1 italic">Winner: {battle.winner} // Agent: {battle.agentId}</p>
                      </div>
                      <span className={`font-black text-sm ${battle.reward > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {battle.reward > 0 ? `+${battle.reward}` : `-${battle.amount}`} PTS
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full border border-dashed border-border bg-background/20 flex flex-col items-center justify-center p-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-border flex items-center justify-center">
                <Search className="w-6 h-6 text-muted-foreground opacity-20" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">No_Audit_Selected</h3>
                <p className="text-[10px] text-muted-foreground/60 max-w-[240px]">Select a user from the registry or enter a unique identifier to begin forensic audit.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserAudit() {
  return (
    <Suspense fallback={<div className="p-10 opacity-50 italic">INITIALIZING_AUDIT_PROTOCOL...</div>}>
      <UserAuditContent />
    </Suspense>
  );
}

function AuditItem({ label, value, color, isAddress }: any) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className={`text-sm font-black font-mono ${color} ${isAddress ? 'truncate max-w-[120px]' : ''}`} title={isAddress ? value : undefined}>
        {value}
      </span>
    </div>
  );
}
