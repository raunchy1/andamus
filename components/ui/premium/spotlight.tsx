"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Cursor-following spotlight — inspired by Aceternity UI.
 * Tracks pointer within its container and renders a soft radial gradient that follows the cursor.
 */
export function Spotlight({
  className,
  size = 600,
  color = "rgba(255,179,177,0.18)",
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setPos({ x, y }));
    };
    const onEnter = () => setVisible(true);
    const onLeave = () => setVisible(false);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
      style={{
        background: `radial-gradient(${size}px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 60%)`,
      }}
    />
  );
}
