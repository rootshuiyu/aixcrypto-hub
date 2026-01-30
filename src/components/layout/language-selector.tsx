"use client";

import { useState } from "react";
import { useLanguageStore, languages } from "../../stores/language-store";

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, setLanguage } = useLanguageStore();

  const activeLang = languages.find(l => l.code === currentLanguage) || languages[1];

  return (
    <div className="relative">
      {/* 当前选择的语言按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 rounded-lg border border-white/20 bg-black/50 px-1.5 py-1.5 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 text-[10px] sm:text-xs lg:text-sm text-white/80 transition hover:border-neon-purple/50 hover:text-white"
      >
        <span className="text-sm sm:text-base">{activeLang.flag}</span>
        <span className="hidden sm:inline">{activeLang.label}</span>
        <svg
          className={`h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl border border-neon-purple/30 bg-black/95 backdrop-blur-xl shadow-glow-purple overflow-hidden">
            <div className="p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                    currentLanguage === lang.code
                      ? "bg-neon-purple/20 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="flex-1">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
