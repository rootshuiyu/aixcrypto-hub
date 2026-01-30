"use client";

import React, { useState, useEffect } from "react";
import { Shield, Globe, Database, Plus, Trash2, RefreshCw, CheckCircle, XCircle, Loader2, Clock, Zap, TrendingUp, Brain } from "lucide-react";
import { api } from "../../lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "iDaAIHfveMczXR05NwkGd4L9q2PsoKQr";

interface RpcNode {
  url: string;
  name: string;
  priority: number;
  enabled: boolean;
}

interface TestResult {
  success: boolean;
  latency?: number;
  blockNumber?: number;
  error?: string;
}

export default function SettingsPage() {
  const [rpcNodes, setRpcNodes] = useState<RpcNode[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testingUrl, setTestingUrl] = useState<string | null>(null);
  
  // 新节点表单
  const [newNode, setNewNode] = useState({ url: "", name: "", priority: 50 });
  const [showAddForm, setShowAddForm] = useState(false);

  // 回合配置状态
  const [roundConfig, setRoundConfig] = useState({
    ROUND_DURATION: 60,
    BETTING_WINDOW: 55,
    LOCK_PERIOD: 5,
    MIN_BET: 10,
    MAX_BET: 1000,
    PAYOUT_RATIO: 1.95,
  });

  // 连击配置状态
  const [comboConfig, setComboConfig] = useState({
    MULTIPLIER_INCREMENT: 0.1,
    MAX_MULTIPLIER: 3.0,
    BASE_MULTIPLIER: 1.0,
    MAX_COMBO_COUNT: 20,
    RESET_MULTIPLIER: 1.0,
    RESET_COMBO: 0,
  });

  // AI 模型配置（管理后台填 KEY，与 .env 并存，DB 优先）
  const [aiConfig, setAiConfig] = useState({
    provider: "deepseek",
    deepseekApiKey: "",
    deepseekModel: "deepseek-chat",
    openaiApiKey: "",
    openaiModel: "gpt-4o-mini",
  });
  const [aiConfigSaving, setAiConfigSaving] = useState(false);

  // 加载 RPC 配置
  useEffect(() => {
    loadRpcNodes();
    loadRoundAndComboConfigs();
    loadAiConfig();
  }, []);

  const loadRoundAndComboConfigs = async () => {
    try {
      const [roundRes, comboRes] = await Promise.all([
        api.getRoundConfig(),
        api.getComboConfig()
      ]);
      setRoundConfig(roundRes);
      setComboConfig(comboRes);
    } catch (e) {
      console.error("Failed to load configs:", e);
    }
  };

  const loadAiConfig = async () => {
    try {
      const res = await api.getAiConfig();
      setAiConfig({
        provider: res.provider ?? "deepseek",
        deepseekApiKey: res.deepseekApiKey ?? "",
        deepseekModel: res.deepseekModel ?? "deepseek-chat",
        openaiApiKey: res.openaiApiKey ?? "",
        openaiModel: res.openaiModel ?? "gpt-4o-mini",
      });
    } catch (e) {
      console.error("Failed to load AI config:", e);
    }
  };

  const saveAiConfig = async () => {
    setAiConfigSaving(true);
    try {
      await api.updateAiConfig({
        provider: aiConfig.provider,
        deepseekApiKey: aiConfig.deepseekApiKey || undefined,
        deepseekModel: aiConfig.deepseekModel || undefined,
        openaiApiKey: aiConfig.openaiApiKey || undefined,
        openaiModel: aiConfig.openaiModel || undefined,
      });
      alert("AI 配置已保存，约 1 分钟内生效。");
    } catch (e) {
      alert("保存 AI 配置失败");
    } finally {
      setAiConfigSaving(false);
    }
  };

  const saveRoundConfig = async () => {
    try {
      const res = await api.updateRoundConfig(roundConfig);
      if (res.success) alert("回合配置已生效！下一回合起生效。");
    } catch (e) {
      alert("保存回合配置失败");
    }
  };

  const saveComboConfig = async () => {
    try {
      const res = await api.updateComboConfig(comboConfig);
      if (res.success) alert("连击配置已实时更新！");
    } catch (e) {
      alert("保存连击配置失败");
    }
  };

  const loadRpcNodes = async () => {
    try {
      const res = await fetch(`${API_BASE}/super-admin-api/system/rpc-nodes`, {
        headers: { "x-admin-token": ADMIN_TOKEN }
      });
      const data = await res.json();
      setRpcNodes(data.nodes || []);
      setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : null);
    } catch (e) {
      console.error("Failed to load RPC nodes:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveRpcNodes = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/super-admin-api/system/rpc-nodes`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": ADMIN_TOKEN 
        },
        body: JSON.stringify({ nodes: rpcNodes })
      });
      const data = await res.json();
      if (data.success) {
        setLastUpdated(new Date(data.updatedAt));
        alert("RPC 配置已保存！");
        // 刷新 IndexService
        await refreshIndexService();
      }
    } catch (e) {
      console.error("Failed to save RPC nodes:", e);
      alert("保存失败！");
    } finally {
      setSaving(false);
    }
  };

  const refreshIndexService = async () => {
    try {
      await fetch(`${API_BASE}/super-admin-api/system/rpc-nodes/refresh`, {
        method: "POST",
        headers: { "x-admin-token": ADMIN_TOKEN }
      });
    } catch (e) {
      console.error("Failed to refresh IndexService:", e);
    }
  };

  const testNode = async (url: string) => {
    setTestingUrl(url);
    try {
      const res = await fetch(`${API_BASE}/super-admin-api/system/rpc-nodes/test`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": ADMIN_TOKEN 
        },
        body: JSON.stringify({ url })
      });
      const result = await res.json();
      setTestResults(prev => ({ ...prev, [url]: result }));
    } catch (e) {
      setTestResults(prev => ({ ...prev, [url]: { success: false, error: "Request failed" } }));
    } finally {
      setTestingUrl(null);
    }
  };

  const addNode = () => {
    if (!newNode.url || !newNode.name) {
      alert("请填写完整的 URL 和名称");
      return;
    }
    if (rpcNodes.some(n => n.url === newNode.url)) {
      alert("该 RPC 节点已存在");
      return;
    }
    setRpcNodes([...rpcNodes, { ...newNode, enabled: true }]);
    setNewNode({ url: "", name: "", priority: 50 });
    setShowAddForm(false);
  };

  const deleteNode = (url: string) => {
    if (confirm("确定要删除这个 RPC 节点吗？")) {
      setRpcNodes(rpcNodes.filter(n => n.url !== url));
    }
  };

  const toggleNode = (url: string) => {
    setRpcNodes(rpcNodes.map(n => 
      n.url === url ? { ...n, enabled: !n.enabled } : n
    ));
  };

  const updatePriority = (url: string, priority: number) => {
    setRpcNodes(rpcNodes.map(n => 
      n.url === url ? { ...n, priority } : n
    ));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-end justify-between border-b border-border pb-8">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">System_Configuration</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] mt-2">RPC Nodes & Security Policies</p>
        </div>
      </div>

      {/* 回合制预测配置 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 回合时长控制 */}
        <div className="bg-card border border-border p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Clock className="text-admin-secondary w-5 h-5" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Round_Engine_Configuration</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground">Round Duration (Sec)</label>
                <input 
                  type="number" 
                  value={roundConfig.ROUND_DURATION}
                  onChange={(e) => setRoundConfig({...roundConfig, ROUND_DURATION: Number(e.target.value)})}
                  className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-admin-secondary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground">Lock Period (Sec)</label>
                <input 
                  type="number" 
                  value={roundConfig.LOCK_PERIOD}
                  onChange={(e) => setRoundConfig({...roundConfig, LOCK_PERIOD: Number(e.target.value)})}
                  className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-admin-secondary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-muted-foreground">Payout Ratio (multiplier)</label>
              <input 
                type="number" 
                step="0.01"
                value={roundConfig.PAYOUT_RATIO}
                onChange={(e) => setRoundConfig({...roundConfig, PAYOUT_RATIO: Number(e.target.value)})}
                className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-admin-secondary"
              />
            </div>

            <button 
              onClick={saveRoundConfig}
              className="w-full py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-admin-secondary hover:text-white transition-all shadow-lg"
            >
              Update_Engine_Parameters
            </button>
          </div>
        </div>

        {/* 连击倍数控制 */}
        <div className="bg-card border border-border p-8 space-y-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-admin-accent w-5 h-5" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Combo_Multiplier_Incentives</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground">Increment Per Win</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={comboConfig.MULTIPLIER_INCREMENT}
                  onChange={(e) => setComboConfig({...comboConfig, MULTIPLIER_INCREMENT: Number(e.target.value)})}
                  className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-admin-accent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground">Max Multiplier Cap</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={comboConfig.MAX_MULTIPLIER}
                  onChange={(e) => setComboConfig({...comboConfig, MAX_MULTIPLIER: Number(e.target.value)})}
                  className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-admin-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground">Base Multiplier (Start)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={comboConfig.BASE_MULTIPLIER}
                  onChange={(e) => setComboConfig({...comboConfig, BASE_MULTIPLIER: Number(e.target.value)})}
                  className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-admin-accent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground">Max Combo Count</label>
                <input 
                  type="number" 
                  value={comboConfig.MAX_COMBO_COUNT}
                  onChange={(e) => setComboConfig({...comboConfig, MAX_COMBO_COUNT: Number(e.target.value)})}
                  className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-admin-accent"
                />
              </div>
            </div>

            <button 
              onClick={saveComboConfig}
              className="w-full py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-admin-accent hover:text-white transition-all shadow-lg"
            >
              Sync_Combo_Scaling
            </button>
          </div>
        </div>
      </section>

      {/* AI 模型配置：管理后台填 KEY 即可，与 .env 并存，DB 优先 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border p-8 space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <Brain className="text-purple-400 w-5 h-5" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">AI_Model_Config</h3>
          </div>
          <p className="text-[9px] text-muted-foreground">在此填写 API Key 与模型名，与 .env 并存，数据库优先。约 1 分钟内生效。</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground">主用提供商</label>
                <select
                  value={aiConfig.provider}
                  onChange={(e) => setAiConfig({ ...aiConfig, provider: e.target.value })}
                  className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-purple-500"
                >
                  <option value="deepseek">DeepSeek</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground">DeepSeek API Key</label>
                <input
                  type="password"
                  value={aiConfig.deepseekApiKey}
                  onChange={(e) => setAiConfig({ ...aiConfig, deepseekApiKey: e.target.value })}
                  placeholder="sk-xxx（留空则使用 .env）"
                  className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground">DeepSeek 模型</label>
                <input
                  type="text"
                  value={aiConfig.deepseekModel}
                  onChange={(e) => setAiConfig({ ...aiConfig, deepseekModel: e.target.value })}
                  placeholder="deepseek-chat"
                  className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground">OpenAI API Key</label>
                <input
                  type="password"
                  value={aiConfig.openaiApiKey}
                  onChange={(e) => setAiConfig({ ...aiConfig, openaiApiKey: e.target.value })}
                  placeholder="sk-xxx（留空则使用 .env）"
                  className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground">OpenAI 模型</label>
                <input
                  type="text"
                  value={aiConfig.openaiModel}
                  onChange={(e) => setAiConfig({ ...aiConfig, openaiModel: e.target.value })}
                  placeholder="gpt-4o-mini"
                  className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
          <button
            onClick={saveAiConfig}
            disabled={aiConfigSaving}
            className="px-6 py-3 bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 disabled:opacity-50 transition-all"
          >
            {aiConfigSaving ? "保存中..." : "保存_AI_配置"}
          </button>
        </div>
      </section>

      {/* RPC 节点管理 */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="text-admin-primary w-5 h-5" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">RPC_Node_Management</h3>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-[9px] text-muted-foreground">
                Last updated: {lastUpdated.toLocaleString()}
              </span>
            )}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-admin-primary text-black text-[10px] font-black uppercase hover:bg-admin-primary/80 transition-all"
            >
              <Plus className="w-3 h-3" /> Add_Node
            </button>
          </div>
        </div>

        {/* 添加新节点表单 */}
        {showAddForm && (
          <div className="bg-card border border-admin-primary/30 p-6 space-y-4">
            <h4 className="text-[10px] font-black uppercase text-admin-primary">Add_New_RPC_Node</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground">RPC_URL</label>
                <input
                  type="text"
                  value={newNode.url}
                  onChange={(e) => setNewNode({ ...newNode, url: e.target.value })}
                  placeholder="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
                  className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-admin-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground">Name</label>
                <input
                  type="text"
                  value={newNode.name}
                  onChange={(e) => setNewNode({ ...newNode, name: e.target.value })}
                  placeholder="Alchemy"
                  className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-admin-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground">Priority (0-100)</label>
                <input
                  type="number"
                  value={newNode.priority}
                  onChange={(e) => setNewNode({ ...newNode, priority: Number(e.target.value) })}
                  min={0}
                  max={100}
                  className="w-full bg-background border border-border p-3 text-xs font-mono text-white outline-none focus:border-admin-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addNode} className="px-6 py-2 bg-admin-primary text-black text-[10px] font-black uppercase hover:bg-admin-primary/80">
                Confirm_Add
              </button>
              <button onClick={() => setShowAddForm(false)} className="px-6 py-2 border border-border text-[10px] font-black uppercase hover:bg-white/5">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* RPC 节点列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {rpcNodes
              .sort((a, b) => b.priority - a.priority)
              .map((node) => (
              <div key={node.url} className={`bg-card border p-4 flex items-center gap-4 ${node.enabled ? 'border-border' : 'border-border/30 opacity-50'}`}>
                {/* 启用开关 */}
                <button
                  onClick={() => toggleNode(node.url)}
                  className={`w-10 h-5 rounded-full relative transition-all ${node.enabled ? 'bg-admin-primary' : 'bg-muted'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${node.enabled ? 'right-0.5' : 'left-0.5'}`} />
                </button>

                {/* 名称和 URL */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{node.name}</span>
                    <span className={`px-2 py-0.5 text-[8px] font-bold uppercase ${
                      node.priority >= 80 ? 'bg-admin-primary/20 text-admin-primary' :
                      node.priority >= 50 ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      P{node.priority}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{node.url}</p>
                </div>

                {/* 优先级调整 */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground">Priority:</span>
                  <input
                    type="number"
                    value={node.priority}
                    onChange={(e) => updatePriority(node.url, Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-16 bg-background border border-border p-1 text-xs font-mono text-white text-center outline-none focus:border-admin-primary"
                  />
                </div>

                {/* 测试结果 */}
                {testResults[node.url] && (
                  <div className="flex items-center gap-2">
                    {testResults[node.url].success ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-[9px] text-green-500">{testResults[node.url].latency}ms</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-[9px] text-red-500 max-w-[100px] truncate">{testResults[node.url].error}</span>
                      </>
                    )}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => testNode(node.url)}
                    disabled={testingUrl === node.url}
                    className="p-2 border border-border hover:bg-white hover:text-black transition-all disabled:opacity-50"
                    title="测试连接"
                  >
                    {testingUrl === node.url ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteNode(node.url)}
                    className="p-2 border border-border hover:bg-red-500 hover:border-red-500 hover:text-white transition-all"
                    title="删除节点"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 保存按钮 */}
        <div className="pt-6 flex gap-4">
          <button
            onClick={saveRpcNodes}
            disabled={saving}
            className="flex-1 py-4 bg-admin-primary text-black text-[10px] font-black uppercase tracking-widest hover:bg-admin-primary/80 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save_RPC_Configuration
          </button>
          <button
            onClick={loadRpcNodes}
            className="px-10 py-4 border border-border text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
          >
            Reset
          </button>
        </div>
      </section>

      {/* 安全设置 */}
      <section className="space-y-6 pt-8 border-t border-border">
        <div className="flex items-center gap-3">
          <Shield className="text-admin-secondary w-5 h-5" />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Security_Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-[9px] font-black uppercase text-muted-foreground block">Admin_Secret_Key</label>
            <div className="flex gap-2">
              <input type="password" value="********" readOnly className="flex-1 bg-card border border-border p-3 text-xs font-mono text-muted-foreground outline-none" />
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[9px] font-black uppercase text-muted-foreground block">Rate_Limiting (Req/Min)</label>
            <input type="number" defaultValue={60} className="w-full bg-card border border-border p-3 text-xs font-mono text-white outline-none focus:border-admin-secondary" />
          </div>
        </div>
      </section>

      {/* API 网关设置 */}
      <section className="space-y-6 pt-8 border-t border-border">
        <div className="flex items-center gap-3">
          <Globe className="text-yellow-500 w-5 h-5" />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">API_Gateway_Settings</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-muted-foreground block">Backend_Endpoint</label>
            <input type="text" defaultValue="http://localhost:3001" className="w-full bg-card border border-border p-3 text-xs font-mono text-white outline-none focus:border-yellow-500" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-muted-foreground block">Allowed_CORS_Origins</label>
            <textarea defaultValue="http://localhost:3000, http://localhost:3002" className="w-full bg-card border border-border p-3 text-xs font-mono text-white h-20 outline-none focus:border-yellow-500" />
          </div>
        </div>
      </section>

      {/* 预设 RPC 模板 */}
      <section className="space-y-6 pt-8 border-t border-border">
        <div className="flex items-center gap-3">
          <Database className="text-purple-500 w-5 h-5" />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Quick_Add_Templates</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Alchemy", placeholder: "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY" },
            { name: "Infura", placeholder: "https://mainnet.infura.io/v3/YOUR_KEY" },
            { name: "QuickNode", placeholder: "https://YOUR_SUBDOMAIN.quiknode.pro/YOUR_KEY/" },
            { name: "Ankr", placeholder: "https://rpc.ankr.com/eth/YOUR_KEY" },
          ].map((template) => (
            <button
              key={template.name}
              onClick={() => {
                setNewNode({ url: template.placeholder, name: template.name, priority: 90 });
                setShowAddForm(true);
              }}
              className="p-4 border border-border hover:border-purple-500 hover:bg-purple-500/10 transition-all text-left"
            >
              <span className="text-xs font-black text-white block">{template.name}</span>
              <span className="text-[9px] text-muted-foreground">Click to add</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
