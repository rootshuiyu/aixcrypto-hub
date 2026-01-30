export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-4">
        {/* 科技感加载动画 */}
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <div className="absolute inset-0 rounded-full border-t-2 border-neon-purple-bright animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-white/5" />
          <div className="absolute inset-2 rounded-full border-b-2 border-cyan-400 animate-spin-reverse" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 animate-pulse">
          Initializing Terminal...
        </p>
      </div>
    </div>
  );
}
