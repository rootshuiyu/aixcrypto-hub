"use client";

export function MarketTabs({
  activeTab,
  onChange,
}: {
  activeTab: "C10" | "GOLD";
  onChange: (tab: "C10" | "GOLD") => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
        <button
          type="button"
          onClick={() => onChange("C10")}
          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition ${
            activeTab === "C10"
              ? "bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]"
              : "text-white/40 hover:text-white"
          }`}
        >
          C10
        </button>
        <button
          type="button"
          onClick={() => onChange("GOLD")}
          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition ${
            activeTab === "GOLD"
              ? "bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.25)]"
              : "text-white/40 hover:text-white"
          }`}
        >
          GOLD
        </button>
      </div>
    </div>
  );
}









