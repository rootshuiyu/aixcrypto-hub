"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Skeleton } from "../ui/skeleton";
import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";

interface AIStatus {
  provider: string;
  model: string;
  hasApiKey: boolean;
  hasFallback: boolean;
  fallbackProvider: string | null;
}

// 骨架屏组件
function AiConsoleSkeleton() {
  return (
    <div className="glass rounded-3xl p-8">
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-7 w-48 mb-6" />
      
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <Skeleton className="h-3 w-16 mb-3" />
        <Skeleton className="h-4 w-40 mb-2" />
        <Skeleton className="h-3 w-56 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 rounded-2xl border border-white/10 p-4">
        <Skeleton className="h-3 w-16 mb-3" />
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}

export function AiConsole() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const ac = t.aiConsole || {};
  const insightSteps = ac.insightSteps || [
    "Fetching on-chain signals",
    "Merging Twitter / Discord sentiment",
    "Outputting S1 Arena AI score",
    "Generating strategy & risk alerts"
  ];

  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  useEffect(() => {
    const fetchAiStatus = async () => {
      try {
        setLoading(true);
        const data = await api.getAiStatus();
        setAiStatus(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch AI status:", err);
        setError("errorConnecting");
      } finally {
        setLoading(false);
      }
    };

    fetchAiStatus();
    const statusInterval = setInterval(fetchAiStatus, 60000);
    return () => clearInterval(statusInterval);
  }, []);

  useEffect(() => {
    if (!aiStatus?.hasApiKey) {
      setSuggestion(null);
      return;
    }
    let cancelled = false;
    setSuggestionLoading(true);
    api
      .getLandingSuggestion(currentLanguage, true)
      .then((res) => {
        if (!cancelled) setSuggestion(res.suggestion);
      })
      .catch(() => {
        if (!cancelled) setSuggestion(null);
      })
      .finally(() => {
        if (!cancelled) setSuggestionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [aiStatus?.hasApiKey, currentLanguage]);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % insightSteps.length);
    }, 2000);
    return () => clearInterval(stepInterval);
  }, [insightSteps.length]);

  // Loading 骨架屏
  if (loading && !aiStatus) {
    return <AiConsoleSkeleton />;
  }

  const isOnline = aiStatus?.hasApiKey ?? false;
  const providerName = aiStatus?.provider || "AI Engine";
  const modelName = aiStatus?.model || "Unknown";

  const statusText = isOnline
    ? `${providerName} | ${ac.riskNeutral ?? "Risk: Neutral"}`
    : (ac.quantEngine ?? "Quant Engine | Local Analysis");

  const confidenceText = isOnline
    ? `${ac.confidenceLabel ?? "Model: "}${modelName}${ac.confidenceSuffix ?? " · Confidence 92.4%"}`
    : (ac.confidenceLocal ?? "Technical indicators · Confidence 75%");

  const suggestionText =
    isOnline && suggestion
      ? suggestion
      : isOnline && suggestionLoading
        ? (ac.suggestionGenerating ?? "Generating suggestion...")
        : (ac.fallbackSuggestion ?? "Based on RSI/MACD, trend neutral to slightly bullish.");

  return (
    <div className="glass rounded-3xl p-8">
      <p className="text-sm text-white/50">{ac.title ?? "AI Signal Console"}</p>
      <h3 className="mt-2 text-2xl font-semibold">{ac.subtitle ?? "Real-time Model Stream"}</h3>

      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
        <span className="text-white/50">
          {isOnline ? (ac.aiOnline ?? "AI Online") : (ac.localMode ?? "Local Mode")}
          {aiStatus?.hasFallback && `${ac.fallbackPrefix ?? " · Fallback: "}${aiStatus.fallbackProvider}`}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
        <p className="text-xs uppercase tracking-[0.2em] text-neon-purple/80 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-purple animate-pulse" />
          {ac.streamLabel ?? "Stream"}
        </p>
        <p className="mt-3">{statusText}</p>
        <p className="mt-2 text-white/50">{confidenceText}</p>

        <div className="mt-4 space-y-2 text-xs">
          {insightSteps.map((step: string, index: number) => (
            <div
              key={`${index}-${step.slice(0, 12)}`}
              className={`flex items-center gap-2 transition-all duration-300 ${
                index === currentStep ? "text-white" : "text-white/40"
              }`}
            >
              <span className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === currentStep ? "bg-neon-purple scale-125" : "bg-white/20"
              }`} />
              <span>{step}</span>
              {index === currentStep && (
                <span className="ml-auto text-neon-purple animate-pulse">{ac.processing ?? "Processing..."}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 p-4 text-sm text-white/70">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-cyan-400" : "bg-yellow-400"}`} />
          {isOnline ? (ac.aiSuggestion ?? "AI Suggestion") : (ac.quantSuggestion ?? "Quant Suggestion")}
        </p>
        <p className="mt-3 text-base font-semibold text-white">{suggestionText}</p>
        <p className="mt-2 text-xs text-white/40">{ac.disclaimer ?? "For reference only. Invest at your own risk."}</p>
      </div>

      {error && (
        <div className="mt-4 text-xs text-yellow-400/60 text-center">{ac.errorConnecting ?? "Connecting to AI..."}</div>
      )}
    </div>
  );
}
