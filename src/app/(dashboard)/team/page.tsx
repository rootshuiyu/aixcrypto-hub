"use client";

import { useState } from "react";
import { useLanguageStore } from "../../../stores/language-store";
import { translations } from "../../../lib/translations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { useAuth } from "../../../hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingOctopus, InkParticles, TentacleWaves } from "@/components/ui/octopus-decorations";
import { SparklesCore } from "@/components/aceternity/sparkles";
import { OctoTeam } from "@/components/icons/octopus-icons";

// 章鱼主题图标组件
const OctoIcons = {
  // 章鱼积分
  Points: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="10" rx="6" ry="5" />
      <circle cx="10" cy="9" r="1.5" fill="currentColor" />
      <circle cx="14" cy="9" r="1.5" fill="currentColor" />
      <path d="M6 14c-2 1-3 3-2 5" strokeLinecap="round" opacity="0.5" />
      <path d="M18 14c2 1 3 3 2 5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  // 章鱼社群
  Users: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="8" rx="4" ry="3" />
      <circle cx="11" cy="7.5" r="0.8" fill="currentColor" />
      <circle cx="13" cy="7.5" r="0.8" fill="currentColor" />
      <ellipse cx="6" cy="10" rx="3" ry="2" opacity="0.5" />
      <ellipse cx="18" cy="10" rx="3" ry="2" opacity="0.5" />
      <path d="M9 11c-1 2-1 4 0 5" strokeLinecap="round" opacity="0.4" />
      <path d="M15 11c1 2 1 4 0 5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  // 章鱼奖杯
  Trophy: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 21h8M12 17v4" />
      <path d="M6 4h12v7a6 6 0 1 1-12 0V4z" />
      <ellipse cx="12" cy="8" rx="4" ry="3" opacity="0.3" />
      <circle cx="10" cy="7" r="1" fill="currentColor" opacity="0.5" />
      <circle cx="14" cy="7" r="1" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  // 章鱼火焰活力
  Fire: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="14" rx="6" ry="5" />
      <circle cx="10" cy="13" r="1" fill="currentColor" />
      <circle cx="14" cy="13" r="1" fill="currentColor" />
      <path d="M12 4c0 4-4 5-4 8" opacity="0.4" />
      <path d="M12 4c0 4 4 5 4 8" opacity="0.4" />
      <path d="M8 18c-1 1 0 2 1 3" strokeLinecap="round" opacity="0.4" />
      <path d="M16 18c1 1 0 2-1 3" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  // 章鱼添加
  Plus: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="10" rx="5" ry="4" opacity="0.3" />
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  // 章鱼关闭
  X: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="12" rx="6" ry="5" opacity="0.2" />
      <path d="M16 8L8 16M8 8l8 8" />
    </svg>
  ),
  // 章鱼搜索
  Search: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="10" cy="10" rx="6" ry="5" />
      <circle cx="8" cy="9" r="1" fill="currentColor" opacity="0.5" />
      <circle cx="12" cy="9" r="1" fill="currentColor" opacity="0.5" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  // 章鱼钥匙
  Key: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="8" cy="14" rx="5" ry="4" />
      <circle cx="6" cy="13" r="1" fill="currentColor" opacity="0.5" />
      <circle cx="10" cy="13" r="1" fill="currentColor" opacity="0.5" />
      <path d="M12 12l8-8M18 6l2-2" />
      <path d="M5 17c-1 1 0 2 1 3" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  // 章鱼离开
  Logout: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="8" cy="12" rx="5" ry="4" opacity="0.3" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
  // 章鱼皇冠
  Crown: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 18l3-8 5 4 2-10 2 10 5-4 3 8H2z" />
      <ellipse cx="12" cy="20" rx="4" ry="2" opacity="0.3" />
    </svg>
  ),
  // 章鱼复制
  Copy: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      <path d="M6 20c-1 1 0 2 1 2" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  // 章鱼刷新
  Refresh: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="12" rx="6" ry="5" opacity="0.2" />
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
};

