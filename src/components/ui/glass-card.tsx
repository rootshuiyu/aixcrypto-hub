import React from "react";

type GlassCardProps = {
  children?: React.ReactNode;
  className?: string;
};

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={`glass p-6 rounded-2xl border-white/10 ${className}`}>{children}</div>
  );
}

export default GlassCard;
