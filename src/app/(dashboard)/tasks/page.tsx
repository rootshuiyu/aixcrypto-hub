"use client";

import { useLanguageStore } from "../../../stores/language-store";
import { translations } from "../../../lib/translations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { useAuth } from "../../../hooks/use-auth";
import { useUIStore } from "../../../stores/ui-store";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react"; // 🆕 引入 useEffect
import { FloatingOctopus, InkParticles, TentacleWaves } from "@/components/ui/octopus-decorations";
import { SparklesCore } from "@/components/aceternity/sparkles";
import { OctoTasks } from "@/components/icons/octopus-icons";
import { useSocket } from "@/components/providers/socket-provider"; // 🆕 引入 Socket

// 章鱼主题图标组件
const OctoIcons = {
  // 章鱼眼睛 - 任务目标
  Target: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="12" rx="8" ry="6" opacity="0.3" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      {/* 触手装饰 */}
      <path d="M4 14c-1 2-1 4 0 5" strokeLinecap="round" opacity="0.4" />
      <path d="M20 14c1 2 1 4 0 5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  // 章鱼勾选
  Check: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="10" rx="7" ry="5" opacity="0.2" />
      <path d="M8 10l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      {/* 触手 */}
      <path d="M7 14c-1 2-1 4 0 5" strokeLinecap="round" opacity="0.4" />
      <path d="M12 15c0 2 0 4 0 5" strokeLinecap="round" opacity="0.4" />
      <path d="M17 14c1 2 1 4 0 5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  // 章鱼宝石 - 积分
  Points: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6l3-6z" opacity="0.3" />
      <circle cx="12" cy="10" r="3" />
      {/* 小触手从宝石伸出 */}
      <path d="M8 16c-1 2 0 4 1 5" strokeLinecap="round" opacity="0.4" />
      <path d="M16 16c1 2 0 4-1 5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  // 章鱼闪耀
  Sparkles: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="10" rx="6" ry="5" />
      <circle cx="10" cy="9" r="1" fill="currentColor" />
      <circle cx="14" cy="9" r="1" fill="currentColor" />
      {/* 触手像光芒 */}
      <path d="M6 14c-2 1-3 3-2 5" strokeLinecap="round" />
      <path d="M9 15c-1 2-1 4 0 5" strokeLinecap="round" opacity="0.7" />
      <path d="M12 15c0 2 0 4 0 5" strokeLinecap="round" opacity="0.5" />
      <path d="M15 15c1 2 1 4 0 5" strokeLinecap="round" opacity="0.7" />
      <path d="M18 14c2 1 3 3 2 5" strokeLinecap="round" />
    </svg>
  ),
  // 章鱼机器人
  Robot: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="6" y="6" width="12" height="10" rx="3" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      <path d="M12 6V3" />
      <circle cx="12" cy="2" r="1" fill="currentColor" opacity="0.5" />
      {/* 机械触手 */}
      <path d="M6 14c-2 1-3 3-2 5" strokeLinecap="round" opacity="0.5" />
      <path d="M18 14c2 1 3 3 2 5" strokeLinecap="round" opacity="0.5" />
      <path d="M9 16c0 2-1 3 0 5" strokeLinecap="round" opacity="0.3" />
      <path d="M15 16c0 2 1 3 0 5" strokeLinecap="round" opacity="0.3" />
    </svg>
  ),
  // 章鱼钱包
  Wallet: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" opacity="0.3" />
      <circle cx="16" cy="13" r="1.5" fill="currentColor" />
      {/* 触手守护 */}
      <path d="M1 10c0 3 1 5 2 7" strokeLinecap="round" opacity="0.4" />
      <path d="M23 10c0 3-1 5-2 7" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  // 章鱼社群
  Users: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      {/* 三只小章鱼 */}
      <ellipse cx="12" cy="8" rx="4" ry="3" />
      <circle cx="11" cy="7.5" r="0.8" fill="currentColor" />
      <circle cx="13" cy="7.5" r="0.8" fill="currentColor" />
      <ellipse cx="6" cy="10" rx="3" ry="2" opacity="0.5" />
      <ellipse cx="18" cy="10" rx="3" ry="2" opacity="0.5" />
      {/* 触手连接 */}
      <path d="M9 11c-1 2-1 4 0 5" strokeLinecap="round" opacity="0.4" />
      <path d="M12 11c0 2 0 4 0 5" strokeLinecap="round" opacity="0.4" />
      <path d="M15 11c1 2 1 4 0 5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  // 章鱼推荐
  Referral: () => (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="8" cy="8" rx="5" ry="4" />
      <circle cx="6.5" cy="7" r="1" fill="currentColor" />
      <circle cx="9.5" cy="7" r="1" fill="currentColor" />
      {/* 触手指向 */}
      <path d="M13 8h4" strokeLinecap="round" />
      <path d="M15 6l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
      {/* 小章鱼被推荐 */}
      <ellipse cx="19" cy="8" rx="3" ry="2.5" opacity="0.5" />
      {/* 下方触手 */}
      <path d="M5 11c-1 2 0 4 1 5" strokeLinecap="round" opacity="0.4" />
      <path d="M8 12c0 2 0 4 0 5" strokeLinecap="round" opacity="0.4" />
      <path d="M11 11c1 2 0 4-1 5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
};

