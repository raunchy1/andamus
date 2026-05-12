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
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className={cn(
            "absolute -inset-[10%] opacity-60 blur-[80px] will-change-transform",
            "animate-[aurora_18s_linear_infinite]"
          )}
          style={{
            backgroundImage: [
              "radial-gradient(ellipse 60% 50% at 20% 30%, rgba(230,57,70,0.55), transparent 60%)",
              "radial-gradient(ellipse 50% 40% at 80% 20%, rgba(255,179,177,0.45), transparent 60%)",
              "radial-gradient(ellipse 70% 60% at 60% 80%, rgba(111,216,204,0.35), transparent 60%)",
              "radial-gradient(ellipse 40% 50% at 30% 70%, rgba(140,244,232,0.30), transparent 60%)",
            ].join(","),
          }}
        />
        {showRadialMask && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#0a0a0a_85%)]" />
        )}
      </div>
      {children}
    </div>
  );
}
