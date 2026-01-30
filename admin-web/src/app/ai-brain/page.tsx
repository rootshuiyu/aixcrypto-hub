"use client";

import React, { useState } from "react";
import { Brain, Database, Sliders, MessageSquareCode, Settings2, X, Activity, Target, Zap, Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export default function AiBrain() {
  const queryClient = useQueryClient();
  const [editingAgent, setEditingAgent] = useState<any>(null);
  
  // 调整参数
  const [tuneWinRate, setWinRate] = useState(50);
  const [tuneDifficultyBias, setDifficultyBias] = useState(0);
  const [tuneAggressiveness, setAggressiveness] = useState(0.5);
  const [tuneTrapFrequency, setTrapFrequency] = useState(0.1);
  const [tuneIsActive, setIsActive] = useState(true);
  const [tunePersonality, setPersonality] = useState("");

  const { data: agents, isLoading: isAgentsLoading } = useQuery({
    queryKey: ["adminAgentConfigs"],
    queryFn: () => api.getAgentConfigs(),
  });

  const tuneMutation = useMutation({
    mutationFn: (data: { id: string, config: any }) => api.updateAgent(data.id, data.config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAgentConfigs"] });
      setEditingAgent(null);
      alert("AI parameters updated successfully!");
    },
    onError: (error: any) => {
      alert(`Update failed: ${error.message}`);
    }
  });

  const handleTuneClick = (agent: any) => {
    setEditingAgent(agent);
    setWinRate(agent.winRate || 50);
    setDifficultyBias(agent.difficultyBias || 0);
    setAggressiveness(agent.aggressiveness || 0.5);
    setTrapFrequency(agent.trapFrequency || 0.1);
    setIsActive(agent.isActive !== false);
    setPersonality(agent.personality || "");
  };

  const handleSave = () => {
    tuneMutation.mutate({
      id: editingAgent.id,
      config: {
        winRate: tuneWinRate,
        difficultyBias: tuneDifficultyBias,
        aggressiveness: tuneAggressiveness,
        trapFrequency: tuneTrapFrequency,
        isActive: tuneIsActive,
        personality: tunePersonality
      }
    });
  };

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'EASY': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HARD': return 'bg-orange-500';
      case 'MASTER': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-end justify-between border-b border-border pb-8">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">AI_Intelligence_Hub</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-2">Neural Network Management & Agent Configuration</p>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(agents as any)?.map((agent: any) => (
          <div key={agent.id} className={`border border-border bg-card p-6 space-y-4 relative ${!agent.isActive ? 'opacity-50' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-12 ${getLevelColor(agent.level)}`}></div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">{agent.name}</h3>
                  <p className="text-[9px] font-mono text-muted-foreground uppercase">
                    Level: {agent.level} // {agent.isActive ? 'ACTIVE' : 'DISABLED'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleTuneClick(agent)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-admin-secondary hover:text-black transition-all"
              >
                <Settings2 className="w-4 h-4" /> Configure
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-background border border-border">
                <p className="text-[8px] font-black text-muted-foreground uppercase">Target Win%</p>
                <p className="text-lg font-black text-admin-secondary">{agent.winRate}%</p>
              </div>
              <div className="p-3 bg-background border border-border">
                <p className="text-[8px] font-black text-muted-foreground uppercase">Actual Win%</p>
                <p className="text-lg font-black text-white">{agent.actualWinRate}%</p>
              </div>
              <div className="p-3 bg-background border border-border">
                <p className="text-[8px] font-black text-muted-foreground uppercase">Difficulty</p>
                <p className="text-lg font-black text-admin-accent">{((agent.difficultyBias || 0) * 100).toFixed(0)}%</p>
              </div>
              <div className="p-3 bg-background border border-border">
                <p className="text-[8px] font-black text-muted-foreground uppercase">Battles</p>
                <p className="text-lg font-black">{agent.totalBattles || 0}</p>
              </div>
            </div>

            {/* Parameters Preview */}
            <div className="flex gap-4 text-[9px] font-mono text-muted-foreground">
              <span>AGG: {((agent.aggressiveness || 0.5) * 100).toFixed(0)}%</span>
              <span>TRAP: {((agent.trapFrequency || 0.1) * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tuning Modal */}
      {editingAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="w-full max-w-2xl border border-border bg-card p-10 space-y-8 shadow-[0_0_50px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">CORE_TUNING // {editingAgent.name}</h3>
                <p className="text-[10px] font-mono text-white/20 mt-1 uppercase tracking-widest italic">
                  Level: {editingAgent.level} | Current Battles: {editingAgent.totalBattles || 0}
                </p>
              </div>
              <button onClick={() => setEditingAgent(null)} className="text-white/20 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 bg-background border border-border">
              <div>
                <p className="text-[10px] font-black uppercase">Agent Status</p>
                <p className="text-[9px] text-muted-foreground">Enable or disable this AI agent</p>
              </div>
              <button 
                onClick={() => setIsActive(!tuneIsActive)}
                className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase ${tuneIsActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
              >
                {tuneIsActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {tuneIsActive ? 'ACTIVE' : 'DISABLED'}
              </button>
            </div>

            {/* Parameter Sliders */}
            <div className="space-y-6">
              {/* Win Rate */}
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <label className="flex items-center gap-2"><Target className="w-4 h-4 text-admin-secondary" /> Target_Win_Rate</label>
                  <span className="text-admin-secondary font-mono text-lg">{tuneWinRate}%</span>
                </div>
                <input 
                  type="range" 
                  value={tuneWinRate}
                  onChange={(e) => setWinRate(Number(e.target.value))}
                  className="w-full h-2 bg-white/5 appearance-none cursor-pointer accent-admin-secondary rounded" 
                  min="0" max="100" 
                />
                <p className="text-[8px] text-muted-foreground">AI 的目标胜率基准线</p>
              </div>

              {/* Difficulty Bias */}
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <label className="flex items-center gap-2"><Sliders className="w-4 h-4 text-admin-accent" /> Difficulty_Bias</label>
                  <span className="text-admin-accent font-mono text-lg">{(tuneDifficultyBias * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  value={tuneDifficultyBias * 100 + 50}
                  onChange={(e) => setDifficultyBias((Number(e.target.value) - 50) / 100)}
                  className="w-full h-2 bg-white/5 appearance-none cursor-pointer accent-admin-accent rounded" 
                  min="0" max="100" 
                />
                <p className="text-[8px] text-muted-foreground">难度偏移：负值让 AI 更弱，正值让 AI 更强 (-50% ~ +50%)</p>
              </div>

              {/* Aggressiveness */}
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <label className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> Aggressiveness</label>
                  <span className="text-yellow-500 font-mono text-lg">{(tuneAggressiveness * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  value={tuneAggressiveness * 100}
                  onChange={(e) => setAggressiveness(Number(e.target.value) / 100)}
                  className="w-full h-2 bg-white/5 appearance-none cursor-pointer accent-yellow-500 rounded" 
                  min="0" max="100" 
                />
                <p className="text-[8px] text-muted-foreground">激进程度：高值时 AI 更倾向冒险决策</p>
              </div>

              {/* Trap Frequency */}
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <label className="flex items-center gap-2"><Shield className="w-4 h-4 text-red-500" /> Trap_Frequency</label>
                  <span className="text-red-500 font-mono text-lg">{(tuneTrapFrequency * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  value={tuneTrapFrequency * 100}
                  onChange={(e) => setTrapFrequency(Number(e.target.value) / 100)}
                  className="w-full h-2 bg-white/5 appearance-none cursor-pointer accent-red-500 rounded" 
                  min="0" max="50" 
                />
                <p className="text-[8px] text-muted-foreground">诱空/诱多频率：AI 制造陷阱策略的概率 (0% ~ 50%)</p>
              </div>

              {/* Personality */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" /> Personality_Prompt
                </label>
                <textarea
                  value={tunePersonality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="Define AI personality for battle commentary..."
                  className="w-full h-24 bg-background border border-border p-4 text-[11px] font-mono resize-none focus:border-admin-secondary outline-none"
                />
                <p className="text-[8px] text-muted-foreground">AI 的个性描述，用于生成对战评语（留空使用默认）</p>
              </div>
            </div>

            {/* Stats Preview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-background border border-border">
                <p className="text-[8px] font-black text-muted-foreground uppercase">Current_Accuracy</p>
                <p className="text-xl font-black italic tracking-tighter text-white">{editingAgent.actualWinRate}%</p>
              </div>
              <div className="p-4 bg-background border border-border">
                <p className="text-[8px] font-black text-muted-foreground uppercase">Global_Battles</p>
                <p className="text-xl font-black italic tracking-tighter text-white">{editingAgent.totalBattles || 0}</p>
              </div>
              <div className="p-4 bg-background border border-border">
                <p className="text-[8px] font-black text-muted-foreground uppercase">Effective_Difficulty</p>
                <p className="text-xl font-black italic tracking-tighter text-admin-accent">
                  {tuneDifficultyBias >= 0 ? '+' : ''}{(tuneDifficultyBias * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button 
                onClick={() => setEditingAgent(null)} 
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border border-border hover:bg-white/5 transition-all"
              >
                ABORT_CHANGES
              </button>
              <button 
                onClick={handleSave}
                disabled={tuneMutation.isPending}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-admin-secondary transition-all disabled:opacity-50"
              >
                {tuneMutation.isPending ? 'SYNCING_BRAIN...' : 'COMMIT_TO_BRAIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Base Section */}
      <div className="border border-border bg-card p-8">
        <div className="flex items-center gap-3 mb-8">
          <Database className="text-admin-primary w-5 h-5" />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Global_Difficulty_Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 bg-background border border-border">
            <p className="text-[9px] font-black uppercase text-muted-foreground">EASY_Agents</p>
            <p className="text-xl font-black mt-2 text-green-500">
              {(agents as any)?.filter((a: any) => a.level === 'EASY' && a.isActive).length || 0} Active
            </p>
          </div>
          <div className="p-4 bg-background border border-border">
            <p className="text-[9px] font-black uppercase text-muted-foreground">MEDIUM_Agents</p>
            <p className="text-xl font-black mt-2 text-yellow-500">
              {(agents as any)?.filter((a: any) => a.level === 'MEDIUM' && a.isActive).length || 0} Active
            </p>
          </div>
          <div className="p-4 bg-background border border-border">
            <p className="text-[9px] font-black uppercase text-muted-foreground">HARD_Agents</p>
            <p className="text-xl font-black mt-2 text-orange-500">
              {(agents as any)?.filter((a: any) => a.level === 'HARD' && a.isActive).length || 0} Active
            </p>
          </div>
          <div className="p-4 bg-background border border-border">
            <p className="text-[9px] font-black uppercase text-muted-foreground">MASTER_Agents</p>
            <p className="text-xl font-black mt-2 text-red-500">
              {(agents as any)?.filter((a: any) => a.level === 'MASTER' && a.isActive).length || 0} Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
