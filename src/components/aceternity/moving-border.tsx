"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const MovingBorder = ({
  children,
  duration = 2000,
  rx = "30%",
  ry = "30%",
  className,
  containerClassName,
  borderClassName,
  as: Component = "button",
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  as?: any;
  [key: string]: any;
}) => {
  return (
    <Component
      className={cn(
        "relative h-16 w-40 overflow-hidden bg-transparent p-[1px] text-xl",
        containerClassName
      )}
      style={{
        borderRadius: `calc(${rx} * 0.96 + 8px)`,
      }}
      {...otherProps}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${rx} * 0.96 + 8px)` }}
      >
        <Movingborder duration={duration} rx={rx} ry={ry}>
          <div
            className={cn(
              "h-20 w-20 opacity-[0.8] bg-[radial-gradient(var(--cyan-500)_40%,transparent_60%)]",
              borderClassName
            )}
          />
        </Movingborder>
      </div>

      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center border border-white/10 bg-slate-900/[0.8] text-sm text-white antialiased backdrop-blur-xl",
          className
        )}
        style={{
          borderRadius: `calc(${rx} * 0.96 + 8px)`,
        }}
      >
        {children}
      </div>
    </Component>
  );
};

const Movingborder = ({
  children,
  duration = 2000,
  rx,
  ry,
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
}) => {
  const pathRef = React.useRef<SVGRectElement>(null);

  return (
    <svg
      className="absolute h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <rect
        ref={pathRef}
        fill="none"
        width="100"
        height="100"
        rx={rx}
        ry={ry}
      />
      <motion.foreignObject
        x="0"
        y="0"
        width="100"
        height="100"
        style={{
          overflow: "visible",
        }}
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: "100%" }}
        transition={{
          duration: duration / 1000,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {children}
      </motion.foreignObject>
    </svg>
  );
};