// 章鱼成员卡片
const OctoMemberCard = ({ member, isLeader, teamLeaderId, index, t }: any) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="relative group"
  >
    <div className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all ${
      isLeader 
        ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30' 
        : 'bg-white/[0.02] border-white/5 hover:border-cyan-500/30'
    }`}>
      {/* 触手连接线 */}
      <svg className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 text-cyan-500/20" viewBox="0 0 16 32">
        <motion.path
          d="M0 16 Q 8 12, 14 16 T 16 16"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: [
              "M0 16 Q 8 12, 14 16 T 16 16",
              "M0 16 Q 8 20, 14 16 T 16 16",
              "M0 16 Q 8 12, 14 16 T 16 16",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </svg>
      
      <div className="flex items-center gap-4">
        {/* 章鱼头像 */}
        <motion.div 
          className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
            isLeader 
              ? 'bg-gradient-to-br from-yellow-500 to-orange-500' 
              : 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30'
          }`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
        >
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
            <ellipse cx="16" cy="12" rx="8" ry="6" stroke="currentColor" strokeWidth="1.5" className={isLeader ? 'text-white' : 'text-cyan-400'} />
            <circle cx="13" cy="11" r="1.5" fill="currentColor" className={isLeader ? 'text-white' : 'text-cyan-400'} />
            <circle cx="19" cy="11" r="1.5" fill="currentColor" className={isLeader ? 'text-white' : 'text-cyan-400'} />
            {[0, 1, 2, 3].map((i) => (
              <path
                key={i}
                d={`M ${10 + i * 4} 17 Q ${9 + i * 4} 24, ${8 + i * 5} 28`}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className={isLeader ? 'text-white/60' : 'text-cyan-400/40'}
              />
            ))}
          </svg>
          {isLeader && (
            <div className="absolute -top-1 -right-1 text-yellow-400">
              <OctoIcons.Crown />
            </div>
          )}
        </motion.div>
        
        <div>
          <p className={`font-black text-sm flex items-center gap-2 ${isLeader ? 'text-yellow-400' : 'text-white group-hover:text-cyan-400'} transition-colors`}>
            {member.username || 'Anonymous'}
          </p>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
            {isLeader ? (t?.captain || "Captain") : (t?.crewMember || "Crew Member")}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <OctoIcons.Points />
        <span className="font-mono font-black text-cyan-400">+{member.pts?.toLocaleString() || 0}</span>
      </div>
    </div>
  </motion.div>
);

