"use client";

import React from "react";

export function GlobalBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#050505] transform-gpu">
      {/* 动态章鱼背景平铺层 - 移动端缩小尺寸并降低性能开销 */}
      <div 
        className="absolute inset-0 w-full h-full opacity-[0.1] sm:opacity-[0.12]"
        style={{
          backgroundImage: 'url(/image.gif)',
          backgroundSize: '300px', // 移动端减小尺寸，桌面端 450px
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
          filter: 'grayscale(30%) brightness(0.6) contrast(1.1) blur(0.5px)',
          mixBlendMode: 'screen',
          willChange: 'transform' // 提示浏览器开启硬件加速
        }}
      />
      
      {/* 氛围渐变遮罩：增加深邃感，防止背景过于单调 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/20 via-transparent to-[#050505]/80" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#050505]/30 to-[#050505]" />
      
      {/* 动态微粒/星光效果（可选，增加层次） */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
}
