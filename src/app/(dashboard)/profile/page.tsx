"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { WalletButton } from "@/components/web3/wallet-button";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useLanguageStore } from "@/stores/language-store";
import { translations } from "@/lib/translations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ReferralPanel } from "@/components/referral/referral-panel";
import { FloatingOctopus, InkParticles, TentacleWaves } from "@/components/ui/octopus-decorations";
import { SparklesCore } from "@/components/aceternity/sparkles";
import { OctoProfile, OctoWallet } from "@/components/icons/octopus-icons";
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";

// Vault 合约 ABI
const VAULT_ABI = [
  {
    name: "depositETH",
    type: "function",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    name: "withdrawETH",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
] as const;

// 章鱼主题图标组件
const OctoIcons = {
  // 编辑图标
  Edit: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  // 关闭图标
  X: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  // 保存图标
  Save: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  // 章鱼用户头像
  User: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="9" rx="6" ry="5" />
      <circle cx="10" cy="8" r="1" fill="currentColor" />
      <circle cx="14" cy="8" r="1" fill="currentColor" />
      <path d="M7 13c-1 2-1 4 0 5" strokeLinecap="round" opacity="0.5" />
      <path d="M10 14c0 2 0 4 0 5" strokeLinecap="round" opacity="0.4" />
      <path d="M14 14c0 2 0 4 0 5" strokeLinecap="round" opacity="0.4" />
      <path d="M17 13c1 2 1 4 0 5" strokeLinecap="round" opacity="0.5" />
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
  // 章鱼确认
  Check: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="10" rx="7" ry="5" opacity="0.2" />
      <path d="M8 10l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // 章鱼积分
  Points: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="10" rx="6" ry="5" />
      <circle cx="10" cy="9" r="1.5" fill="currentColor" />
      <circle cx="14" cy="9" r="1.5" fill="currentColor" />
      {/* 触手像光芒 */}
      <path d="M6 14c-2 1-3 3-2 5" strokeLinecap="round" />
      <path d="M9 15c-1 2-1 4 0 5" strokeLinecap="round" opacity="0.7" />
      <path d="M12 15c0 2 0 4 0 5" strokeLinecap="round" opacity="0.5" />
      <path d="M15 15c1 2 1 4 0 5" strokeLinecap="round" opacity="0.7" />
      <path d="M18 14c2 1 3 3 2 5" strokeLinecap="round" />
    </svg>
  ),
  // 章鱼位置
  Position: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="10" r="6" opacity="0.2" />
      <ellipse cx="12" cy="10" rx="4" ry="3" />
      <circle cx="12" cy="10" r="1.5" fill="currentColor" />
      <path d="M8 15c-1 2 0 4 1 5" strokeLinecap="round" opacity="0.4" />
      <path d="M16 15c1 2 0 4-1 5" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  // 章鱼胜率
  WinRate: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l2 5h5l-4 3 2 6-5-4-5 4 2-6-4-3h5l2-5z" />
      <ellipse cx="12" cy="18" rx="4" ry="2" opacity="0.3" />
      <path d="M8 18c0 2 0 4 1 4" strokeLinecap="round" opacity="0.4" />
      <path d="M16 18c0 2 0 4-1 4" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  // 章鱼ROI
  ROI: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 18l4-4 4 4 8-10" />
      <path d="M16 4h4v4" />
      <ellipse cx="4" cy="20" rx="2" ry="1.5" opacity="0.3" />
      <path d="M3 20c-1 1 0 2 1 2" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  // 章鱼钱包
  Wallet: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" opacity="0.3" />
      <circle cx="16" cy="13" r="1.5" fill="currentColor" />
      <path d="M1 10c0 3 1 5 2 7" strokeLinecap="round" opacity="0.4" />
      <path d="M23 10c0 3-1 5-2 7" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  // 社交图标
  Google: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  Twitter: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z" />
    </svg>
  ),
  Discord: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  ),
  // 交易图标
  Deposit: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="16" rx="6" ry="4" />
      <path d="M12 4v8" />
      <path d="M8 8l4 4 4-4" />
      <path d="M6 18c-1 1 0 2 1 3" strokeLinecap="round" opacity="0.4" />
      <path d="M18 18c1 1 0 2-1 3" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  Withdraw: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="16" rx="6" ry="4" />
      <path d="M12 12V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M6 18c-1 1 0 2 1 3" strokeLinecap="round" opacity="0.4" />
      <path d="M18 18c1 1 0 2-1 3" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
};

