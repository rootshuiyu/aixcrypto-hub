import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}", "./src/styles/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        midnight: "#000000",
        "midnight-2": "#050510",
        "midnight-3": "#0a0a15",
        "neon-purple": "#a855f7",
        "neon-purple-bright": "#c084fc",
        "neon-purple-dark": "#7c3aed",
        "neon-purple-light": "#e9d5ff",
        "neon-pink": "#ec4899",
        "purple-glow": "#9333ea"
      },
      boxShadow: {
        glow: "0 0 30px rgba(168, 85, 247, 0.5)",
        "glow-purple": "0 0 40px rgba(168, 85, 247, 0.6)",
        "glow-strong": "0 0 60px rgba(168, 85, 247, 0.8)",
        "glow-bright": "0 0 80px rgba(192, 132, 252, 0.7)"
      },
      animation: {
        "aurora": "aurora 60s linear infinite",
        "spotlight": "spotlight 2s ease .75s 1 forwards",
        "shimmer": "shimmer 2s linear infinite",
        "meteor": "meteor 5s linear infinite",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        aurora: {
          from: { backgroundPosition: "50% 50%, 50% 50%" },
          to: { backgroundPosition: "350% 50%, 350% 50%" },
        },
        spotlight: {
          "0%": { opacity: "0", transform: "translate(-72%, -62%) scale(0.5)" },
          "100%": { opacity: "1", transform: "translate(-50%,-40%) scale(1)" },
        },
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": { transform: "rotate(215deg) translateX(-500px)", opacity: "0" },
        },
        "border-beam": {
          "100%": { offsetDistance: "100%" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
    }
  },
  plugins: []
};

export default config;

