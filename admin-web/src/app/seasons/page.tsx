"use client";

import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Plus, 
  RefreshCw, 
  Calendar,
  Edit2,
  Trash2,
  Play,
  Square,
  Clock,
  Users,
  Award
} from "lucide-react";
import { api } from "../../lib/api";

interface Season {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ACTIVE" | "ENDED";
  participantCount?: number;
  createdAt: string;
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    setLoading(true);
    try {
      const [seasonsData, activeData] = await Promise.all([
        api.getSeasons(),
        api.getActiveSeason().catch(() => null)
      ]);
      setSeasons(seasonsData || []);
      setActiveSeason(activeData);
    } catch (error) {
      console.error("Failed to load seasons:", error);
      setSeasons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
      alert("请填写必要信息");
      return;
    }

    setSaving(true);
    try {
      await api.createSeason({
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      alert("赛季创建成功！");
      setShowCreateModal(false);
      resetForm();
      loadSeasons();
    } catch (error) {
      console.error("Failed to create season:", error);
      alert("创建失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeason) return;

    setSaving(true);
    try {
      await api.updateSeason(editingSeason.id, {
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      alert("赛季更新成功！");
      setEditingSeason(null);
      resetForm();
      loadSeasons();
    } catch (error) {
      console.error("Failed to update season:", error);
      alert("更新失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此赛季？此操作不可撤销。")) return;
    
    try {
      await api.deleteSeason(id);
      loadSeasons();
    } catch (error) {
      console.error("Failed to delete season:", error);
      alert("删除失败");
    }
  };

  const handleEndSeason = async (id: string) => {
    if (!confirm("确定结束此赛季？")) return;
    
    try {
      await api.endSeason(id);
      alert("赛季已结束");
      loadSeasons();
    } catch (error) {
      console.error("Failed to end season:", error);
      alert("操作失败");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", startDate: "", endDate: "" });
  };

  const openEdit = (season: Season) => {
    setEditingSeason(season);
    setFormData({
      name: season.name,
      description: season.description || "",
      startDate: season.startDate.split("T")[0],
      endDate: season.endDate.split("T")[0]
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] uppercase flex items-center gap-1"><Play className="w-3 h-3" /> 进行中</span>;
      case "UPCOMING":
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> 即将开始</span>;
      case "ENDED":
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-[10px] uppercase flex items-center gap-1"><Square className="w-3 h-3" /> 已结束</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Trophy className="w-7 h-7 text-admin-primary" />
            Seasons
          </h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            赛季管理 // 创建和管理竞技赛季
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadSeasons}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-border hover:bg-white/5 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button
            onClick={() => { setShowCreateModal(true); resetForm(); }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-admin-primary text-black hover:bg-admin-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            创建赛季
          </button>
        </div>
      </div>

      {/* Active Season Banner */}
      {activeSeason && (
        <div className="p-6 border-2 border-green-500/50 bg-green-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Trophy className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black">{activeSeason.name}</h3>
                  {getStatusBadge("ACTIVE")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(activeSeason.startDate)} - {formatDate(activeSeason.endDate)}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleEndSeason(activeSeason.id)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Square className="w-4 h-4" />
              结束赛季
            </button>
          </div>
        </div>
      )}

      {/* Seasons List */}
      <div className="border border-border bg-card/30">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            所有赛季
          </h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-admin-primary animate-spin" />
          </div>
        ) : seasons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Trophy className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">暂无赛季</p>
            <p className="text-xs mt-1">点击上方按钮创建第一个赛季</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {seasons.map(season => (
              <div key={season.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded ${
                      season.status === "ACTIVE" ? "bg-green-500/20 text-green-400" :
                      season.status === "UPCOMING" ? "bg-blue-500/20 text-blue-400" :
                      "bg-gray-500/20 text-gray-400"
                    }`}>
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold">{season.name}</h3>
                        {getStatusBadge(season.status)}
                      </div>
                      {season.description && (
                        <p className="text-xs text-muted-foreground mt-1">{season.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(season.startDate)} - {formatDate(season.endDate)}
                        </span>
                        {season.participantCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {season.participantCount} 参与者
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {season.status !== "ENDED" && (
                      <button
                        onClick={() => openEdit(season)}
                        className="p-2 hover:bg-white/10 transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {season.status === "ACTIVE" && (
                      <button
                        onClick={() => handleEndSeason(season.id)}
                        className="p-2 hover:bg-yellow-500/20 text-yellow-500 transition-colors"
                        title="结束赛季"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(season.id)}
                      className="p-2 hover:bg-red-500/20 text-red-500 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSeason) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg border border-border bg-card">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider">
                {editingSeason ? "编辑赛季" : "创建新赛季"}
              </h3>
              <button
                onClick={() => { setShowCreateModal(false); setEditingSeason(null); resetForm(); }}
                className="text-muted-foreground hover:text-white"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={editingSeason ? handleUpdate : handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                  赛季名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例: Season 1 - Genesis"
                  className="w-full bg-background border border-border p-3 text-sm focus:outline-none focus:border-admin-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="赛季描述..."
                  rows={3}
                  className="w-full bg-background border border-border p-3 text-sm focus:outline-none focus:border-admin-primary resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                    开始日期 *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-background border border-border p-3 text-sm focus:outline-none focus:border-admin-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                    结束日期 *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-background border border-border p-3 text-sm focus:outline-none focus:border-admin-primary"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingSeason(null); resetForm(); }}
                  className="flex-1 py-3 border border-border text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-admin-primary text-black text-xs font-bold uppercase tracking-wider hover:bg-admin-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "保存中..." : editingSeason ? "更新赛季" : "创建赛季"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
