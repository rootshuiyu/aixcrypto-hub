"use client";

export function TechGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-15 pointer-events-none" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(168, 85, 247, 0.15)" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(168, 85, 247, 0.2)" />
            <stop offset="50%" stopColor="rgba(192, 132, 252, 0.15)" />
            <stop offset="100%" stopColor="rgba(168, 85, 247, 0.1)" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Diagonal lines for tech feel - purple only */}
        <line x1="0" y1="0" x2="1920" y2="1080" stroke="rgba(168, 85, 247, 0.08)" strokeWidth="1" />
        <line x1="1920" y1="0" x2="0" y2="1080" stroke="rgba(192, 132, 252, 0.08)" strokeWidth="1" />
        <line x1="960" y1="0" x2="960" y2="1080" stroke="rgba(168, 85, 247, 0.05)" strokeWidth="1" />
        <line x1="0" y1="540" x2="1920" y2="540" stroke="rgba(192, 132, 252, 0.05)" strokeWidth="1" />
      </svg>
    </div>
  );
}
