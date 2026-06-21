"use client";

import { cn } from "@/lib/utils";

/**
 * Decorative animated glow orb — inspired by Magic UI's background beams.
 * Use to layer on top of dark sections for depth.
 */
export function OrbGlow({
  className,
  color = "#4FB3C9",
  size = 360,
  blur = 60,
  opacity = 0.45,
}: {
  className?: string;
  color?: string;
  size?: number;
  blur?: number;
  opacity?: number;
}) {
  // Cap blur to keep GPU cost bounded; blur cost scales quadratically with radius.
  const cappedBlur = Math.min(blur, 80);
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full will-change-transform motion-reduce:animate-none",
        "animate-[orbFloat_14s_ease-in-out_infinite]",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${cappedBlur}px)`,
        opacity,
        contain: "layout paint",
      }}
    />
  );
}
