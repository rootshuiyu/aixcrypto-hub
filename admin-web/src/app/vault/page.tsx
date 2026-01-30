"use client";

import React from "react";
import { ArrowUpRight, ArrowDownLeft, ShieldCheck, Wallet, Activity, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, adminApi } from "../../lib/api";

export default function VaultMonitor() {
  const { data: vaultInfo } = useQuery({
    queryKey: ["adminVaultInfo"],
    queryFn: () => api.getVaultStats(),
  });

  const { data: history } = useQuery({
    queryKey: ["adminVaultHistory"],
    queryFn: () => api.getGlobalVaultHistory(20),
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-end justify-between border-b border-border pb-8">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">Vault_Treasury_Monitor</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-2">On-chain Liquidity & Transaction Integrity</p>
        </div>
        <div className="flex gap-4">
           <div className="text-right">
              <p className="text-[9px] font-black uppercase text-muted-foreground">Contract_Address</p>
              <p className="text-[10px] font-mono text-admin-secondary">{vaultInfo?.address || '0xVa...7721'}</p>
           </div>
           <div className="w-10 h-10 border border-border flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-500" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border border-border bg-card p-8 space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="text-admin-secondary w-5 h-5" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Flow_Continuity</h3>
              </div>
              <div className="flex gap-2">
                 <div className="h-1 w-8 bg-green-500 rounded-full"></div>
                 <div className="h-1 w-8 bg-green-500/30 rounded-full"></div>
                 <div className="h-1 w-8 bg-green-500 rounded-full"></div>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
              <BalanceItem icon={<ArrowDownLeft className="text-green-500" />} label="Inflow (24H)" value="42.5 ETH" sub="+$98,200 USD" />
              <BalanceItem icon={<ArrowUpRight className="text-admin-primary" />} label="Outflow (24H)" value="12.8 ETH" sub="-$29,500 USD" />
           </div>
        </div>

        <div className="border border-border bg-card p-8 space-y-6">
           <div className="flex items-center gap-3">
              <Wallet className="text-admin-accent w-5 h-5" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Treasury_Net</h3>
           </div>
           <div className="space-y-4">
              <div className="p-4 bg-background border border-border">
                 <p className="text-[9px] font-black uppercase text-muted-foreground">Global_Collateral</p>
                 <p className="text-3xl font-black italic tracking-tighter mt-2">{vaultInfo?.balance || '0.00'} <span className="text-sm font-mono text-muted-foreground font-normal">ETH</span></p>
              </div>
              <div className="p-4 bg-background border border-border">
                 <p className="text-[9px] font-black uppercase text-muted-foreground">Reserve_Status</p>
                 <p className="text-xl font-black mt-2 text-green-500">OPTIMAL <span className="text-[8px] font-mono text-muted-foreground ml-2">Sufficient</span></p>
              </div>
           </div>
        </div>
      </div>

      <div className="border border-border bg-card">
        <div className="p-4 border-b border-border bg-background/30">
          <h3 className="text-[10px] font-black uppercase tracking-widest">Global_Vault_Transactions</h3>
        </div>
        <div className="p-6">
           <div className="space-y-3">
              {history?.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-background/50 border border-border hover:border-admin-secondary transition-colors group">
                   <div className="flex items-center gap-6">
                      <div className={`w-8 h-8 flex items-center justify-center rounded border ${tx.type === 'DEPOSIT' ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-admin-primary/20 text-admin-primary bg-admin-primary/5'}`}>
                         {tx.type === 'DEPOSIT' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                         <p className="text-[11px] font-black uppercase">{tx.type}_DETECTED</p>
                         <p className="text-[8px] font-mono text-muted-foreground">USER: {tx.user?.username || tx.userId} // TX: {tx.txHash?.slice(0,12)}...</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-8">
                      <div className="text-right">
                         <p className={`text-[11px] font-black ${tx.type === 'DEPOSIT' ? 'text-green-500' : 'text-admin-primary'}`}>{tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount} {tx.token || 'ETH'}</p>
                         <p className="text-[8px] font-mono text-muted-foreground">Status: {tx.status}</p>
                      </div>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function BalanceItem({ icon, label, value, sub }: any) {
  return (
    <div className="bg-background p-6 space-y-2">
       <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-[9px] font-black uppercase text-muted-foreground">{label}</span>
       </div>
       <p className="text-2xl font-black italic tracking-tighter">{value}</p>
       <p className="text-[10px] font-mono text-muted-foreground uppercase italic">{sub}</p>
    </div>
  );
}