// 章鱼触手进度条组件
const TentacleProgressBar = ({ progress, goal, status }: { progress: number; goal: number; status: string }) => {
  const percentage = Math.min((progress / goal) * 100, 100);
  const tentacleCount = 5;
  
  return (
    <div className="relative h-8">
      {/* 背景触手轨道 */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 30" preserveAspectRatio="none">
        <defs>
          <linearGradient id="tentacleTrack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {Array.from({ length: tentacleCount }).map((_, i) => (
          <path
            key={i}
            d={`M 0 ${10 + i * 4} Q 50 ${5 + i * 4}, 100 ${10 + i * 4} T 200 ${10 + i * 4}`}
            stroke="url(#tentacleTrack)"
            strokeWidth="2"
            fill="none"
            opacity={0.3 + i * 0.1}
          />
        ))}
      </svg>
      
      {/* 进度触手 */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 30" preserveAspectRatio="none">
        <defs>
          <linearGradient id="tentacleProgress" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={status === 'CLAIMED' ? "#22c55e" : "#06b6d4"} />
            <stop offset="100%" stopColor={status === 'CLAIMED' ? "#16a34a" : "#a855f7"} />
          </linearGradient>
        </defs>
        {Array.from({ length: tentacleCount }).map((_, i) => (
          <motion.path
            key={i}
            d={`M 0 ${10 + i * 4} Q 50 ${5 + i * 4}, 100 ${10 + i * 4} T 200 ${10 + i * 4}`}
            stroke="url(#tentacleProgress)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: percentage / 100 }}
            transition={{ duration: 1, delay: i * 0.1 }}
            opacity={0.5 + i * 0.1}
          />
        ))}
      </svg>
      
      {/* 章鱼头标记当前进度 */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ left: `${percentage}%` }}
        initial={{ scale: 0 }}
        animate={{ scale: 1, x: -12 }}
        transition={{ delay: 0.5 }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="12" rx="8" ry="6" fill={status === 'CLAIMED' ? "#22c55e" : "#a855f7"} opacity="0.8" />
          <circle cx="9" cy="11" r="2" fill="white" />
          <circle cx="15" cy="11" r="2" fill="white" />
          <circle cx="9" cy="11" r="1" fill="#1a1a1a" />
          <circle cx="15" cy="11" r="1" fill="#1a1a1a" />
        </svg>
      </motion.div>
    </div>
  );
};

