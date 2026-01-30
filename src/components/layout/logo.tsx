"use client";

import React from "react";

export function SuperoctopLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
    >
      {/* 统一使用用户提供的动态 GIF Logo */}
      <img
        src="/image.gif"
        alt="SuperOctop Logo"
        className="w-full h-full object-contain mix-blend-screen"
        style={{
          // 增加亮度合发光感，使其与深色 UI 完美融合
          filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 0 15px rgba(0,242,255,0.4))',
        }}
      />
    </div>
  );
}
