"use client";

import React, { useState, useEffect } from "react";
import { 
  ToggleLeft, 
  ToggleRight, 
  Save, 
  RefreshCw, 
  AlertTriangle,
  Settings,
  Gamepad2,
  Bell,
  Trophy,
  Users,
  Wallet,
  TrendingUp,
  Shield
} from "lucide-react";
import { api } from "../../lib/api";

interface FeatureFlag {
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
  category: string;
}

const FEATURE_CATEGORIES = {
  core: { name: "核心功能", color: "text-cyan-400" },
  trading: { name: "交易功能", color: "text-green-400" },
  social: { name: "社交功能", color: "text-purple-400" },
  rewards: { name: "奖励功能", color: "text-yellow-400" },
};

const DEFAULT_FEATURES: FeatureFlag[] = [
  { name: "Playground", key: "playground", description: "AI 对战游戏功能", enabled: true, icon: <Gamepad2 className="w-5 h-5" />, category: "core" },
  { name: "Market Trading", key: "market", description: "预测市场交易功能", enabled: true, icon: <TrendingUp className="w-5 h-5" />, category: "trading" },
  { name: "Wallet", key: "wallet", description: "钱包充值/提现功能", enabled: true, icon: <Wallet className="w-5 h-5" />, category: "core" },
  { name: "Notifications", key: "notifications", description: "通知推送功能", enabled: true, icon: <Bell className="w-5 h-5" />, category: "social" },
  { name: "Seasons", key: "seasons", description: "赛季排名功能", enabled: true, icon: <Trophy className="w-5 h-5" />, category: "rewards" },
  { name: "Tournaments", key: "tournaments", description: "锦标赛功能", enabled: true, icon: <Trophy className="w-5 h-5" />, category: "rewards" },
  { name: "Referral", key: "referral", description: "推荐奖励系统", enabled: true, icon: <Users className="w-5 h-5" />, category: "social" },
  { name: "Team", key: "team", description: "团队功能", enabled: true, icon: <Users className="w-5 h-5" />, category: "social" },
  { name: "Leaderboard", key: "leaderboard", description: "排行榜功能", enabled: true, icon: <Trophy className="w-5 h-5" />, category: "rewards" },
  { name: "Maintenance Mode", key: "maintenance", description: "全站维护模式", enabled: false, icon: <Shield className="w-5 h-5" />, category: "core" },
];

export default function FeatureFlagsPage() {
  const [features, setFeatures] = useState<FeatureFlag[]>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalFlags, setOriginalFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    setLoading(true);
    try {
      const data = await api.getFeatureFlags();
      const flags = data.flags || data;
      
      // 合并后端数据到默认配置
      const updatedFeatures = DEFAULT_FEATURES.map(f => ({
        ...f,
        enabled: flags[f.key] !== undefined ? flags[f.key] : f.enabled
      }));
      
      setFeatures(updatedFeatures);
      setOriginalFlags(flags);
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to load feature flags:", error);
      // 使用默认值
      const defaultFlags: Record<string, boolean> = {};
      DEFAULT_FEATURES.forEach(f => { defaultFlags[f.key] = f.enabled; });
      setOriginalFlags(defaultFlags);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (key: string) => {
    setFeatures(prev => prev.map(f => 
      f.key === key ? { ...f, enabled: !f.enabled } : f
    ));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const flags: Record<string, boolean> = {};
      features.forEach(f => { flags[f.key] = f.enabled; });
      
      await api.updateFeatureFlags(flags);
      setOriginalFlags(flags);
      setHasChanges(false);
      alert("功能开关已保存！");
    } catch (error) {
      console.error("Failed to save feature flags:", error);
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setFeatures(DEFAULT_FEATURES.map(f => ({
      ...f,
      enabled: originalFlags[f.key] !== undefined ? originalFlags[f.key] : f.enabled
    })));
    setHasChanges(false);
  };

  const groupedFeatures = Object.keys(FEATURE_CATEGORIES).map(category => ({
    category,
    ...FEATURE_CATEGORIES[category as keyof typeof FEATURE_CATEGORIES],
    features: features.filter(f => f.category === category)
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Settings className="w-7 h-7 text-admin-primary" />
            Feature_Flags
          </h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            功能开关管理 // 实时控制前端功能
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadFeatureFlags}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-border hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          
          {hasChanges && (
            <>
              <button
                onClick={resetChanges}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 transition-colors"
              >
                重置
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-admin-primary text-black hover:bg-admin-primary/90 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "保存中..." : "保存更改"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      {hasChanges && (
        <div className="flex items-center gap-3 p-4 border border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <p className="text-xs uppercase tracking-wider text-yellow-500">
            您有未保存的更改 // 更改将立即影响所有用户
          </p>
        </div>
      )}

      {/* Feature Groups */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-admin-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {groupedFeatures.map(group => (
            <div key={group.category} className="border border-border bg-card/30">
              <div className="p-4 border-b border-border">
                <h2 className={`text-sm font-black uppercase tracking-wider ${group.color}`}>
                  {group.name}
                </h2>
              </div>
              
              <div className="divide-y divide-border">
                {group.features.map(feature => (
                  <div 
                    key={feature.key}
                    className={`flex items-center justify-between p-4 transition-colors ${
                      feature.enabled ? 'bg-transparent' : 'bg-red-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded ${feature.enabled ? 'bg-admin-primary/20 text-admin-primary' : 'bg-gray-500/20 text-gray-500'}`}>
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{feature.name}</h3>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                        <p className="text-[10px] text-muted-foreground/50 font-mono mt-1">key: {feature.key}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleFeature(feature.key)}
                      className={`relative flex items-center transition-colors ${
                        feature.enabled ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {feature.enabled ? (
                        <ToggleRight className="w-10 h-10" />
                      ) : (
                        <ToggleLeft className="w-10 h-10" />
                      )}
                      <span className={`ml-2 text-xs font-bold uppercase ${
                        feature.enabled ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {feature.enabled ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <div className="p-4 border border-border bg-card/20 text-xs text-muted-foreground">
        <p className="uppercase tracking-wider">
          <strong className="text-admin-primary">提示：</strong> 
          功能开关会即时影响所有用户。关闭某功能后，用户访问该页面将看到维护提示。
        </p>
      </div>
    </div>
  );
}