// 章鱼大头像组件 - 统一使用动态 GIF Logo，配合 screen 模式和发光滤镜
const OctopusAvatar = ({ username }: { username: string }) => (
  <div className="relative w-28 h-28 overflow-hidden rounded-2xl bg-black/20 border border-white/5">
    <img
      src="/image.gif"
      alt="User Avatar"
      className="w-full h-full object-cover mix-blend-screen scale-125"
      style={{
        filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 0 10px rgba(0,242,255,0.3))',
      }}
    />
  </div>
);

// 章鱼吸盘统计卡片
const OctoStatCard = ({ stat, index }: { stat: any; index: number }) => {
  const iconMap: Record<string, JSX.Element> = {
    'PTS': <OctoIcons.Points />,
    'Active Positions': <OctoIcons.Position />,
    'Win Rate': <OctoIcons.WinRate />,
    'Total ROI': <OctoIcons.ROI />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring" }}
      className="relative group"
    >
      {/* 吸盘外发光 */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-2xl p-5 overflow-hidden group-hover:border-cyan-500/30 transition-all">
        {/* 吸盘同心圆纹理 */}
        <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 100 100">
          <circle cx="80" cy="80" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="80" cy="80" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="80" cy="80" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        
        {/* 章鱼图标 */}
        <motion.div 
          className="text-cyan-400 mb-3"
          animate={{ y: [0, -3, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
        >
          {iconMap[stat.label] || <OctoIcons.Points />}
        </motion.div>
        
        <p className="text-[9px] font-bold uppercase text-white/40 tracking-widest mb-1">{stat.label}</p>
        <p className="text-2xl font-black text-white">{stat.value}</p>
        {stat.sub && (
          <p className="text-[10px] text-white/30 mt-1">{stat.sub}</p>
        )}
        
        {/* 触手角落装饰 */}
        <svg className="absolute bottom-0 right-0 w-16 h-16 text-cyan-500/10" viewBox="0 0 60 60">
          <path d="M60 60 Q 45 40, 35 50 T 15 60" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M60 50 Q 40 35, 30 45 T 10 50" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </motion.div>
  );
};

// 章鱼触手连接账户卡片
const OctoAccountCard = ({ account, index, onClick }: { account: any; index: number; onClick?: () => void }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className={`relative group ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div className={`relative bg-gradient-to-r ${
      account.connected 
        ? 'from-cyan-500/10 to-purple-500/10 border-cyan-500/20' 
        : 'from-white/[0.02] to-transparent border-white/5'
    } border rounded-xl p-4 overflow-hidden group-hover:border-cyan-500/30 transition-all`}>
      
      {/* 连接触手效果 */}
      {account.connected && (
        <motion.svg 
          className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-16 text-cyan-500/30"
          viewBox="0 0 30 60"
        >
          <motion.path
            d="M0 30 Q 15 25, 25 30 T 30 30"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            animate={{
              d: [
                "M0 30 Q 15 25, 25 30 T 30 30",
                "M0 30 Q 15 35, 25 30 T 30 30",
                "M0 30 Q 15 25, 25 30 T 30 30",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.svg>
      )}
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <motion.div 
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              account.connected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/30'
            }`}
            animate={account.connected ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {account.icon}
          </motion.div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{account.type}</p>
            <p className={`text-xs font-mono font-bold ${account.connected ? 'text-white' : 'text-white/20'}`}>
              {account.label}
            </p>
          </div>
        </div>
        
        {/* 操作按钮 - 仅在未连接时显示 "LINK"，连接后显示 "SWITCH" (针对钱包) 或 "CONNECTED" */}
        <div className="flex items-center gap-3">
          {!account.connected ? (
            <span className="text-[9px] font-black text-cyan-400 border border-cyan-400/30 px-2 py-1 rounded bg-cyan-400/5 group-hover:bg-cyan-400 group-hover:text-black transition-all">
              {account.linkText || 'LINK_NOW'}
            </span>
          ) : (
            <div className="flex items-center gap-2">
              {account.type === "Wallet" && (
                <span className="text-[8px] font-bold text-white/30 group-hover:text-cyan-400 transition-colors">
                  {account.switchText || 'SWITCH_WALLET'}
                </span>
              )}
              <div className={`relative w-6 h-6 rounded-full ${
                account.connected ? 'bg-green-500/20' : 'bg-white/5'
              } flex items-center justify-center`}>
                <motion.div 
                  className={`w-2 h-2 rounded-full ${account.connected ? 'bg-green-400' : 'bg-white/20'}`}
                  animate={account.connected ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                {account.connected && (
                  <div className="absolute inset-0 rounded-full bg-green-400/30 animate-ping" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

// 章鱼墨水活动卡片
const OctoActivityItem = ({ tx, index, depositText, withdrawText }: { tx: any; index: number; depositText?: string; withdrawText?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="relative group"
  >
    <div className={`relative flex items-center justify-between rounded-xl p-4 border transition-all ${
      tx.type === "DEPOSIT" 
        ? 'bg-green-500/5 border-green-500/10 group-hover:border-green-500/30' 
        : 'bg-red-500/5 border-red-500/10 group-hover:border-red-500/30'
    }`}>
      {/* 墨水扩散效果 */}
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${
        tx.type === "DEPOSIT" ? 'bg-green-500/5' : 'bg-red-500/5'
      }`} />
      
      <div className="flex items-center gap-4 relative z-10">
        <motion.div 
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            tx.type === "DEPOSIT" 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
        >
          {tx.type === "DEPOSIT" ? <OctoIcons.Deposit /> : <OctoIcons.Withdraw />}
        </motion.div>
        <div>
          <p className="text-sm font-bold text-white">
            {tx.type === "DEPOSIT" ? (depositText || "Deposit") : (withdrawText || "Withdraw")}
          </p>
          <p className="text-xs text-white/30">
            {new Date(tx.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
      
      <div className="text-right relative z-10">
        <p className={`text-sm font-bold ${
          tx.type === "DEPOSIT" ? "text-green-400" : "text-red-400"
        }`}>
          {tx.type === "DEPOSIT" ? "+" : "-"}{tx.amount} ETH
        </p>
        <a 
          href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] font-mono text-white/30 hover:text-cyan-400 transition-colors"
        >
          {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)} ↗
        </a>
        <p className={`text-[10px] font-bold uppercase mt-1 ${
          tx.status === "CONFIRMED" ? "text-green-400" : tx.status === "FAILED" ? "text-red-400" : "text-yellow-400"
        }`}>
          {tx.status}
        </p>
      </div>
      
      {/* 触手连接线 */}
      <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-8 -ml-1 text-white/10" viewBox="0 0 8 30">
        <path d="M4 0 Q 0 15, 4 30" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    </div>
  </motion.div>
);

export default function ProfilePage() {
  const { 
    user: authUser, 
    status, 
    linkWallet, 
    linkTwitter, 
    linkDiscord, 
    linkEmail 
  } = useAuth();
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const queryClient = useQueryClient();
  const { profile: userProfile, isLoading: profileLoading, refetch: refetchProfile } = useProfile(authUser?.id || "");
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  // 🆕 钱包交互逻辑集成
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const pendingAmountRef = useRef<string>("");
  const pendingTypeRef = useRef<"deposit" | "withdraw">("deposit");

  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const handleVaultAction = async () => {
    const vaultAddress = vaultInfo?.address as `0x${string}` | undefined;
    if (!vaultAddress || !amount || parseFloat(amount) <= 0) return;
    
    try {
      setTxStatus("pending");
      pendingAmountRef.current = amount;
      pendingTypeRef.current = activeTab;
      
      if (activeTab === "deposit") {
        writeContract({
          address: vaultAddress,
          abi: VAULT_ABI,
          functionName: "depositETH",
          value: parseEther(amount),
        });
      } else {
        writeContract({
          address: vaultAddress,
          abi: VAULT_ABI,
          functionName: "withdrawETH",
          args: [parseEther(amount)],
        });
      }
    } catch (error) {
      console.error("Vault action error:", error);
      setTxStatus("error");
    }
  };

  // 监听交易状态
  useEffect(() => {
    if (isConfirmed && txHash && txStatus === "pending" && authUser?.id) {
      const record = async () => {
        try {
          if (pendingTypeRef.current === "deposit") {
            await api.recordDeposit(authUser.id, txHash, pendingAmountRef.current, "ETH");
          } else {
            await api.recordWithdraw(authUser.id, txHash, pendingAmountRef.current, "ETH");
          }
          setTxStatus("success");
          setAmount("");
          refetchProfile();
          queryClient.invalidateQueries({ queryKey: ["transactionHistory", authUser.id] });
          setTimeout(() => setTxStatus("idle"), 3000);
        } catch (e) {
          setTxStatus("success"); 
        }
      };
      record();
    }
  }, [isConfirmed, txHash, txStatus, authUser?.id, refetchProfile, queryClient]);

  useEffect(() => {
    if (writeError && txStatus === "pending") setTxStatus("error");
  }, [writeError, txStatus]);

  // Wagmi hooks for wallet balance
  const { address, isConnected } = useAccount();
  const { data: walletBalance } = useBalance({ address });

  // 更新用户名
  const updateUsernameMutation = useMutation({
    mutationFn: (username: string) => api.updateUsername(authUser!.id, username),
    onSuccess: () => {
      setShowEditModal(false);
      setNewUsername("");
      refetchProfile();
      queryClient.invalidateQueries({ queryKey: ["userProfile", authUser?.id] });
    },
  });

  // 获取 Vault 信息
  const { data: vaultInfo } = useQuery({
    queryKey: ["vaultInfo"],
    queryFn: () => api.getVaultInfo(),
    staleTime: 60000,
  });

  const { data: txHistory } = useQuery({
    queryKey: ["transactionHistory", authUser?.id],
    queryFn: () => api.getTransactionHistory(authUser!.id, 10),
    enabled: !!authUser?.id,
  });

  const { data: activePositions } = useQuery({
    queryKey: ["activePositions", authUser?.id],
    queryFn: () => api.getActivePositions(authUser!.id),
    enabled: !!authUser?.id,
  });

  const notConnectedText = t.profile?.notConnected || "Not connected";
  const linkNowText = t.profile?.linkNow || "LINK_NOW";
  const switchWalletText = t.profile?.switchWallet || "SWITCH_WALLET";
  
  const connectedAccounts = [
    {
      type: t.profile?.walletBalance ? "Wallet" : "Wallet",
      label: authUser?.address ? `${authUser.address.slice(0, 6)}...${authUser.address.slice(-4)}` : notConnectedText,
      connected: !!authUser?.address,
      icon: <OctoIcons.Wallet />,
      action: linkWallet,
      linkText: linkNowText,
      switchText: switchWalletText,
    },
    {
      type: "Google",
      label: authUser?.email || notConnectedText,
      connected: !!authUser?.email,
      icon: <OctoIcons.Google />,
      action: linkEmail,
      linkText: linkNowText,
    },
    {
      type: "Twitter",
      label: authUser?.twitterId || notConnectedText,
      connected: !!authUser?.twitterId,
      icon: <OctoIcons.Twitter />,
      action: linkTwitter,
      linkText: linkNowText,
    },
    {
      type: "Discord",
      label: authUser?.discordId || notConnectedText,
      connected: !!authUser?.discordId,
      icon: <OctoIcons.Discord />,
      action: linkDiscord,
      linkText: linkNowText,
    }
  ];

  const stats = [
    { label: t.profile?.points || "PTS", value: userProfile?.pts || 0, sub: t.profile?.totalPoints || "Total Points" },
    { label: t.profile?.activePositions || "Active Positions", value: activePositions?.length || 0, sub: t.profile?.currentlyOpen || "Currently open" },
    { label: t.profile?.winRate || "Win Rate", value: userProfile?.winRate ? `${(userProfile.winRate * 100).toFixed(1)}%` : "0%", sub: t.profile?.allTime || "All time" },
    { label: t.profile?.totalRoi || "Total ROI", value: userProfile?.roi ? `${userProfile.roi}%` : "0%", sub: t.profile?.return || "Return" }
  ];

  return (
    <div className="relative min-h-screen bg-transparent text-white overflow-hidden">
      {/* 章鱼主题背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <SparklesCore
          background="transparent"
          minSize={0.3}
          maxSize={0.8}
          particleDensity={25}
          particleColor="#06b6d4"
          className="opacity-40"
        />
        <InkParticles count={30} />
        
        {/* 大型光晕 */}
        <div className="absolute -top-[20%] -left-[15%] w-[60%] h-[60%] bg-cyan-900/20 blur-[200px] rounded-full" />
        <div className="absolute top-[40%] -right-[15%] w-[50%] h-[50%] bg-purple-900/20 blur-[180px] rounded-full" />
      </div>
      
      {/* 触手波浪 */}
      <TentacleWaves />
      
      {/* 浮动章鱼 */}
      <FloatingOctopus className="absolute top-20 right-10 opacity-25 hidden xl:block" size="lg" color="cyan" />
      <FloatingOctopus className="absolute top-1/3 left-5 opacity-20 hidden lg:block" size="md" color="purple" />
      <FloatingOctopus className="absolute bottom-40 right-20 opacity-15 hidden xl:block" size="sm" color="pink" />
      
      <div className="relative max-w-6xl mx-auto px-4 py-8 lg:py-12">
        {/* Header with Octopus Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-10"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* 大章鱼头像 - 固定宽度防止重叠，背景色配合 mix-blend-mode */}
            <div className="flex-shrink-0 bg-transparent rounded-lg">
              <OctopusAvatar username={authUser?.username || userProfile?.username || "Explorer"} />
            </div>
            
            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                <motion.span 
                  className="text-cyan-400 flex-shrink-0"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <OctoProfile className="w-6 h-6" />
                </motion.span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">{t.profile?.octopusProfile || "章鱼檔案"}</span>
              </div>
              
              {/* 用户名和编辑按钮在同一行 */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight break-all">
                  {authUser?.username || userProfile?.username || "Explorer"}
                </h1>
                
                {/* 编辑个人资料按钮 - 在用户名右边 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center gap-1.5 bg-neon-purple/10 px-3 py-1.5 rounded-full border border-neon-purple/30 text-[10px] font-bold text-white hover:bg-neon-purple/20 transition-all flex-shrink-0"
                >
                  <OctoIcons.Edit />
                  {t.profile?.editProfile || "編輯資料"}
                </motion.button>
              </div>
              
              <p className="text-sm text-white/40 max-w-md mx-auto md:mx-0">
                {t.profile?.desc || "管理您的账户、餘額和偏好設置"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid - 章鱼吸盘风格 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, index) => (
            <OctoStatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>

        {/* Wallet Management Card - 章鱼钱包 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 p-6 overflow-hidden">
            {/* 章鱼装饰 */}
            <svg className="absolute top-4 right-4 w-24 h-24 text-white/5" viewBox="0 0 80 80" fill="none">
              <ellipse cx="40" cy="30" rx="25" ry="18" stroke="currentColor" strokeWidth="2" />
              <circle cx="32" cy="28" r="4" fill="currentColor" />
              <circle cx="48" cy="28" r="4" fill="currentColor" />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <path
                  key={i}
                  d={`M ${15 + i * 10} 45 Q ${12 + i * 10} 60, ${8 + i * 12} 75`}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity={0.3 + i * 0.1}
                />
              ))}
            </svg>
            
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-cyan-400"
              >
                <OctoWallet className="w-8 h-8" />
              </motion.div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {t.profile?.octopusVault || "Octopus"} <span className="text-cyan-400">Vault</span>
                </h3>
                <p className="text-xs text-white/40">
                  {vaultInfo?.isConfigured ? (t.profile?.connectToManage || 'Manage your funds') : (t.profile?.connectToManage || 'Connect to manage funds')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* 钱包余额 */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <OctoIcons.Wallet />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{t.profile?.walletBalance || "Wallet Balance"}</span>
                </div>
                <p className="text-2xl font-black text-white">
                  {isConnected && walletBalance 
                    ? `${parseFloat(formatEther(walletBalance.value)).toFixed(4)} ETH`
                    : '-- ETH'
                  }
                </p>
                <p className="text-[10px] text-white/30 mt-1">
                  {isConnected ? (t.team?.connected || 'Connected') : (t.profile?.notConnected || 'Not connected')}
                </p>
              </div>

              {/* 平台积分 */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <OctoIcons.Points />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{t.profile?.platformPts || "Platform PTS"}</span>
                </div>
                <p className="text-2xl font-black text-cyan-400">
                  {(userProfile?.pts || 0).toLocaleString()} PTS
                </p>
                <p className="text-[10px] text-white/30 mt-1">{t.profile?.availableToUse || "Available to use"}</p>
              </div>

              {/* 链上余额 */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" opacity="0.3" />
                      <path d="M12 6v12M6 12h12" strokeLinecap="round" />
                    </svg>
                  </motion.div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{t.profile?.onChain || "On-chain"}</span>
                </div>
                <p className="text-2xl font-black text-green-400">
                  {(userProfile?.onChainBalance || 0).toFixed(4)} ETH
                </p>
                <p className="text-[10px] text-white/30 mt-1">{t.profile?.inVaultContract || "In vault contract"}</p>
              </div>
            </div>

            {/* 🆕 钱包交互表单集成 */}
            <div className="mt-6 bg-white/[0.02] rounded-xl border border-white/5 p-4 md:p-6">
              <div className="flex gap-2 mb-6 bg-black/20 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("deposit")}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-md ${
                    activeTab === "deposit" ? "bg-green-500/20 text-green-400 shadow-lg shadow-green-500/10" : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {t.profile?.deposit || 'Deposit'}
                </button>
                <button
                  onClick={() => setActiveTab("withdraw")}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-md ${
                    activeTab === "withdraw" ? "bg-red-500/20 text-red-400 shadow-lg shadow-red-500/10" : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {t.profile?.withdraw || 'Withdraw'}
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xl font-mono text-white placeholder:text-white/10 focus:outline-none focus:border-cyan-500/50"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20 uppercase">ETH</div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {["0.01", "0.05", "0.1", "0.5"].map(val => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className="py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold transition-all text-white/40 hover:text-white"
                    >
                      {val}
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {txStatus !== "idle" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        txStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        txStatus === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {txStatus === 'pending' ? `⏳ ${t.profile?.txPending || 'Transaction pending...'}` :
                       txStatus === 'success' ? `✅ ${t.profile?.txSuccess || 'Success!'}` : `❌ ${t.profile?.txFailed || 'Transaction failed'}`}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!isConnected || !amount || parseFloat(amount) <= 0 || isWritePending || isConfirming}
                  onClick={handleVaultAction}
                  className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] transition-all disabled:opacity-30 ${
                    activeTab === 'deposit' 
                      ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border border-green-500/30' 
                      : 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {isWritePending || isConfirming ? (t.profile?.processing || "Processing...") : `${activeTab === 'deposit' ? t.profile?.deposit : t.profile?.withdraw} ETH`}
                </motion.button>
              </div>
            </div>

            {/* Vault 状态提示 */}
            {!vaultInfo?.isConfigured && (
              <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-400 text-center">
                  ⚠️ {t.profile?.vaultNotConfigured || "Vault contract not configured. Contact admin to enable deposits/withdrawals."}
                </p>
              </div>
            )}

            {/* 触手装饰 */}
            <svg className="absolute bottom-0 left-0 w-32 h-16 text-cyan-500/10" viewBox="0 0 120 60" preserveAspectRatio="none">
              <path d="M0 60 Q 20 40, 40 50 T 80 50 T 120 60" stroke="currentColor" strokeWidth="3" fill="none" />
              <path d="M0 50 Q 30 30, 60 45 T 120 45" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
            </svg>
          </div>
        </motion.div>

        {/* Referral Section */}
        {authUser?.id && (userProfile?.referralCode || authUser?.referralCode) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <ReferralPanel
              userId={authUser.id}
              referralCode={userProfile?.referralCode || authUser?.referralCode || ""}
            />
          </motion.div>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Connected Accounts - 章鱼触手连接 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <motion.svg 
                className="w-8 h-8 text-cyan-400"
                viewBox="0 0 32 32"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <ellipse cx="16" cy="12" rx="10" ry="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <circle cx="12" cy="11" r="2" fill="currentColor" />
                <circle cx="20" cy="11" r="2" fill="currentColor" />
                {/* 伸出的连接触手 */}
                <path d="M6 18c-2 2-3 5-2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 20c-1 3 0 6 1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                <path d="M20 20c1 3 0 6-1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                <path d="M26 18c2 2 3 5 2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </motion.svg>
              <h3 className="text-xl font-black uppercase tracking-tight">
                {t.profile?.connectedTentacles || 'Connected'} <span className="text-cyan-400">Tentacles</span>
              </h3>
            </div>
            
            <div className="space-y-3">
              {connectedAccounts.map((account, index) => (
                <OctoAccountCard 
                  key={account.type} 
                  account={account} 
                  index={index} 
                  onClick={account.action}
                />
              ))}
            </div>
          </motion.div>

          {/* Recent Activity - 章鱼墨水历史 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <motion.svg 
                className="w-8 h-8 text-purple-400"
                viewBox="0 0 32 32"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ellipse cx="16" cy="14" rx="10" ry="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <circle cx="12" cy="13" r="2" fill="currentColor" />
                <circle cx="20" cy="13" r="2" fill="currentColor" />
                {/* 墨水喷射 */}
                <path d="M16 22v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                <circle cx="16" cy="30" r="2" fill="currentColor" opacity="0.3" />
                <circle cx="12" cy="28" r="1.5" fill="currentColor" opacity="0.2" />
                <circle cx="20" cy="28" r="1.5" fill="currentColor" opacity="0.2" />
              </motion.svg>
              <h3 className="text-xl font-black uppercase tracking-tight">
                {t.profile?.inkTrail || 'Ink'} <span className="text-purple-400">Trail</span>
              </h3>
            </div>
            
            <div className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-4 overflow-hidden">
              {/* 墨水背景效果 */}
              <div className="absolute inset-0 opacity-30">
                <svg className="w-full h-full" viewBox="0 0 200 300" preserveAspectRatio="none">
                  <circle cx="150" cy="50" r="30" fill="#a855f7" opacity="0.1" />
                  <circle cx="50" cy="150" r="40" fill="#06b6d4" opacity="0.1" />
                  <circle cx="170" cy="250" r="25" fill="#a855f7" opacity="0.1" />
                </svg>
              </div>
              
              {txHistory && txHistory.length > 0 ? (
                <div className="space-y-3 relative z-10">
                  {txHistory.slice(0, 5).map((tx: any, index: number) => (
                    <OctoActivityItem key={tx.id} tx={tx} index={index} depositText={t.profile?.deposit} withdrawText={t.profile?.withdraw} />
                  ))}
                </div>
              ) : (
                <motion.div 
                  className="flex flex-col items-center justify-center py-12 text-center relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.svg 
                    className="w-20 h-20 text-white/10 mb-4"
                    viewBox="0 0 80 80"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <ellipse cx="40" cy="30" rx="20" ry="15" stroke="currentColor" strokeWidth="2" fill="none" />
                    <circle cx="35" cy="28" r="3" fill="currentColor" />
                    <circle cx="45" cy="28" r="3" fill="currentColor" />
                    <path d="M35 38 Q 40 35, 45 38" stroke="currentColor" strokeWidth="2" fill="none" />
                    {/* 问号触手 */}
                    <path d="M40 45 Q 40 55, 35 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                    <circle cx="35" cy="65" r="2" fill="currentColor" opacity="0.3" />
                  </motion.svg>
                  <p className="text-sm text-white/30">{t.profile?.noInkTrails || 'No ink trails yet...'}</p>
                  <p className="text-xs text-white/20 mt-1">{t.profile?.activityWillAppear || 'Your activity history will appear here'}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 编辑个人资料 Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a0a] rounded-2xl border border-white/10 w-full max-w-md p-6 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 章鱼装饰 */}
              <svg className="absolute top-4 right-4 w-16 h-16 text-cyan-500/10" viewBox="0 0 60 60" fill="none">
                <ellipse cx="30" cy="22" rx="18" ry="14" stroke="currentColor" strokeWidth="2" />
                <circle cx="24" cy="20" r="3" fill="currentColor" />
                <circle cx="36" cy="20" r="3" fill="currentColor" />
                {[0, 1, 2, 3, 4].map((i) => (
                  <path key={i} d={`M ${12 + i * 9} 34 Q ${10 + i * 9} 45, ${6 + i * 12} 55`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={0.3 + i * 0.1} />
                ))}
              </svg>

              {/* 关闭按钮 */}
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white"
              >
                <OctoIcons.X />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black text-white mb-2">{t.profile?.updateProfile || 'Edit Profile'}</h2>
                <p className="text-sm text-white/40">{t.profile?.updateIdentity || 'Update your octopus identity'}</p>
              </div>

              <div className="space-y-4">
                {/* 用户名输入 */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2 block">
                    {t.profile?.username || 'Username'}
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder={authUser?.username || (t.profile?.enterNewUsername || "Enter new username")}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    maxLength={20}
                  />
                  <p className="text-[10px] text-white/30 mt-1">{t.profile?.usernameHint || '3-20 characters, letters and numbers only'}</p>
                </div>

                {/* 当前钱包地址（只读） */}
                {authUser?.address && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2 block">
                      {t.profile?.walletAddress || 'Wallet Address'}
                    </label>
                    <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-white/40 font-mono text-xs">
                      {authUser.address}
                    </div>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm uppercase tracking-wider hover:bg-white/10 transition-all"
                >
                  {t.profile?.cancel || 'Cancel'}
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (newUsername.trim() && newUsername.length >= 3) {
                      updateUsernameMutation.mutate(newUsername.trim());
                    }
                  }}
                  disabled={!newUsername.trim() || newUsername.length < 3 || updateUsernameMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold text-sm uppercase tracking-wider hover:bg-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateUsernameMutation.isPending ? (
                    <span>{t.profile?.saving || 'Saving...'}</span>
                  ) : (
                    <>
                      <OctoIcons.Save />
                      {t.profile?.saveChanges || 'Save Changes'}
                    </>
                  )}
                </motion.button>
              </div>

              {/* 错误提示 */}
              {updateUsernameMutation.isError && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400">{t.profile?.updateFailed || 'Failed to update. Please try again.'}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
