import React from "react";

type GradientTitleProps = {
  children?: React.ReactNode;
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
};

export function GradientTitle({ children, className = "", level = 2 }: GradientTitleProps) {
  const Tag = (`h${level}` as unknown) as keyof JSX.IntrinsicElements;
  return (
    <Tag className={`gradient-text font-extrabold tracking-tight ${className}`}>{children}</Tag>
  );
}

export default GradientTitle;
