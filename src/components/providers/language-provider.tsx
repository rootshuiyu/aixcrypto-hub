"use client";

import { useEffect, useState } from "react";
import { useLanguageStore, languages, type LanguageCode } from "../../stores/language-store";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { currentLanguage, setLanguage } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  // 初始化：从本地存储恢复语言
  useEffect(() => {
    const saved = localStorage.getItem("language-storage") as LanguageCode;
    if (saved && languages.some(l => l.code === saved)) {
      setLanguage(saved);
    }
    setMounted(true);
  }, [setLanguage]);

  // 核心逻辑：监听语言变化，同步 HTML 属性和字体
  useEffect(() => {
    if (!mounted) return;

    const langConfig = languages.find(l => l.code === currentLanguage) || languages[1];
    
    // 1. 同步 HTML 语言标签
    document.documentElement.lang = currentLanguage;
    
    // 2. 同步全局 CSS 字体变量
    document.documentElement.style.setProperty("--current-font", langConfig.fontFamily);
    
    console.log(`🌐 语言已切换为: ${langConfig.label}, 字体同步中...`);
  }, [currentLanguage, mounted]);

  // 防止 Hydration 错误：未挂载前直接返回 children，不做额外处理
  if (!mounted) return <>{children}</>;

  return <>{children}</>;
}

