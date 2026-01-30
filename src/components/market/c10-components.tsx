"use client";

import { useLanguageStore } from "../../stores/language-store";
import { translations } from "../../lib/translations";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useEffect, useState } from "react";
import { useSocket } from "../providers/socket-provider";

// 科技感图标组件库
const Icons = {
  Crypto: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8h4a2 2 0 1 1 0 4H9m0 0h5a2 2 0 1 1 0 4H9m3-10v2m0 8v2" opacity="0.5" />
    </svg>
  ),
  Gold: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 17h20L19 7H5L2 17z" />
      <path d="M12 7v10" opacity="0.3" />
      <path d="M7 12h10" opacity="0.3" />
    </svg>
  )
};

interface MarketComponent {
  symbol: string;
  name: string;
  weight: number;
  price: number;
  change24h: number;
}

export function C10Components({ activeTab = 'C10' }: { activeTab?: 'C10' | 'GOLD' }) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const { socket } = useSocket();
  const [realtimeComponents, setRealtimeComponents] = useState<MarketComponent[]>([]);

  const { data: initialData } = useQuery({
    queryKey: ["indexComponents", activeTab],
    queryFn: activeTab === 'GOLD' ? api.getGoldComponents : api.getIndexComponents,
    refetchInterval: 60000,
    staleTime: 30000, // 优化：添加 staleTime 减少重复请求
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (socket) {
      // 优化：添加节流处理，最多每秒更新一次
      let lastUpdateTime = 0;
      const THROTTLE_MS = 1000;
      
      const handleUpdate = (data: any) => {
        const now = Date.now();
        if (now - lastUpdateTime >= THROTTLE_MS) {
          lastUpdateTime = now;
          const key = activeTab === 'GOLD' ? 'gold' : 'c10';
          if (data[key]?.components) setRealtimeComponents(data[key].components);
        }
      };
      socket.on('indexUpdate', handleUpdate);
      return () => {
        socket.off('indexUpdate', handleUpdate);
      };
    }
  }, [socket, activeTab]);

  const displayData = realtimeComponents.length > 0 ? realtimeComponents : (initialData || []);

  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-3 sm:p-6 w-full min-w-0 group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className={activeTab === 'GOLD' ? 'text-yellow-500' : 'text-purple-400'}>
            {activeTab === 'GOLD' ? <Icons.Gold /> : <Icons.Crypto />}
          </span>
          <h3 className="text-[10px] font-black uppercase text-white/60 tracking-widest truncate">
            {activeTab === 'GOLD' ? 'GOLD_COMP' : t.market.composition}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
          <span className="text-[8px] font-bold text-green-500/60 uppercase flex-shrink-0">LIVE_FEED</span>
        </div>
      </div>

      <div className="space-y-1.5 w-full">
        {/* 表头 */}
        <div className="flex items-center px-1 text-[7px] font-black text-white/10 uppercase mb-2 tracking-widest">
          <div className="w-[8%]">#</div>
          <div className="w-[35%]">ASSET_IDENT</div>
          <div className="w-[12%] text-center">WEIGHT</div>
          <div className="w-[25%] text-right">UNIT_PRICE</div>
          <div className="w-[20%] text-right">24H_VOL</div>
        </div>

        {displayData.map((item: MarketComponent, i: number) => {
          const weight = typeof item?.weight === 'number' ? item.weight : 0;
          const price = typeof item?.price === 'number' ? item.price : 0;
          const change24h = typeof item?.change24h === 'number' ? item.change24h : 0;
          return (
          <div key={item.symbol} className="flex items-center bg-white/[0.01] hover:bg-white/[0.03] rounded-lg p-2 border border-white/5 w-full min-w-0 transition-colors">
            <div className="w-[8%] text-[8px] font-mono text-white/20">{i + 1}</div>
            <div className="w-[35%] flex items-center gap-2 min-w-0">
              <div className={`h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full border transition-all overflow-hidden bg-white/5 ${
                activeTab === 'GOLD' 
                ? 'border-yellow-500/20' 
                : 'border-purple-500/20'
              }`}>
                <img 
                  src={activeTab === 'GOLD' 
                    ? item.symbol === 'XAU/USD' 
                      ? 'https://www.gold.org/sites/default/files/gold_bar_icon.png' 
                      : `https://static.okx.com/cdn/assets/imgs/247/66BAED6BDE69C174.png` // 统一使用黄金标识
                    : `https://assets.coincap.io/assets/icons/${item.symbol.toLowerCase()}@2x.png`
                  }
                  alt={item.symbol}
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    // 如果图片加载失败，显示彩色渐变背景+首字母
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    // 🆕 修复：添加空值检查，避免 null 引用错误
                    if (!parent) {
                      console.warn('⚠️ Parent element not found for image error handler');
                      return;
                    }
                    target.style.display = 'none';
                    parent.classList.add(activeTab === 'GOLD' ? 'bg-gradient-to-br' : 'bg-gradient-to-tr');
                    parent.classList.add(activeTab === 'GOLD' ? 'from-yellow-600/40' : 'from-purple-600/40');
                    parent.classList.add(activeTab === 'GOLD' ? 'to-orange-600/40' : 'to-pink-600/40');
                    parent.innerHTML = `<span class="text-[9px] font-black text-white">${item.symbol[0] || '?'}</span>`;
                  }}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black text-white truncate leading-tight">{item.symbol}</span>
                <span className="text-[7px] font-bold text-white/20 uppercase truncate tracking-tighter">{item.name}</span>
              </div>
            </div>
            <div className="w-[12%] text-center">
              <span className="text-[8px] font-mono text-white/30">{weight.toFixed(0)}%</span>
              <div className="w-full h-[1px] bg-white/5 mt-1 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${activeTab === 'GOLD' ? 'bg-yellow-500/40' : 'bg-purple-500/40'}`} 
                  style={{ width: `${weight}%` }} 
                />
              </div>
            </div>
            <div className="w-[25%] text-right text-[10px] font-mono font-bold text-white/80 truncate">
              {price > 1000 ? Math.floor(price).toLocaleString() : price.toFixed(2)}
            </div>
            <div className={`w-[20%] text-right text-[9px] font-mono font-bold flex-shrink-0 ${change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
              <span className="flex items-center justify-end gap-0.5">
                {change24h >= 0 ? "▲" : "▼"}
                {Math.abs(change24h).toFixed(1)}%
              </span>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
