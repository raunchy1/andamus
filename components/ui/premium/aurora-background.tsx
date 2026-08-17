"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/**
 * Premium animated aurora background — inspired by Aceternity UI.
 * Renders multiple shifting radial gradients to create a soft, lively atmosphere.
 */
export function AuroraBackground({
  className,
  children,
  showRadialMask = true,
}: {
  className?: string;
  children?: ReactNode;
  showRadialMask?: boolean;
}) {
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        style={{ contain: "layout paint" }}
      >
        <div
          className={cn(
            "absolute -inset-[10%] opacity-55 blur-[40px] will-change-transform motion-reduce:animate-none",
            "animate-[aurora_22s_linear_infinite]"
          )}
          style={{
            backgroundImage: [
              // verde bosco · terracotta · sabbia — palette Andamusu
              "radial-gradient(ellipse 60% 50% at 20% 30%, rgba(45,106,79,0.22), transparent 60%)",
              "radial-gradient(ellipse 50% 40% at 80% 20%, rgba(210,103,58,0.18), transparent 60%)",
              "radial-gradient(ellipse 70% 60% at 60% 80%, rgba(237,231,218,0.55), transparent 60%)",
            ].join(","),
          }}
        />
        {showRadialMask && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_var(--sand)_85%)]" />
        )}
      </div>
      {children}
    </div>
  );
}
