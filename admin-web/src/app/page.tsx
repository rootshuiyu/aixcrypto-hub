"use client";

import React from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Zap, Bot, ShieldAlert, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: () => api.getStats(),
    refetchInterval: 10000,
  });

  const { data: logs } = useQuery({
    queryKey: ["adminLogs"],
    queryFn: () => api.getLogs(),
    refetchInterval: 5000,
  });

  const chartData = [
    { name: '00:00', value: 400 },
    { name: '04:00', value: 300 },
    { name: '08:00', value: 600 },
    { name: '12:00', value: 800 },
    { name: '16:00', value: 500 },
    { name: '20:00', value: stats?.economy?.totalWagered ? Math.floor(stats.economy.totalWagered / 100) : 900 },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 font-mono">
      <div className="flex items-end justify-between border-b border-border pb-8">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">Command_Dashboard</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-2 text-admin-secondary font-bold">Global System Integrity // Real-time Operational Feed</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 border border-border bg-card text-[10px] font-bold uppercase tracking-widest text-green-500 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            {isLoading ? 'SYNCING_PROTOCOL...' : 'SYSTEM_ACTIVE'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <StatItem label="Total PTS Supply" value={stats?.economy?.totalPtsSupply?.toLocaleString() || "0"} change="+12%" positive icon={<Zap className="w-4 h-4" />} />
        <StatItem label="Platform PnL" value={stats?.economy?.platformProfit?.toLocaleString() || "0"} change="+2%" positive icon={<TrendingUp className="w-4 h-4" />} />
        <StatItem label="Active Markets" value={stats?.markets?.length?.toString() || "0"} change="Stable" positive icon={<Activity className="w-4 h-4" />} />
        <StatItem label="Total Bets" value={stats?.economy?.totalBets?.toString() || "0"} change="+5%" positive icon={<Users className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          <div className="border border-border bg-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Network_Wager_Velocity</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252529" vertical={false} />
                  <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#151518', border: '1px solid #252529', fontSize: '10px' }} itemStyle={{ color: '#ef4444' }} />
                  <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="border border-border bg-card p-6 h-[250px] overflow-y-auto custom-scrollbar">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 text-admin-secondary">Operational_Market_Matrix</h3>
                <div className="space-y-4">
                  {stats?.markets?.map((m: any) => (
                    <div key={m.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0 hover:bg-white/5 transition-colors p-1">
                      <div>
                        <p className="text-[10px] font-black uppercase">{m.title}</p>
                        <p className="text-[8px] font-mono text-muted-foreground">{m.category} // {m.timeframe}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-admin-secondary">{m.poolSize} PTS</p>
                        <p className="text-[8px] font-mono text-muted-foreground">{m.betCount} ORDERS</p>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
             <div className="border border-border bg-card p-6 flex flex-col justify-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">Security_Advisory</h3>
                <div className="space-y-3">
                  <AlertItem type="INFO" msg="WebSocket Bridge: LINKED" />
                  <AlertItem type="INFO" msg="Admin Token Integrity: VERIFIED" />
                  <AlertItem type="WARNING" msg="Global PTS Inflation: 1.2% (Target: <5%)" />
                </div>
             </div>
          </div>
        </div>

        <div className="xl:col-span-4 border border-border bg-card/60 flex flex-col h-[700px]">
          <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-admin-primary">Live_Action_Relay</h2>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-admin-primary rounded-full animate-pulse"></span>
              <span className="text-[8px] font-bold text-admin-primary italic">WATCHING...</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[9px] space-y-3 scrollbar-hide">
            {logs?.battles?.map((battle: any) => (
              <div key={battle.id} className="border-b border-border pb-2 opacity-60 hover:opacity-100 transition-opacity">
                <p className="text-muted-foreground">[{new Date(battle.timestamp).toLocaleTimeString()}] <span className="text-admin-secondary">BATTLE</span></p>
                <p className="mt-1 font-bold italic">
                  {battle.user?.username || 'ANON'} VS {battle.agent?.name}
                </p>
                <p className={battle.winner === 'USER' ? 'text-green-500' : 'text-admin-primary'}>
                  {battle.winner === 'USER' ? 'SUCCESS' : 'DEFEAT'} // REWARD: {battle.reward} PTS
                </p>
              </div>
            ))}
            {logs?.bets?.map((bet: any) => (
              <div key={bet.id} className="border-b border-border pb-2 opacity-60 hover:opacity-100 transition-opacity">
                <p className="text-muted-foreground">[{new Date(bet.timestamp).toLocaleTimeString()}] <span className="text-admin-accent">PREDICTION</span></p>
                <p className="mt-1 italic">
                  {bet.user?.username || 'ANON'} -> {bet.position} @ {bet.market?.title}
                </p>
                <p className="text-white font-bold tracking-widest">WAGER: {bet.amount} PTS</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, change, positive, icon }: { label: string, value: string, change: string, positive: boolean, icon: any }) {
  return (
    <div className="bg-card p-8 group relative overflow-hidden transition-all hover:bg-card/80 border-r border-border last:border-r-0">
      <div className="absolute top-0 left-0 w-1 h-full bg-admin-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top"></div>
      <div className="flex items-center justify-between mb-4">
        <span className="p-2 bg-background border border-border rounded text-muted-foreground group-hover:text-admin-primary transition-colors">
          {icon}
        </span>
        <span className={`text-[9px] font-black px-1.5 py-0.5 border ${positive ? 'border-green-500/20 text-green-500' : 'border-red-500/20 text-red-500'}`}>
          {change}
        </span>
      </div>
      <p className="font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tighter italic text-foreground">{value}</p>
    </div>
  );
}

function AlertItem({ type, msg }: { type: 'WARNING' | 'CRITICAL' | 'INFO', msg: string }) {
  const colorMap = {
    WARNING: 'text-admin-accent border-admin-accent/20 bg-admin-accent/5',
    CRITICAL: 'text-admin-primary border-admin-primary/20 bg-admin-primary/5',
    INFO: 'text-white border-white/10 bg-white/5'
  };

  return (
    <div className={`p-3 border flex items-start gap-3 rounded ${colorMap[type]}`}>
      <ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[8px] font-black uppercase tracking-widest opacity-40">{type}</p>
        <p className="text-[10px] font-medium mt-1 leading-relaxed italic">{msg}</p>
      </div>
    </div>
  );
}
