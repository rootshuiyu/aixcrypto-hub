"use client";

import Link from "next/link";
import { TechGrid } from "./tech-grid";
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";
import { SuperoctopLogo } from "../layout/logo";
import { useAuth } from "../../hooks/use-auth";

// 授权图标组件
const AuthIcons = {
  Google: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
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

export function HomeHero() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const { login, status } = useAuth();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="relative flex h-full min-h-[400px] items-center justify-center py-2">
      {/* Tech Grid Background */}
      <TechGrid />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 scale-90 sm:scale-100">
        <div className="flex justify-center mb-2 sm:mb-4">
          <SuperoctopLogo className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 drop-shadow-[0_0_40px_rgba(0,242,255,0.3)]" />
        </div>
        <div className="animate-float">
          <h1 className="mb-1 text-3xl font-black tracking-tighter sm:mb-3 sm:text-5xl md:text-6xl">
            <span className="gradient-text drop-shadow-[0_0_30px_rgba(251,146,60,0.4)]">superoctop</span>
            <span className="text-white"> {t.home.title}</span>
          </h1>
        </div>
        
        <p className="mb-1 text-xs text-white/70 sm:mb-2 sm:text-base md:text-lg animate-fade-in">
          {t.home.desc}
        </p>
        <p className="mb-4 text-[10px] text-white/50 sm:mb-6 sm:text-xs md:text-sm opacity-70">
          {t.home.learn}
        </p>

        {/* 未登录：连接钱包 / 已登录：进入预测市场，避免重复调用 login 触发 Privy 警告 */}
        <div className="mb-4 sm:mb-6 relative z-20">
          {isAuthenticated ? (
            <Link
              href="/market"
              className="group relative inline-block overflow-hidden rounded-lg bg-white px-6 py-2 text-xs font-bold text-midnight transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] sm:rounded-xl sm:px-8 sm:py-3 sm:text-sm uppercase tracking-widest cursor-pointer"
            >
              <span className="relative z-10">{t.home?.enterArena ?? "进入预测市场"}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shimmer" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => login()}
              className="group relative overflow-hidden rounded-lg bg-white px-6 py-2 text-xs font-bold text-midnight transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] sm:rounded-xl sm:px-8 sm:py-3 sm:text-sm uppercase tracking-widest cursor-pointer"
            >
              <span className="relative z-10">{t.home.connect}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shimmer" />
            </button>
          )}
        </div>

        {/* Join Community - 未登录时点击打开 Privy，已登录时不调用 login 避免警告 */}
        <div className="mb-1 relative z-20">
          <p className="mb-2 text-[9px] text-white/40 uppercase tracking-widest">{t.home.join}</p>
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => !isAuthenticated && login()}
              className="rounded-full bg-white/5 p-2 text-white/50 transition-all hover:bg-white/10 hover:text-white hover:scale-110 cursor-pointer"
              title="Google"
            >
              <AuthIcons.Google />
            </button>
            <button
              type="button"
              onClick={() => !isAuthenticated && login()}
              className="rounded-full bg-white/5 p-2 text-white/50 transition-all hover:bg-white/10 hover:text-white hover:scale-110 cursor-pointer"
              title="X (Twitter)"
            >
              <AuthIcons.Twitter />
            </button>
            <button
              type="button"
              onClick={() => !isAuthenticated && login()}
              className="rounded-full bg-white/5 p-2 text-white/50 transition-all hover:bg-white/10 hover:text-white hover:scale-110 cursor-pointer"
              title="Discord"
            >
              <AuthIcons.Discord />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
      `}</style>
    </div>
  );
}
