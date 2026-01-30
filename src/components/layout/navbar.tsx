"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "../web3/wallet-button";
import { LanguageSelector } from "./language-selector";
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";
import { useUIStore } from "../../stores/ui-store";

import { SuperoctopLogo } from "./logo";
import { NotificationDropdown } from "./notification-dropdown";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const { setSidebarOpen } = useUIStore();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 检查是否在仪表盘路由下
  const isDashboard = pathname !== '/' && !pathname.startsWith('/auth');

  const links = [
    { href: "/", label: t.nav.hub },
    { href: "/market", label: t.nav.arena },
    { href: "/portfolio", label: t.nav.portfolio },
    { href: "/docs", label: t.nav.research }
  ];

  if (!mounted) return (
    <header className={`border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-30 h-14 sm:h-20 w-full ${isDashboard ? 'lg:pl-72' : ''}`}>
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="h-10 w-32 bg-white/5 rounded animate-pulse" />
        <div className="hidden lg:flex gap-8">
          {[1,2,3,4].map(i => <div key={i} className="h-4 w-16 bg-white/5 rounded animate-pulse" />)}
        </div>
        <div className="h-10 w-24 bg-white/5 rounded-full animate-pulse" />
      </div>
    </header>
  );

  return (
    <header className={`border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-30 h-14 sm:h-20 w-full transition-all duration-300 ${isDashboard ? 'lg:pl-72' : ''}`}>
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between gap-4 box-border">
        
        {/* 左侧：菜单按钮 */}
        <div className="lg:hidden flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* 中间：Logo */}
        <div className="flex-shrink-0">
          <Link href="/home" className="flex items-center gap-2 group">
            <SuperoctopLogo className="h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 transition-transform group-hover:scale-110" />
            <span className="text-sm sm:text-xl font-black text-white tracking-tighter uppercase italic bg-gradient-to-r from-white via-cyan-400 to-purple-500 bg-clip-text text-transparent">Superoctop</span>
          </Link>
        </div>

        {/* 桌面导航 */}
        <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center px-4">
          {links.map((link) => (
            <Link 
              key={link.label} 
              href={link.href as any} 
              prefetch={true}
              className="text-sm font-bold text-white/40 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 右侧：操作区 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <NotificationDropdown />
          <LanguageSelector />
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
