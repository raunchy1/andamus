"use client";

import { ComponentPropsWithoutRef, ReactNode, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps extends Omit<ComponentPropsWithoutRef<typeof motion.div>, "ref"> {
  children: ReactNode;
  tiltStrength?: number;
  glare?: boolean;
}

/**
 * 3D-tilt interactive card — inspired by Aceternity UI.
 * Slight perspective tilt + optional cursor glare on hover.
 */
export function TiltCard({
  children,
  className,
  tiltStrength = 8,
  glare = true,
  ...props
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const sx = useSpring(x, { stiffness: 220, damping: 22 });
  const sy = useSpring(y, { stiffness: 220, damping: 22 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [tiltStrength, -tiltStrength]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-tiltStrength, tiltStrength]);
  const glareBg = useTransform(
    [glareX, glareY] as never,
    ([gx, gy]: number[]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.12), transparent 55%)`
  );

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    x.set(px - 0.5);
    y.set(py - 0.5);
    glareX.set(px * 100);
    glareY.set(py * 100);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

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
        "hover:shadow-[0_30px_60px_-25px_rgba(230,57,70,0.45)]",
        className
      )}
      {...props}
    >
      <div style={{ transform: "translateZ(40px)" }} className="relative z-10">
        {children}
      </div>
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
