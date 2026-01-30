"use client";

import { ReactNode } from "react";
import { Sidebar } from "../../components/layout/sidebar";
import { Notification } from "../../components/layout/notification";
import { SettledEffect } from "../../components/layout/settled-effect";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <Notification />
      <SettledEffect />
      {/* 侧边栏：PC端 w-60, 移动端通过全局状态控制 */}
      <Sidebar />
      
      {/* 主内容区域：
          PC端通过 ml-60 留出侧边栏空间
          移动端 ml-0，内容撑满全屏
          transition-all 确保切换流畅
      */}
      <main className="flex-1 transition-all duration-300 ml-0 lg:ml-72 min-w-0 relative overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