// 章鱼统计卡片
const OctoStatCard = ({ stat, index }: { stat: any; index: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay: index * 0.1, type: "spring" }}
    className="relative group"
  >
    <div className="relative bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-2xl p-5 overflow-hidden group-hover:border-cyan-500/30 transition-all">
      {/* 吸盘纹理 */}
      <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 100 100">
        <circle cx="75" cy="75" r="35" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="75" cy="75" r="25" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="75" cy="75" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      
      <p className="text-[9px] font-bold uppercase text-white/40 tracking-widest mb-2">{stat.label}</p>
      <div className="flex items-center gap-3">
        <motion.span 
          className="text-cyan-400"
          animate={{ y: [0, -2, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
        >
          {stat.icon}
        </motion.span>
        <p className="text-2xl font-black">{stat.value}</p>
      </div>
    </div>
  </motion.div>
);

// 大章鱼欢迎动画
const WelcomeOctopus = () => (
  <motion.svg
    className="w-40 h-40 text-cyan-400"
    viewBox="0 0 120 120"
    fill="none"
    animate={{ y: [0, -10, 0] }}
    transition={{ duration: 3, repeat: Infinity }}
  >
    <defs>
      <linearGradient id="teamOctoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    </defs>
    
    {/* 身体 */}
    <ellipse cx="60" cy="45" rx="35" ry="28" fill="url(#teamOctoGradient)" opacity="0.2" />
    <ellipse cx="60" cy="45" rx="35" ry="28" stroke="url(#teamOctoGradient)" strokeWidth="2" fill="none" />
    
    {/* 眼睛 */}
    <circle cx="48" cy="42" r="8" fill="white" />
    <circle cx="72" cy="42" r="8" fill="white" />
    <motion.circle 
      cx="48" cy="42" r="4" fill="#1a1a1a"
      animate={{ cx: [48, 50, 48, 46, 48] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    <motion.circle 
      cx="72" cy="42" r="4" fill="#1a1a1a"
      animate={{ cx: [72, 74, 72, 70, 72] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    <circle cx="46" cy="40" r="2" fill="white" opacity="0.8" />
    <circle cx="70" cy="40" r="2" fill="white" opacity="0.8" />
    
    {/* 微笑 */}
    <path d="M50 55 Q 60 62, 70 55" stroke="url(#teamOctoGradient)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    
    {/* 8条触手 - 欢迎姿态 */}
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <motion.path
        key={i}
        d={`M ${30 + i * 9} 68 Q ${25 + i * 9} 90, ${20 + i * 10} 110`}
        stroke="url(#teamOctoGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity={0.4 + (i % 3) * 0.15}
        animate={{
          d: [
            `M ${30 + i * 9} 68 Q ${25 + i * 9} 90, ${20 + i * 10} 110`,
            `M ${30 + i * 9} 68 Q ${35 + i * 9} 90, ${28 + i * 10} 110`,
            `M ${30 + i * 9} 68 Q ${25 + i * 9} 90, ${20 + i * 10} 110`,
          ],
        }}
        transition={{ duration: 2 + i * 0.15, repeat: Infinity }}
      />
    ))}
  </motion.svg>
);

export default function TeamPage() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const teamT = t.team || {};
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinTab, setJoinTab] = useState<'code' | 'search'>('code');
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["userProfile", authUser?.id || "guest"],
    queryFn: () => api.getUserProfile(authUser?.id),
    enabled: !!authUser?.id,
  });

  const { data: team, isLoading: isTeamLoading } = useQuery({
    queryKey: ["myTeam", authUser?.id || "guest"],
    queryFn: () => api.getMyTeam(authUser?.id),
    enabled: !!authUser?.id,
  });

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["searchTeams", searchQuery],
    queryFn: () => api.searchTeams(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  const createTeamMutation = useMutation({
    mutationFn: () => api.createTeam({ userId: authUser?.id, name: teamName, description: teamDescription, isPublic }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTeam"] });
      setShowCreateModal(false);
      setTeamName('');
      setTeamDescription('');
    },
  });

  const joinByCodeMutation = useMutation({
    mutationFn: () => api.joinTeamByCode({ userId: authUser?.id, inviteCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTeam"] });
      setShowJoinModal(false);
      setInviteCode('');
    },
  });

  const joinPublicTeamMutation = useMutation({
    mutationFn: (teamId: string) => api.joinPublicTeam({ userId: authUser?.id, teamId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTeam"] });
      setShowJoinModal(false);
    },
  });

  const leaveTeamMutation = useMutation({
    mutationFn: () => api.leaveTeam({ userId: authUser?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTeam"] });
    },
  });

  const refreshCodeMutation = useMutation({
    mutationFn: () => api.refreshInviteCode(authUser?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTeam"] });
    }
  });

  const isLoading = isProfileLoading || isTeamLoading;

  // Loading
  if (isLoading && !team && !userProfile) return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-4">
      <motion.svg 
        className="w-20 h-20 text-cyan-400"
        viewBox="0 0 80 80"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <ellipse cx="40" cy="35" rx="20" ry="15" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.path
            key={i}
            d={`M ${20 + i * 10} 48 Q ${18 + i * 10} 60, ${15 + i * 12} 72`}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity={0.3 + i * 0.1}
          />
        ))}
      </motion.svg>
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/20 animate-pulse">
        {t.common?.loading || "Loading..."}
      </p>
    </div>
  );

  // 已有团队
  if (team) {
    const isLeader = team.leaderId === authUser?.id;
    
    return (
      <div className="relative min-h-screen bg-transparent text-white overflow-hidden">
        {/* 章鱼主题背景 */}
        <div className="absolute inset-0 pointer-events-none">
          <SparklesCore
            background="transparent"
            minSize={0.3}
            maxSize={0.8}
            particleDensity={20}
            particleColor="#06b6d4"
            className="opacity-40"
          />
          <InkParticles count={25} />
        </div>
        <TentacleWaves />
        
        <FloatingOctopus className="absolute top-20 right-10 opacity-20 hidden xl:block" size="lg" color="cyan" />
        <FloatingOctopus className="absolute bottom-40 left-10 opacity-15 hidden lg:block" size="md" color="purple" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 lg:py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10"
          >
            <div className="flex items-center gap-5">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-cyan-400"
              >
                <OctoTeam className="w-14 h-14" />
              </motion.div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 mb-2 block">{teamT.octopusCrew || "Octopus Crew"}</span>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight flex items-center gap-3">
                  {team.name}
                  {isLeader && <span className="text-yellow-400"><OctoIcons.Crown /></span>}
                </h1>
              </div>
            </div>
            
            <div className="text-right bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl px-6 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">{teamT.squadRank || "Squad Rank"}</p>
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">#{team.rank || 'N/A'}</p>
            </div>
          </motion.div>

          {/* Invite Code */}
          {team.inviteCode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 p-5 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-purple-400"
                >
                  <OctoIcons.Key />
                </motion.div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">{teamT.secretTentacleCode || "Secret Tentacle Code"}</p>
                  <p className="text-xl font-mono font-black tracking-widest">{team.inviteCode}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigator.clipboard.writeText(team.inviteCode)}
                  className="p-3 bg-white/5 hover:bg-cyan-500/20 rounded-xl transition-colors text-cyan-400"
                >
                  <OctoIcons.Copy />
                </motion.button>
                {isLeader && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => refreshCodeMutation.mutate()}
                    disabled={refreshCodeMutation.isPending}
                    className="p-3 bg-white/5 hover:bg-purple-500/20 rounded-xl transition-colors text-purple-400"
                  >
                    <OctoIcons.Refresh />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: teamT.stats?.totalPoints || "Total Points", value: team.totalPts?.toLocaleString() || '0', icon: <OctoIcons.Points /> },
              { label: teamT.crewSize || "Crew Size", value: `${team.members?.length || 0}/${team.maxMembers || 20}`, icon: <OctoIcons.Users /> },
              { label: teamT.status || "Status", value: team.isPublic ? (teamT.openWaters || "Open Waters") : (teamT.secretLair || "Secret Lair"), icon: <OctoIcons.Trophy /> },
              { label: teamT.stats?.activity || "Activity", value: teamT.active || "Active", icon: <OctoIcons.Fire /> },
            ].map((stat, i) => (
              <OctoStatCard key={stat.label} stat={stat} index={i} />
            ))}
          </div>

          {/* Members */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 lg:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-cyan-400"
              >
                <OctoIcons.Users />
              </motion.div>
              <h2 className="text-xl font-black uppercase tracking-tight">
                {teamT.crewMembers || "Crew Members"}
              </h2>
            </div>
            
            <div className="space-y-3">
              {team.members?.map((member: any, i: number) => (
                <OctoMemberCard 
                  key={member.id}
                  member={member}
                  isLeader={member.id === team.leaderId}
                  teamLeaderId={team.leaderId}
                  index={i}
                  t={teamT}
                />
              ))}
            </div>
          </motion.div>

          {/* Leave Button */}
          <div className="mt-8 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (confirm(isLeader && team.members?.length > 1 
                  ? (teamT.leaderConfirm || 'You are the captain. Transfer leadership first.') 
                  : (teamT.leaveConfirm || 'Leave this crew?'))) {
                  leaveTeamMutation.mutate();
                }
              }}
              disabled={leaveTeamMutation.isPending}
              className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <OctoIcons.Logout /> {leaveTeamMutation.isPending ? (teamT.leaving || "Leaving...") : (teamT.abandonShip || "Abandon Ship")}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // 未加入团队
  return (
    <div className="min-h-screen bg-transparent text-white relative overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <SparklesCore
          background="transparent"
          minSize={0.3}
          maxSize={0.8}
          particleDensity={15}
          particleColor="#06b6d4"
          className="opacity-30"
        />
        <InkParticles count={20} />
      </div>
      <TentacleWaves />
      
      <FloatingOctopus className="absolute top-20 left-10 opacity-20 hidden lg:block" size="md" color="cyan" />
      <FloatingOctopus className="absolute bottom-20 right-10 opacity-15 hidden lg:block" size="sm" color="purple" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 lg:py-12 flex flex-col min-h-screen">
        {/* Points Display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 flex items-center gap-3"
        >
          <OctoIcons.Points />
          <span className="text-sm font-black text-cyan-400">{userProfile?.pts?.toLocaleString() || '0'} PTS</span>
        </motion.div>

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 border border-white/10 rounded-[48px] p-8 lg:p-12"
        >
          <WelcomeOctopus />
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-center mb-4"
          >
            {teamT.joinTheCrew || "Join the Crew"}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-white/40 text-center max-w-md mb-10"
          >
            {teamT.joinCrewDesc || "Team up with fellow octopi to conquer the prediction seas together!"}
          </motion.p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              disabled={!authUser}
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl px-8 py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <OctoIcons.Plus /> {teamT.createCrew || "Create Crew"}
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowJoinModal(true)}
              disabled={!authUser}
              className="w-full sm:w-auto bg-white/5 text-white border border-white/20 rounded-xl px-8 py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-cyan-500/50 transition-colors disabled:opacity-50"
            >
              <OctoIcons.Users /> {teamT.joinCrew || "Join Crew"}
            </motion.button>
          </div>

          {!authUser && (
            <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-red-400">
              {teamT.loginToJoin || "Login to join the underwater adventure!"}
            </p>
          )}
        </motion.div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0a0a0a] border border-cyan-500/20 rounded-3xl p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                  <OctoIcons.Plus /> {teamT.createCrew || "Create Crew"}
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="text-white/40 hover:text-white">
                  <OctoIcons.X />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">{teamT.crewNameLabel || "Crew Name"}</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder={teamT.crewNamePlaceholder || "The Mighty Octopi"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">{teamT.description || "Description"}</label>
                  <textarea
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder={teamT.descPlaceholder || "We rule the seas..."}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-cyan-500 transition-colors resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-sm font-black">{teamT.openWaters || "Open Waters"}</p>
                    <p className="text-[10px] text-white/40">{teamT.anyoneCanJoin || "Anyone can join"}</p>
                  </div>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-cyan-500' : 'bg-white/10'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => createTeamMutation.mutate()}
                  disabled={!teamName.trim() || createTeamMutation.isPending}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl py-4 text-sm font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {createTeamMutation.isPending ? (teamT.creating || "Creating...") : (teamT.launchCrew || "Launch Crew")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0a0a0a] border border-cyan-500/20 rounded-3xl p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                  <OctoIcons.Users /> {teamT.joinCrew || "Join Crew"}
                </h2>
                <button onClick={() => setShowJoinModal(false)} className="text-white/40 hover:text-white">
                  <OctoIcons.X />
                </button>
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setJoinTab('code')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
                    joinTab === 'code' ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  <OctoIcons.Key /> {teamT.secretCode || "Secret Code"}
                </button>
                <button
                  onClick={() => setJoinTab('search')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
                    joinTab === 'search' ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  <OctoIcons.Search /> {teamT.search || "Search"}
                </button>
              </div>

              {joinTab === 'code' ? (
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">{teamT.enterTentacleCode || "Enter Tentacle Code"}</label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="XXXXXXXX"
                      maxLength={8}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-xl font-mono font-black tracking-[0.5em] outline-none focus:border-cyan-500 transition-colors uppercase"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => joinByCodeMutation.mutate()}
                    disabled={inviteCode.length !== 8 || joinByCodeMutation.isPending}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl py-4 text-sm font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    {joinByCodeMutation.isPending ? (teamT.joining || "Joining...") : (teamT.diveIn || "Dive In")}
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={teamT.searchSeas || "Search the seas..."}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:border-cyan-500 transition-colors"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                      <OctoIcons.Search />
                    </span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {isSearching && <p className="text-center text-white/40 py-8 text-sm">{teamT.searching || "Searching..."}</p>}
                    {!isSearching && searchQuery.length >= 2 && searchResults?.length === 0 && (
                      <p className="text-center text-white/40 py-8 text-sm">{teamT.noTeamsFound || "No crews found"}</p>
                    )}
                    {searchResults?.map((result: any) => (
                      <div key={result.id} className="p-4 bg-white/5 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-black text-sm">{result.name}</p>
                          <p className="text-[10px] text-white/40">{result._count?.members || 0}/{result.maxMembers} • {result.totalPts?.toLocaleString()} PTS</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => joinPublicTeamMutation.mutate(result.id)}
                          disabled={joinPublicTeamMutation.isPending}
                          className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/30 transition-colors"
                        >
                          {teamT.join || "Join"}
                        </motion.button>
                      </div>
                    ))}
                    {searchQuery.length < 2 && (
                      <p className="text-center text-white/40 py-8 text-sm">{teamT.minChars || "Type at least 2 characters"}</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
