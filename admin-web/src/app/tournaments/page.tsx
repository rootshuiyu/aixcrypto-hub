"use client";

import React, { useState, useEffect } from "react";
import { 
  Swords, 
  Plus, 
  RefreshCw, 
  Calendar,
  Edit2,
  Trash2,
  Play,
  Square,
  Clock,
  Users,
  DollarSign,
  Trophy,
  Eye
} from "lucide-react";
import { api } from "../../lib/api";

interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ACTIVE" | "ENDED";
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  createdAt: string;
}

interface Participant {
  userId: string;
  username?: string;
  address: string;
  score: number;
  rank: number;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [viewingParticipants, setViewingParticipants] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    entryFee: 0,
    prizePool: 1000,
    maxParticipants: 100
  });

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const data = await api.getTournaments();
      setTournaments(data || []);
    } catch (error) {
      console.error("Failed to load tournaments:", error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async (tournamentId: string) => {
    setLoadingParticipants(true);
    try {
      const data = await api.getTournamentParticipants(tournamentId);
      setParticipants(data || []);
    } catch (error) {
      console.error("Failed to load participants:", error);
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
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
      await api.createTournament({
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        entryFee: formData.entryFee,
        prizePool: formData.prizePool,
        maxParticipants: formData.maxParticipants
      });
      alert("锦标赛创建成功！");
      setShowCreateModal(false);
      resetForm();
      loadTournaments();
    } catch (error) {
      console.error("Failed to create tournament:", error);
      alert("创建失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTournament) return;

    setSaving(true);
    try {
      await api.updateTournament(editingTournament.id, {
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        entryFee: formData.entryFee,
        prizePool: formData.prizePool,
        maxParticipants: formData.maxParticipants
      });
      alert("锦标赛更新成功！");
      setEditingTournament(null);
      resetForm();
      loadTournaments();
    } catch (error) {
      console.error("Failed to update tournament:", error);
      alert("更新失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此锦标赛？此操作不可撤销。")) return;
    
    try {
      await api.deleteTournament(id);
      loadTournaments();
    } catch (error) {
      console.error("Failed to delete tournament:", error);
      alert("删除失败");
    }
  };

  const handleEndTournament = async (id: string) => {
    if (!confirm("确定结束此锦标赛？")) return;
    
    try {
      await api.endTournament(id);
      alert("锦标赛已结束");
      loadTournaments();
    } catch (error) {
      console.error("Failed to end tournament:", error);
      alert("操作失败");
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: "", 
      description: "", 
      startDate: "", 
      endDate: "",
      entryFee: 0,
      prizePool: 1000,
      maxParticipants: 100
    });
  };

  const openEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      description: tournament.description || "",
      startDate: tournament.startDate.split("T")[0],
      endDate: tournament.endDate.split("T")[0],
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      maxParticipants: tournament.maxParticipants
    });
  };

  const openParticipants = (tournamentId: string) => {
    setViewingParticipants(tournamentId);
    loadParticipants(tournamentId);
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

  const activeTournaments = tournaments.filter(t => t.status === "ACTIVE");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Swords className="w-7 h-7 text-admin-primary" />
            Tournaments
          </h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            锦标赛管理 // 创建和管理竞技锦标赛
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadTournaments}
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
            创建锦标赛
          </button>
        </div>
      </div>

      {/* Active Tournaments Stats */}
      {activeTournaments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-green-500/30 bg-green-500/10">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">进行中</div>
            <div className="text-2xl font-black text-green-400 mt-1">{activeTournaments.length}</div>
          </div>
          <div className="p-4 border border-yellow-500/30 bg-yellow-500/10">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">总奖池</div>
            <div className="text-2xl font-black text-yellow-400 mt-1">
              {activeTournaments.reduce((sum, t) => sum + t.prizePool, 0).toLocaleString()} PTS
            </div>
          </div>
          <div className="p-4 border border-purple-500/30 bg-purple-500/10">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">参与者</div>
            <div className="text-2xl font-black text-purple-400 mt-1">
              {activeTournaments.reduce((sum, t) => sum + (t.currentParticipants || 0), 0)}
            </div>
          </div>
        </div>
      )}

      {/* Tournaments List */}
      <div className="border border-border bg-card/30">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Swords className="w-4 h-4" />
            所有锦标赛
          </h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-admin-primary animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Swords className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">暂无锦标赛</p>
            <p className="text-xs mt-1">点击上方按钮创建第一个锦标赛</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tournaments.map(tournament => (
              <div key={tournament.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded ${
                      tournament.status === "ACTIVE" ? "bg-green-500/20 text-green-400" :
                      tournament.status === "UPCOMING" ? "bg-blue-500/20 text-blue-400" :
                      "bg-gray-500/20 text-gray-400"
                    }`}>
                      <Swords className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold">{tournament.name}</h3>
                        {getStatusBadge(tournament.status)}
                      </div>
                      {tournament.description && (
                        <p className="text-xs text-muted-foreground mt-1">{tournament.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {tournament.currentParticipants || 0}/{tournament.maxParticipants}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {tournament.prizePool.toLocaleString()} PTS
                        </span>
                        {tournament.entryFee > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            入场费: {tournament.entryFee} PTS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openParticipants(tournament.id)}
                      className="p-2 hover:bg-white/10 transition-colors"
                      title="查看参与者"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {tournament.status !== "ENDED" && (
                      <button
                        onClick={() => openEdit(tournament)}
                        className="p-2 hover:bg-white/10 transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {tournament.status === "ACTIVE" && (
                      <button
                        onClick={() => handleEndTournament(tournament.id)}
                        className="p-2 hover:bg-yellow-500/20 text-yellow-500 transition-colors"
                        title="结束锦标赛"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(tournament.id)}
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
      {(showCreateModal || editingTournament) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg border border-border bg-card max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card">
              <h3 className="text-sm font-black uppercase tracking-wider">
                {editingTournament ? "编辑锦标赛" : "创建新锦标赛"}
              </h3>
              <button
                onClick={() => { setShowCreateModal(false); setEditingTournament(null); resetForm(); }}
                className="text-muted-foreground hover:text-white"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={editingTournament ? handleUpdate : handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                  锦标赛名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例: Weekly Battle Royale"
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
                  placeholder="锦标赛描述..."
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
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                    入场费 (PTS)
                  </label>
                  <input
                    type="number"
                    value={formData.entryFee}
                    onChange={e => setFormData({ ...formData, entryFee: Number(e.target.value) })}
                    min={0}
                    className="w-full bg-background border border-border p-3 text-sm focus:outline-none focus:border-admin-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                    奖池 (PTS)
                  </label>
                  <input
                    type="number"
                    value={formData.prizePool}
                    onChange={e => setFormData({ ...formData, prizePool: Number(e.target.value) })}
                    min={0}
                    className="w-full bg-background border border-border p-3 text-sm focus:outline-none focus:border-admin-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                    最大人数
                  </label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={e => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                    min={2}
                    className="w-full bg-background border border-border p-3 text-sm focus:outline-none focus:border-admin-primary"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingTournament(null); resetForm(); }}
                  className="flex-1 py-3 border border-border text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-admin-primary text-black text-xs font-bold uppercase tracking-wider hover:bg-admin-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "保存中..." : editingTournament ? "更新锦标赛" : "创建锦标赛"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {viewingParticipants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg border border-border bg-card max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-admin-primary" />
                参与者列表
              </h3>
              <button
                onClick={() => setViewingParticipants(null)}
                className="text-muted-foreground hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loadingParticipants ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 text-admin-primary animate-spin" />
                </div>
              ) : participants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">暂无参与者</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {participants.map((p, index) => (
                    <div key={p.userId} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center text-sm font-bold ${
                          index < 3 ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10"
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-bold">{p.username || `User ${p.userId.slice(0, 8)}`}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{p.address.slice(0, 10)}...</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-admin-primary">{p.score.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">PTS</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
