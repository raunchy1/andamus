"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/**
 * Animated gradient text — inspired by Magic UI.
 * Wraps children in a slowly shifting linear gradient for premium emphasis.
 */
export function GradientText({
  className,
  children,
  from = "#ffb3b1",
  via = "#e63946",
  to = "#ffb3b1",
}: {
  className?: string;
  children: ReactNode;
  from?: string;
  via?: string;
  to?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block bg-clip-text text-transparent will-change-[background-position]",
        "animate-[gradientShift_6s_ease-in-out_infinite]",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(110deg, ${from} 0%, ${via} 35%, ${to} 70%, ${via} 100%)`,
        backgroundSize: "200% 100%",
      }}
    >
      {children}
    </span>
  );
}
