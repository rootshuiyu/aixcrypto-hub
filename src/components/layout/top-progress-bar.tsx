"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 路径改变时触发加载动画
    setLoading(true);
    setProgress(30);

    const timer = setTimeout(() => {
      setProgress(100);
      const doneTimer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(doneTimer);
    }, 400);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none">
      <div 
        className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(138,43,226,0.8)]"
        style={{ width: `${progress}%` }}
      />
      {/* 光晕效果 */}
      <div 
        className="absolute right-0 top-0 h-full w-20 bg-white/20 blur-sm transition-opacity duration-300"
        style={{ opacity: progress > 0 && progress < 100 ? 1 : 0 }}
      />
    </div>
  );
}



