"use client";

import React, { useId, useMemo } from "react";
import { motion } from "framer-motion";

interface SparklesCoreProps {
  id?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  className?: string;
  particleColor?: string;
}

export const SparklesCore = ({
  id,
  background = "transparent",
  minSize = 0.4,
  maxSize = 1,
  particleDensity = 100,
  className,
  particleColor = "#FFF",
}: SparklesCoreProps) => {
  const generatedId = useId();
  const particleId = id || generatedId;

  const particles = useMemo(() => {
    return Array.from({ length: particleDensity }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * (maxSize - minSize) + minSize,
      duration: Math.random() * 2 + 1,
      delay: Math.random() * 2,
    }));
  }, [particleDensity, minSize, maxSize]);

  return (
    <div
      className={className}
      style={{
        background,
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      {particles.map((particle) => (
        <motion.span
          key={`${particleId}-${particle.id}`}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size * 4}px`,
            height: `${particle.size * 4}px`,
            borderRadius: "50%",
            background: particleColor,
            boxShadow: `0 0 ${particle.size * 6}px ${particleColor}`,
          }}
        />
      ))}
    </div>
  );
};

interface SparklesProps {
  children?: React.ReactNode;
  className?: string;
  particleColor?: string;
  particleDensity?: number;
}

export const Sparkles = ({
  children,
  className,
  particleColor = "#06b6d4",
  particleDensity = 50,
}: SparklesProps) => {
  return (
    <div className={`relative ${className}`}>
      <SparklesCore
        particleColor={particleColor}
        particleDensity={particleDensity}
        className="absolute inset-0 z-0"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
