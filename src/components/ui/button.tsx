import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  solid: "bg-neon-purple text-white hover:shadow-glow-purple",
  outline: "border border-white/20 text-white/80 hover:text-white",
  ghost: "bg-white/10 text-white/70 hover:text-white"
};

export function Button({ className = "", variant = "solid", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-full px-5 py-2 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

