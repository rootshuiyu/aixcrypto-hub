"use client";

import { HomeHero } from "@/components/marketing/home-hero";
import { StatGrid } from "@/components/marketing/stat-grid";
import { MarketPreview } from "@/components/marketing/market-preview";
import { AiConsole } from "@/components/marketing/ai-console";
import { useLanguageStore } from "@/stores/language-store";
import { translations } from "@/lib/translations";
import Link from "next/link";

export default function HomePage() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 内容层 */}
      <div className="relative z-10 w-full">
        {/* Hero Section */}
        <div className="flex min-h-[60vh] items-center justify-center py-8 sm:py-12">
          <HomeHero />
        </div>

        {/* Stats Grid Section */}
        <div className="px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8 text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight uppercase text-white mb-2">
                {t.home?.statsTitle ?? "S1 Arena 数据概览"}
              </h2>
              <p className="text-sm sm:text-base text-white/50">
                {t.home?.statsDesc ?? "实时追踪平台核心指标"}
              </p>
            </div>
            <StatGrid />
          </div>
        </div>

        {/* Market Preview & AI Console Section */}
        <div className="px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 sm:gap-8">
              <MarketPreview />
              <AiConsole />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-cyan-500/10 to-purple-500/10 p-8 sm:p-12 text-center backdrop-blur-sm">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase text-white mb-4">
                {t.home?.ctaTitle ?? "加入 S1 Arena"}
              </h3>
              <p className="text-sm sm:text-base text-white/70 mb-8 max-w-2xl mx-auto">
                {t.home?.ctaDesc ?? "连接钱包，开始您的预测市场之旅。AI 驱动的策略分析，实时市场洞察，让每一次预测都更有把握。"}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/market"
                  className="rounded-xl bg-white px-8 py-4 text-sm font-bold text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] uppercase tracking-widest"
                >
                  {t.home?.enterArena ?? "进入预测市场"}
                </Link>
                <Link
                  href="/playground"
                  className="rounded-xl border-2 border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/30 uppercase tracking-widest"
                >
                  {t.home?.tryPlayground ?? "体验 AI 操场"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
