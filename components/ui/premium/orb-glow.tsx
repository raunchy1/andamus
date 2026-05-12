"use client";

import { cn } from "@/lib/utils";

/**
 * Decorative animated glow orb — inspired by Magic UI's background beams.
 * Use to layer on top of dark sections for depth.
 */
export function OrbGlow({
  className,
  color = "#e63946",
  size = 480,
  blur = 120,
  opacity = 0.45,
}: {
  className?: string;
  color?: string;
  size?: number;
  blur?: number;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full will-change-transform",
        "animate-[orbFloat_14s_ease-in-out_infinite]",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity,
      }}
    />
  );
}
