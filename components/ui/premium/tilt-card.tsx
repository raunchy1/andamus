"use client";

import { ComponentPropsWithoutRef, ReactNode, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps extends Omit<ComponentPropsWithoutRef<typeof motion.div>, "ref"> {
  children: ReactNode;
  tiltStrength?: number;
  glare?: boolean;
}

/**
 * 3D-tilt interactive card.
 * Disabled on touch/coarse-pointer devices and when prefers-reduced-motion is set
 * (the springs + perspective do nothing useful there but still cost paint work).
 */
export function TiltCard({
  children,
  className,
  tiltStrength = 6,
  glare = false,
  ...props
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const sx = useSpring(x, { stiffness: 180, damping: 26, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 180, damping: 26, mass: 0.6 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [tiltStrength, -tiltStrength]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-tiltStrength, tiltStrength]);
  const glareBg = useTransform(
    [glareX, glareY] as never,
    ([gx, gy]: number[]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.12), transparent 55%)`
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !reduced);
  }, []);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    x.set(px - 0.5);
    y.set(py - 0.5);
    if (glare) {
      glareX.set(px * 100);
      glareY.set(py * 100);
    }
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (!enabled) {
    return (
      <div
        className={cn(
          "group relative isolate overflow-hidden rounded-2xl",
          className
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 1000,
      }}
      className={cn(
        "group relative isolate overflow-hidden rounded-2xl transition-shadow",
        "hover:shadow-[0_30px_60px_-25px_rgba(79, 179, 201,0.45)]",
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
      {glare && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glareBg }}
        />
      )}
    </motion.div>
  );
}
