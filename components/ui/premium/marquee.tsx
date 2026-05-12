"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Infinite scrolling marquee — inspired by Magic UI.
 * Duplicates content twice for seamless loop. Pure CSS — no JS.
 */
export function Marquee({
  children,
  speed = 30,
  direction = "left",
  pauseOnHover = true,
  className,
  fade = true,
}: {
  children: ReactNode;
  speed?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
  fade?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex w-full overflow-hidden",
        fade && "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-6 pr-6 will-change-transform",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        style={{
          animation: `marquee${direction === "right" ? "Reverse" : ""} ${speed}s linear infinite`,
        }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "flex shrink-0 items-center gap-6 pr-6 will-change-transform",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        style={{
          animation: `marquee${direction === "right" ? "Reverse" : ""} ${speed}s linear infinite`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
