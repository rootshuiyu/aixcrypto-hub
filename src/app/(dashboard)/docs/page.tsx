"use client";

import { useLanguageStore } from "../../../stores/language-store";
import { translations } from "../../../lib/translations";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// 商务风格图标组件
const DocIcons: Record<string, React.FC<{ className?: string }>> = {
  rocket: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  chart: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  coin: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  ),
  users: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  cpu: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="16" x="4" y="4" rx="2" />
      <rect width="6" height="6" x="9" y="9" rx="1" />
      <path d="M15 2v2" />
      <path d="M15 20v2" />
      <path d="M2 15h2" />
      <path d="M2 9h2" />
      <path d="M20 15h2" />
      <path d="M20 9h2" />
      <path d="M9 2v2" />
      <path d="M9 20v2" />
    </svg>
  ),
  question: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  ),
};

// 渲染图标组件
const CategoryIcon = ({ icon }: { icon: string }) => {
  const IconComponent = DocIcons[icon];
  if (!IconComponent) return null;
  return (
    <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/20">
      <IconComponent className="w-5 h-5 text-purple-400" />
    </div>
  );
};

// Markdown 简单渲染组件
const MarkdownContent = ({ content }: { content: string }) => {
  if (!content) return null;
  const lines = content.split('\n');
  
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      {lines.map((line, index) => {
        if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold text-white mt-6 mb-4 first:mt-0">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-bold text-purple-400 mt-5 mb-3">{line.slice(4)}</h3>;
        if (line.trim()) return <p key={index} className="text-white/70 leading-relaxed my-2">{line}</p>;
        return null;
      })}
    </div>
  );
};

export default function DocsPage() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage] || translations["en"];
  const [selectedDoc, setSelectedDoc] = useState<{ title: string; content: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (!t || !t.docs) return <div className="p-20 text-center text-white/40">Loading translations...</div>;

  const categories = [
    t.docs.categories?.quickStart,
    t.docs.categories?.market,
    t.docs.categories?.points,
    t.docs.categories?.team,
    t.docs.categories?.ai,
    t.docs.categories?.faq,
  ].filter(cat => cat && cat.title); // 严格过滤，必须有 title 属性

  // 搜索过滤
  const filteredCategories = searchQuery.trim()
    ? categories.map(cat => ({
        ...cat,
        items: (cat.items || []).filter((item: any) =>
          (item.t || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.d || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.content || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.items && cat.items.length > 0)
    : categories;

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-purple-900/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8 bg-purple-500"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">{t.docs.title || "Docs"}</h1>
          <p className="mt-3 text-sm text-white/40 max-w-xl">{t.docs.desc}</p>
        </motion.div>
        
        <div className="mb-10">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus-within:border-purple-500/50 transition-colors">
            <span className="text-xl">🔍</span>
            <input
              type="text"
              placeholder={t.docs.searchPlaceholder || "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category, categoryIndex) => (
            <motion.div 
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <CategoryIcon icon={category.icon} />
                <h2 className="text-lg font-bold text-white">{category.title}</h2>
              </div>
              
              <div className="space-y-2">
                {(category.items || []).map((item: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDoc({ title: item.t, content: item.content })}
                    className="w-full text-left p-3 -mx-3 rounded-xl hover:bg-white/5 transition-colors group/item"
                  >
                    <h3 className="text-sm font-bold text-white group-hover/item:text-purple-400 transition-colors">{item.t}</h3>
                    <p className="mt-1 text-xs text-white/40 leading-relaxed">{item.d}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                <h2 className="text-xl font-bold text-white">{selectedDoc.title}</h2>
                <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <MarkdownContent content={selectedDoc.content} />
              </div>
              <div className="px-6 py-4 border-t border-white/10 bg-white/5">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-bold text-white"
                >
                  {t.docs?.close || "Close"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
