"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSocket } from "./socket-provider";
import { 
  LayoutDashboard, 
  Brain, 
  Settings, 
  Users, 
  Database, 
  ShieldCheck, 
  Activity,
  LogOut,
  Menu,
  X,
  Zap,
  FileCode2,
  Bell,
  Trophy,
  Swords,
  ToggleLeft
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Brain", href: "/ai-brain", icon: Brain },
  { name: "Market Ops", href: "/market-ops", icon: Activity },
  { name: "User Audit", href: "/users", icon: Users },
  { name: "Quest System", href: "/quests", icon: Zap },
  { name: "Vault Status", href: "/vault", icon: Database },
  { name: "Contracts", href: "/contracts", icon: FileCode2 },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Seasons", href: "/seasons", icon: Trophy },
  { name: "Tournaments", href: "/tournaments", icon: Swords },
  { name: "Feature Flags", href: "/feature-flags", icon: ToggleLeft },
  { name: "Global Config", href: "/global", icon: ShieldCheck },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isConnected } = useSocket();

  return (
    <div className="min-h-screen bg-background text-foreground flex font-mono">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/30 backdrop-blur-xl sticky top-0 h-screen">
        <div className="p-8 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-admin-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter uppercase italic">Super_Admin</h1>
              <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Command_Center_v1</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all group ${
                  isActive 
                    ? "bg-admin-primary text-black" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-black" : "text-admin-primary group-hover:scale-110 transition-transform"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-4">
          <div className="flex items-center justify-between px-4 py-2 bg-black/20 rounded border border-white/5">
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Socket_Link</span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse'}`} />
              <span className={`text-[8px] font-bold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-red-500 transition-colors group">
            <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            Termination_Exit
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Mobile */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-admin-primary" />
            <span className="text-xs font-black uppercase italic">Super_Admin</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-background lg:hidden flex flex-col p-6 animate-in slide-in-from-top duration-300">
            <div className="flex justify-end mb-8">
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-8 h-8" />
              </button>
            </div>
            <nav className="space-y-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 text-xl font-black uppercase italic tracking-tighter border-b border-border pb-4"
                >
                  <item.icon className="w-6 h-6 text-admin-primary" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}

        <main className="flex-1 p-6 lg:p-12 max-w-[1600px] mx-auto w-full overflow-x-hidden">
          {children}
        </main>

        <footer className="p-8 border-t border-border text-center">
          <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-[0.5em]">
            System_Status: Operational // Build: 2026.01.22 // Secure_Protocol_Active
          </p>
        </footer>
      </div>
    </div>
  );
}

