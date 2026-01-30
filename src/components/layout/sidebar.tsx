"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";
import { motion } from "framer-motion";

import { useAuth } from "../../hooks/use-auth";
import { useUIStore } from "../../stores/ui-store";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { SuperoctopLogo } from "./logo";
import { 
  OctoHome, 
  OctoMarket, 
  OctoProfile, 
  OctoTasks, 
  OctoTeam, 
  OctoLeaderboard, 
  OctoPlayground, 
  OctoDocs 
} from "../icons/octopus-icons";

// 社交媒体图标
const SocialIcons = {
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
};

// 补全 OctoIcons 引用
const OctoIcons = {
  Wallet: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" opacity="0.3" />
      <circle cx="16" cy="13" r="1.5" fill="currentColor" />
    </svg>
  )
};

export function Sidebar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const { status, login, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  // 🆕 联动功能开关：从后端同步哪些功能可用
  const { data: featureFlags } = useQuery({
    queryKey: ["featureFlags"],
    queryFn: () => api.getFeatureFlags(),
    staleTime: 60000,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const navItems = [
    { href: "/home", label: t.sidebar.home, Icon: OctoHome, key: "home" },
    { href: "/market", label: t.sidebar.market, Icon: OctoMarket, key: "market" },
    { href: "/profile", label: t.sidebar.profile, Icon: OctoProfile, badge: "💰", key: "profile" },
    { href: "/tasks", label: t.sidebar.tasks, Icon: OctoTasks, key: "tasks" },
    { href: "/team", label: t.sidebar.team, Icon: OctoTeam, key: "team" },
    { href: "/leaderboard", label: t.sidebar.leaderboard, Icon: OctoLeaderboard, key: "leaderboard" },
    { href: "/playground", label: t.sidebar.playground, Icon: OctoPlayground, badge: "AI", key: "playground" },
    { href: "/docs", label: t.sidebar.docs, Icon: OctoDocs, key: "docs" }
  ].filter(item => {
    // 如果后端关闭了该功能，则从侧边栏移除
    if (!featureFlags) return true;
    return featureFlags[item.key] !== false;
  });

  if (!mounted) return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-72 border-r border-white/5 bg-transparent p-6 lg:translate-x-0 -translate-x-full">
      <div className="flex h-full flex-col animate-pulse">
        <div className="mb-10 flex items-center gap-3 px-2 py-6">
          <div className="h-12 w-12 rounded-full bg-white/5" />
          <div className="h-8 w-32 bg-white/5 rounded" />
        </div>
        <div className="flex-1 space-y-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-10 w-full bg-white/5 rounded-lg" />
          ))}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-white/5 bg-transparent p-6 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex h-full flex-col">
          {/* Logo 和关闭按钮 */}
          <div className="mb-10 flex items-center gap-3 px-2 py-6">
            <SuperoctopLogo className="h-12 w-12" />
            <div className="flex-1">
              <h2 className="text-2xl font-black tracking-[0.1em] text-white leading-none uppercase italic">
                Super<span className="text-cyan-400">Octop</span>
              </h2>
              <div className="mt-1 h-0.5 w-full bg-gradient-to-r from-cyan-400 via-purple-500 to-transparent opacity-50" />
            </div>
            {/* 移动端关闭按钮 */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/60 hover:text-white transition-colors p-2 -mr-2"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              const IconComponent = item.Icon;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href as any}
                    onClick={handleNavClick}
                    prefetch={true}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-white border border-cyan-500/20"
                        : "text-white/40 hover:bg-white/[0.03] hover:text-white border border-transparent"
                    }`}
                  >
                    <span className={`transition-all duration-300 ${
                      isActive 
                        ? "text-cyan-400 scale-110" 
                        : "text-white/40 group-hover:text-cyan-400 group-hover:scale-110"
                    }`}>
                      <IconComponent animate={isActive} />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${
                        isActive 
                          ? "bg-cyan-500/20 text-cyan-400" 
                          : "bg-white/5 text-white/40"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {/* 活跃指示器 - 触手形状 */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 w-1 h-6 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-r-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-white/5 pt-6 pb-2 mt-auto">
            {/* 装饰触手 */}
            <div className="absolute bottom-32 left-0 w-full overflow-hidden opacity-10 pointer-events-none">
              <svg className="w-full h-16" viewBox="0 0 300 60" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M0 30 Q 50 10, 100 30 T 200 30 T 300 30" className="text-cyan-400" />
                <path d="M0 40 Q 50 20, 100 40 T 200 40 T 300 40" className="text-purple-400" />
                <path d="M0 50 Q 50 30, 100 50 T 200 50 T 300 50" className="text-cyan-400" opacity="0.5" />
              </svg>
            </div>
            
            <div className="mb-6 flex justify-around px-6">
              <motion.span 
                onClick={login}
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="cursor-pointer text-white/20 hover:text-white transition-colors"
                title="Login with Google"
              >
                <SocialIcons.Google />
              </motion.span>
              <motion.span 
                onClick={login}
                whileHover={{ scale: 1.2, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                className="cursor-pointer text-white/20 hover:text-white transition-colors"
                title="Login with X (Twitter)"
              >
                <SocialIcons.Twitter />
              </motion.span>
              <motion.span 
                onClick={login}
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="cursor-pointer text-white/20 hover:text-white transition-colors"
                title="Login with Discord"
              >
                <SocialIcons.Discord />
              </motion.span>
            </div>
            {status === 'authenticated' ? (
              <button 
                onClick={logout}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-red-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300 active:scale-95"
              >
                <span className="text-xs">⏻</span>
                LOGOUT
              </button>
            ) : (
              <button 
                onClick={login}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 transition-all hover:bg-white/10 hover:text-white active:scale-95 border border-white/5 hover:border-white/20"
              >
                <span className="text-xs">↳</span>
                {t.sidebar.login}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
