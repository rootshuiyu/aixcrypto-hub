"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";
import { useAuth } from "../../hooks/use-auth";

export function Footer() {
  const [mounted, setMounted] = useState(false);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const pathname = usePathname();
  const { status } = useAuth();
  const isConnected = status === 'authenticated';

  useEffect(() => {
    setMounted(true);
  }, []);

  // 检查是否在仪表盘路由下（通常侧边栏存在的页面）
  const isDashboard = pathname !== '/' && !pathname.startsWith('/auth');

  if (!mounted) return (
    <footer className={`border-t border-white/5 bg-black h-24 ${isDashboard ? 'lg:ml-72' : ''}`}>
      <div className="mx-auto max-w-7xl px-6 py-8 flex justify-between items-center opacity-20">
        <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
        <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
      </div>
    </footer>
  );

  return (
    <footer className={`border-t border-white/5 bg-black transition-all duration-300 ${isDashboard ? 'lg:ml-72' : ''}`}>
      <div className="mx-auto max-w-7xl px-6 py-4 md:px-12 lg:px-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between h-16">
          {/* 左侧：极简网络状态 */}
          <div className="flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50">
                {t.footer.networkTitle}
              </h4>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${isConnected ? 'text-white/30' : 'text-red-500/40'}`}>
                  {isConnected ? t.footer.networkStatus : t.footer.disconnected}
                </span>
              </div>
            </div>
            <p className="text-[8px] text-white/10 uppercase tracking-[0.2em] font-mono">
              © 2026 Superoctop. {t.footer.rights}.
            </p>
          </div>

          {/* 右侧：精简链接 */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-white/20">
              <span className="cursor-pointer hover:text-white transition-colors">{t.sidebar.docs}</span>
              <span className="cursor-pointer hover:text-white transition-colors">{t.footer.community}</span>
            </div>
            <div className={`flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1`}>
              <div className={`h-1 w-1 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`}></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-white/10">
                {isConnected ? t.footer.connected : t.footer.disconnected}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
