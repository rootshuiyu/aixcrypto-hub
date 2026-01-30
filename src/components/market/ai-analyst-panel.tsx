"use client";

import { useQuery } from "@tanstack/react-query";
import { api, Market, AIAnalysisResult } from "../../lib/api";
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";
import { useEffect, useState } from "react";

// 科技感图标组件库
const Icons = {
  Brain: () => (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 5c-3.5 0-6 2.5-6 6s2.5 6 6 6 6-2.5 6-6-2.5-6-6-6z" />
      <path d="M9 11h6M12 8v6" opacity="0.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" opacity="0.3" />
    </svg>
  ),
  Refresh: ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
};

interface AiAnalystPanelProps {
  market?: Market;
}

export function AiAnalystPanel({ market }: AiAnalystPanelProps) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const [isThinking, setIsThinking] = useState(false);

  const { data: aiAnalysis, refetch, isFetching } = useQuery<AIAnalysisResult>({
    queryKey: ["aiAnalysis", market?.id, currentLanguage],
    queryFn: () => api.getAiAnalysis(market?.id || "", currentLanguage),
    enabled: !!market?.id,
    refetchInterval: 60000,
  });

  const { data: aiStatus } = useQuery({
    queryKey: ["aiStatus"],
    queryFn: () => api.getAiStatus(),
  });

  useEffect(() => {
    if (isFetching) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        setIsThinking(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // 当请求完成时，立即重置 thinking 状态
      setIsThinking(false);
    }
  }, [isFetching]);

  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden group">
      <div className="flex items-center justify-between bg-white/[0.02] px-3 sm:px-5 py-2 sm:py-4 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-purple-400 group-hover:scale-110 transition-transform">
            <Icons.Brain />
          </span>
          <div className="min-w-0">
            <h3 className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-white/60">
              {t?.marketDetail?.aiSignal || 'AI SIGNAL'}
            </h3>
            <p className="text-[7px] sm:text-[9px] font-bold text-white/10 uppercase truncate">
              {aiStatus?.provider || 'AI'} · {aiStatus?.model || 'v4'}
            </p>
          </div>
        </div>
        <button onClick={() => refetch()} className="p-1.5 hover:bg-white/5 rounded transition-colors text-white/20 hover:text-white">
          <Icons.Refresh className={`h-3 w-3 sm:h-4 sm:w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-3 sm:p-5">
        <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-6">
          <div className="bg-white/[0.01] p-2 rounded-lg border border-white/5">
            <div className="flex justify-between mb-1">
              <span className="text-[7px] sm:text-[9px] font-black text-white/20 uppercase">{t.market?.confidence || 'Confidence'}</span>
              <span className="text-[9px] sm:text-xs font-black text-cyan-500">{((aiAnalysis?.confidence || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${(aiAnalysis?.confidence || 0) * 100}%` }} />
            </div>
          </div>
          <div className="bg-white/[0.01] p-2 rounded-lg border border-white/5">
            <span className="text-[7px] sm:text-[9px] font-black text-white/20 uppercase block mb-1">{t.market?.riskStatus || 'Risk Status'}</span>
            <span className="text-[9px] sm:text-xs font-black text-yellow-500 uppercase">
              {aiAnalysis?.riskLevel === 'LOW' ? t.market?.riskLow : aiAnalysis?.riskLevel === 'HIGH' ? t.market?.riskHigh : t.market?.riskMedium || 'MEDIUM'}
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-transparent opacity-30" />
          <p className="text-[10px] sm:text-[11px] leading-relaxed text-white/50 italic pl-1 font-medium">
            {isThinking ? (t.market?.thinking || "Thinking...") : (aiAnalysis?.analysis || t.market?.awaitingAnalysis || "Awaiting market analysis...")}
          </p>
        </div>

        {aiAnalysis?.recommendation && !isThinking && (
          <div className={`mt-4 sm:mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black border tracking-[0.1em] ${
            aiAnalysis.recommendation === 'LONG' ? 'border-green-500/20 text-green-500 bg-green-500/5' : 
            aiAnalysis.recommendation === 'SHORT' ? 'border-red-500/20 text-red-500 bg-red-500/5' :
            'border-yellow-500/20 text-yellow-500 bg-yellow-500/5'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {t.market?.signalDetection || 'SIGNAL_DETECTION'}: {
              aiAnalysis.recommendation === 'LONG' ? t.market?.signalLong : 
              aiAnalysis.recommendation === 'SHORT' ? t.market?.signalShort : 
              t.market?.signalHold || aiAnalysis.recommendation
            }
          </div>
        )}
      </div>
    </div>
  );
}