// 章鱼吸盘统计卡片
const OctoStatCard = ({ stat, index }: { stat: any; index: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
    animate={{ opacity: 1, scale: 1, rotate: 0 }}
    transition={{ delay: index * 0.1, type: "spring" }}
    className="relative group"
  >
    {/* 吸盘外环 */}
    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-4 overflow-hidden group-hover:border-cyan-500/30 transition-all">
      {/* 吸盘纹理 */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      
      {/* 章鱼图标 */}
      <motion.div 
        className={`mb-3 ${stat.highlight ? 'text-purple-400' : 'text-cyan-400'}`}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
      >
        {stat.icon}
      </motion.div>
      
      <p className="text-[9px] font-bold uppercase text-white/40 tracking-widest mb-1">{stat.label}</p>
      <p className={`text-2xl font-black ${stat.highlight ? 'text-purple-400' : 'text-white'}`}>
        {stat.value}
      </p>
      
      {/* 触手装饰 */}
      <svg className="absolute bottom-0 right-0 w-12 h-12 text-white/5" viewBox="0 0 50 50">
        <path d="M50 50 Q 40 30, 30 40 T 10 50" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M50 40 Q 35 25, 25 35 T 5 40" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  </motion.div>
);

// 智能翻译查找：根据任务ID、类型或关键词匹配
const getTaskTranslation = (task: any, t: any) => {
  const items = t.tasks?.items || {};
  
  // 1. 先按精确 ID 匹配
  if (items[task.id]) return items[task.id];
  
  // 2. 按精确 type 匹配
  if (items[task.type]) return items[task.type];
  
  // 3. 智能关键词匹配 - 检查 type 中是否包含关键词
  const typeUpper = (task.type || '').toUpperCase();
  const isDaily = task.isDaily || typeUpper.includes('DAILY');
  
  if (typeUpper.includes('BATTLE')) {
    return isDaily ? items['DAILY_BATTLE'] : items['BATTLE'];
  }
  if (typeUpper.includes('PREDICTION')) {
    return isDaily ? items['DAILY_PREDICTION'] : items['PREDICTION'];
  }
  if (typeUpper.includes('DEPOSIT')) {
    return isDaily ? items['DAILY_DEPOSIT'] : items['DEPOSIT'];
  }
  if (typeUpper.includes('LOGIN') || typeUpper.includes('CHECKIN') || typeUpper.includes('CHECK_IN')) {
    return items['DAILY_LOGIN'] || items['LOGIN'];
  }
  if (typeUpper.includes('INVITE') || typeUpper.includes('REFERRAL')) {
    return items['INVITE'];
  }
  if (typeUpper.includes('TEAM')) {
    return items['TEAM'];
  }
  
  return null;
};

// 章鱼任务卡片
const OctoTaskCard = ({ task, index, t, onClaim, isPending }: any) => {
  const translation = getTaskTranslation(task, t);
  
  const taskIcons: Record<string, JSX.Element> = {
    't1': <OctoIcons.Target />,
    't2': <OctoIcons.Robot />,
    't3': <OctoIcons.Wallet />,
    't4': <OctoIcons.Users />,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`relative group rounded-2xl overflow-hidden ${
        task.status === 'CLAIMED' 
          ? 'opacity-60' 
          : task.status === 'COMPLETED'
            ? 'ring-2 ring-purple-500/50'
            : ''
      }`}
    >
      {/* 章鱼头部背景 */}
      <div className="absolute top-0 left-0 right-0 h-24 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`cardGradient-${task.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={task.status === 'COMPLETED' ? "#a855f7" : "#06b6d4"} stopOpacity="0.15" />
              <stop offset="100%" stopColor={task.status === 'COMPLETED' ? "#ec4899" : "#a855f7"} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="-20" rx="120" ry="80" fill={`url(#cardGradient-${task.id})`} />
        </svg>
      </div>
      
      {/* 卡片主体 */}
      <div className={`relative bg-gradient-to-b from-transparent via-[#0a0a0a] to-[#0a0a0a] border p-5 ${
        task.status === 'CLAIMED' 
          ? 'border-green-500/20' 
          : task.status === 'COMPLETED'
            ? 'border-purple-500/30'
            : 'border-white/5 group-hover:border-cyan-500/30'
      } transition-all`}>
        
        {/* 顶部：图标 + 状态 */}
        <div className="flex justify-between items-start mb-5">
          <motion.div 
            className={`p-3 rounded-xl bg-black/50 border ${
              task.status === 'COMPLETED' ? 'border-purple-500/30 text-purple-400' : 'border-cyan-500/20 text-cyan-400'
            }`}
            animate={{ 
              y: [0, -5, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            {taskIcons[task.id] || <OctoIcons.Target />}
          </motion.div>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
            task.status === 'CLAIMED' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : task.status === 'COMPLETED'
                ? 'bg-purple-500 text-white animate-pulse shadow-lg shadow-purple-500/30'
                : 'bg-white/5 text-white/40 border border-white/10'
          }`}>
            {task.status === 'COMPLETED' && (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                ✨
              </motion.span>
            )}
            {task.status === 'CLAIMED' ? (t.tasks?.rewarded || 'REWARDED') : task.status === 'COMPLETED' ? (t.tasks?.completed || 'COMPLETED') : (t.tasks?.inProgress || 'IN PROGRESS')}
          </div>
        </div>
        
        {/* 任务内容 - 使用智能翻译查找 */}
        <div className="mb-5">
          <h3 className="text-lg font-black text-white mb-2 group-hover:text-cyan-400 transition-colors">
            {translation?.title || task.title || task.id}
          </h3>
          <p className="text-xs text-white/40 leading-relaxed">
            {translation?.desc || task.description || ''}
          </p>
        </div>
        
        {/* 章鱼触手进度条 */}
        <div className="mb-5">
          <div className="flex justify-between text-[10px] font-bold uppercase text-white/30 mb-2">
            <span>{t.tasks?.progress || 'Progress'}</span>
            <span className="text-white/60">{task.progress} / {task.goal}</span>
          </div>
          <TentacleProgressBar progress={task.progress} goal={task.goal} status={task.status} />
        </div>
        
        {/* 底部：奖励 + 按钮 */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <motion.div 
              className="text-purple-400"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <OctoIcons.Points />
            </motion.div>
            <div>
              <p className="text-[9px] uppercase text-white/30 font-bold">{t.tasks?.reward || 'Reward'}</p>
              <p className="text-lg font-black text-purple-400">+{task.reward} <span className="text-xs text-white/40">PTS</span></p>
            </div>
          </div>
          
          <motion.button 
            onClick={() => onClaim(task.id)}
            disabled={task.status !== 'COMPLETED' || isPending}
            whileHover={{ scale: task.status === 'COMPLETED' ? 1.05 : 1 }}
            whileTap={{ scale: task.status === 'COMPLETED' ? 0.95 : 1 }}
            className={`relative px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              task.status === 'COMPLETED' 
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-purple-500/20' 
                : task.status === 'CLAIMED'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
            }`}
          >
            {task.status === 'CLAIMED' ? `✓ ${t.tasks?.claimed || 'CLAIMED'}` : isPending ? (t.tasks?.claiming || 'CLAIMING...') : task.status === 'COMPLETED' ? (t.tasks?.claimNow || 'CLAIM NOW') : (t.tasks?.inProgress || 'IN PROGRESS')}
          </motion.button>
        </div>
        
        {/* 底部触手装饰 */}
        <svg className="absolute bottom-0 left-0 w-full h-8 text-white/[0.03]" viewBox="0 0 200 30" preserveAspectRatio="none">
          <path d="M0 30 Q 25 10, 50 25 T 100 20 T 150 25 T 200 30" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M0 25 Q 30 15, 60 22 T 120 18 T 180 25 T 200 25" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </motion.div>
  );
};

export default function TasksPage() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { showNotification } = useUIStore();
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'CLAIMED'>('ALL');
  const { socket } = useSocket(); // 🆕 修正：通过解构获取真正的 socket 实例

  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ["tasks", authUser?.id || "guest"],
    queryFn: () => api.getTasks(authUser?.id),
    enabled: !!authUser?.id,
  });

  // 🆕 实时联动：监听管理后台的任务变更
  useEffect(() => {
    if (!socket) return;

    const handleQuestUpdate = (data: any) => {
      console.log("📢 Quest System Update Received:", data);
      refetch(); // 强制重新从数据库拉取
      showNotification('Mission board updated!', 'INFO');
    };

    // 监听全服广播
    socket.on('QUEST_UPDATE', handleQuestUpdate);
    socket.on('systemBroadcast', (data: any) => {
      if (data.type === 'QUEST_UPDATE') refetch();
    });

    return () => {
      socket.off('QUEST_UPDATE', handleQuestUpdate);
    };
  }, [socket, refetch, showNotification]);

  const claimMutation = useMutation({
    mutationFn: (taskId: string) => api.claimReward(taskId, authUser?.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["userProfile", authUser?.id] });
      showNotification(t.tasks?.rewardClaimed || '奖励已领取!', 'SUCCESS');
    },
    onError: (error: any) => {
      showNotification(error.message || '领取失败', 'ERROR');
    },
  });

  const filteredTasks = tasks?.filter((task: any) => filter === 'ALL' || task.status === filter);

  const stats = [
    { label: t.tasks?.total || 'Total', value: tasks?.length || 0, icon: <OctoIcons.Target />, color: 'cyan' },
    { label: t.tasks?.done || 'Done', value: tasks?.filter((tk: any) => ['COMPLETED', 'CLAIMED'].includes(tk.status)).length || 0, icon: <OctoIcons.Check />, color: 'green' },
    { label: t.tasks?.claimed || 'Claimed', value: tasks?.filter((tk: any) => tk.status === 'CLAIMED').length || 0, icon: <OctoIcons.Points />, color: 'blue' },
    { label: 'PTS', value: tasks?.filter((tk: any) => tk.status === 'CLAIMED').reduce((a: number, tk: any) => a + tk.reward, 0) || 0, icon: <OctoIcons.Sparkles />, highlight: true },
  ];

  const filterButtons = [
    { key: 'ALL', label: t.tasks?.all || 'All', tentacles: 8 },
    { key: 'IN_PROGRESS', label: t.tasks?.active || 'Active', tentacles: 4 },
    { key: 'COMPLETED', label: t.tasks?.ready || 'Ready', tentacles: 6 },
    { key: 'CLAIMED', label: t.tasks?.done || 'Done', tentacles: 2 },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white overflow-hidden relative">
      {/* 章鱼主题背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <SparklesCore
          background="transparent"
          minSize={0.3}
          maxSize={0.8}
          particleDensity={20}
          particleColor="#a855f7"
          className="opacity-50"
        />
        <InkParticles count={30} />
        
        {/* 大型光晕 */}
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-purple-900/20 blur-[200px] rounded-full" />
        <div className="absolute top-[30%] -right-[15%] w-[50%] h-[50%] bg-cyan-900/20 blur-[180px] rounded-full" />
      </div>
      
      {/* 触手波浪 */}
      <TentacleWaves />
      
      {/* 浮动章鱼 */}
      <FloatingOctopus className="absolute top-20 right-10 opacity-25 hidden xl:block" size="lg" color="purple" />
      <FloatingOctopus className="absolute top-1/2 left-5 opacity-20 hidden lg:block" size="md" color="cyan" />
      <FloatingOctopus className="absolute bottom-40 right-20 opacity-15 hidden xl:block" size="sm" color="pink" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 lg:py-12">
        {/* Header with Giant Octopus */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-12"
        >
          {/* 大章鱼标题装饰 */}
          <div className="flex items-start gap-6">
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="hidden sm:block"
            >
              <svg className="w-20 h-20 text-cyan-400" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5">
                <ellipse cx="40" cy="30" rx="25" ry="20" className="fill-cyan-500/10" />
                <ellipse cx="40" cy="30" rx="25" ry="20" />
                <circle cx="32" cy="27" r="5" fill="currentColor" className="text-cyan-300" />
                <circle cx="48" cy="27" r="5" fill="currentColor" className="text-cyan-300" />
                <circle cx="31" cy="26" r="2" fill="white" />
                <circle cx="47" cy="26" r="2" fill="white" />
                {/* 8条触手 */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <motion.path
                    key={i}
                    d={`M ${20 + i * 7.5} 48 Q ${18 + i * 7.5} 60, ${15 + i * 8} 75`}
                    strokeLinecap="round"
                    opacity={0.4 + (i % 3) * 0.2}
                    animate={{
                      d: [
                        `M ${20 + i * 7.5} 48 Q ${18 + i * 7.5} 60, ${15 + i * 8} 75`,
                        `M ${20 + i * 7.5} 48 Q ${22 + i * 7.5} 60, ${18 + i * 8} 75`,
                        `M ${20 + i * 7.5} 48 Q ${18 + i * 7.5} 60, ${15 + i * 8} 75`,
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </svg>
            </motion.div>
            
            <div>
              <div className="flex items-center gap-3 mb-3">
                <motion.span 
                  className="text-cyan-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <OctoTasks className="w-6 h-6" />
                </motion.span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">{t.tasks?.missionHub || 'Octopus Mission Hub'}</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight">
                {t.tasks?.taskCenter || 'Task'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">Center</span>
              </h1>
              <p className="mt-4 text-sm text-white/40 max-w-lg">
                {t.tasks?.pageDesc || 'Complete missions with our octopus friends. Each tentacle represents progress - grab those rewards!'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid - 章鱼吸盘风格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => (
            <OctoStatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>

        {/* 推荐区域 - 章鱼主题 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 border border-white/10 p-6 lg:p-8 mb-10"
        >
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="text-purple-400"
            >
              <OctoIcons.Referral />
            </motion.div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-black text-white mb-2">{t.tasks?.recruitTitle || 'Recruit Fellow Octopi!'}</h2>
              <p className="text-sm text-white/40">{t.tasks?.recruitDesc || 'Share your link and earn bonus PTS for each new member'}</p>
            </div>
            
            <div className="flex items-center gap-2 bg-black/50 px-4 py-3 rounded-xl border border-white/10">
              <code className="text-xs text-purple-400 font-mono">
                {authUser?.referralCode ? `...?ref=${authUser.referralCode}` : (t.tasks?.loading || 'Loading...')}
              </code>
              <button 
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/tasks?ref=${authUser?.referralCode}`)}
                className="p-2 bg-purple-500/20 hover:bg-purple-500 rounded-lg transition-all"
              >
                <OctoIcons.Check />
              </button>
            </div>
          </div>
        </motion.div>

        {/* 章鱼触手过滤器 */}
        <div className="flex flex-wrap gap-3 mb-8">
          {filterButtons.map((btn) => (
            <motion.button
              key={btn.key}
              onClick={() => setFilter(btn.key as any)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all overflow-hidden ${
                filter === btn.key 
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg' 
                  : 'bg-white/5 text-white/50 border border-white/10 hover:border-cyan-500/30'
              }`}
            >
              {/* 触手数量指示器 */}
              <span className="flex items-center gap-2">
                {btn.label}
                <span className="flex gap-0.5">
                  {Array.from({ length: Math.min(btn.tentacles, 4) }).map((_, i) => (
                    <span key={i} className={`w-1 h-1 rounded-full ${filter === btn.key ? 'bg-white' : 'bg-white/30'}`} />
                  ))}
                </span>
              </span>
            </motion.button>
          ))}
        </div>

        {/* Tasks Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              [1,2,3,4,5,6].map(i => (
                <motion.div 
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-72 rounded-2xl bg-white/5 animate-pulse" 
                />
              ))
            ) : (
              filteredTasks?.map((task: any, i: number) => (
                <OctoTaskCard 
                  key={task.id}
                  task={task}
                  index={i}
                  t={t}
                  onClaim={(id: string) => claimMutation.mutate(id)}
                  isPending={claimMutation.isPending}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Empty State - 悲伤的章鱼 */}
        {!isLoading && filteredTasks?.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.svg 
              className="w-32 h-32 text-white/20 mb-6"
              viewBox="0 0 100 100"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <ellipse cx="50" cy="40" rx="30" ry="25" fill="currentColor" opacity="0.3" />
              <ellipse cx="50" cy="40" rx="30" ry="25" stroke="currentColor" strokeWidth="2" fill="none" />
              {/* 悲伤的眼睛 */}
              <circle cx="40" cy="38" r="5" fill="currentColor" />
              <circle cx="60" cy="38" r="5" fill="currentColor" />
              <path d="M42 50 Q 50 45, 58 50" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* 垂下的触手 */}
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.path
                  key={i}
                  d={`M ${30 + i * 10} 62 Q ${28 + i * 10} 80, ${25 + i * 12} 95`}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.3}
                  animate={{
                    d: [
                      `M ${30 + i * 10} 62 Q ${28 + i * 10} 80, ${25 + i * 12} 95`,
                      `M ${30 + i * 10} 62 Q ${32 + i * 10} 80, ${28 + i * 12} 95`,
                      `M ${30 + i * 10} 62 Q ${28 + i * 10} 80, ${25 + i * 12} 95`,
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.svg>
            <h3 className="text-xl font-black text-white/60 mb-2">{t.tasks?.noMissions || 'No missions here...'}</h3>
            <p className="text-sm text-white/30 mb-6">{t.tasks?.lookingForTasks || 'Our octopus friend is looking for tasks'}</p>
            <button 
              onClick={() => setFilter('ALL')} 
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-sm font-bold text-white"
            >
              {t.tasks?.showAll || 'Show All Tasks'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
