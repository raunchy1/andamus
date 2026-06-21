"use client";

import { ComponentPropsWithoutRef, ReactNode, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface MagneticButtonProps extends Omit<ComponentPropsWithoutRef<typeof motion.button>, "ref"> {
  children: ReactNode;
  strength?: number;
  shimmer?: boolean;
}

/**
 * Magnetic button that subtly follows the cursor when hovered.
 * Magnetic effect is disabled on touch/coarse pointers and reduced-motion devices.
 */
export function MagneticButton({
  children,
  className,
  strength = 14,
  shimmer = false,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 24, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 180, damping: 24, mass: 0.5 });
  const rotateX = useTransform(sy, (v) => -v / 8);
  const rotateY = useTransform(sx, (v) => v / 8);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !reduced);
  }, []);

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left - rect.width / 2;
    const py = e.clientY - rect.top - rect.height / 2;
    x.set((px / rect.width) * strength * 2);
    y.set((py / rect.height) * strength * 2);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ x: sx, y: sy, rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={cn(
        "group relative isolate inline-flex items-center justify-center overflow-hidden rounded-xl",
        "select-none px-7 py-3.5 font-bold uppercase tracking-widest text-sm",
        "bg-[#4FB3C9] text-white shadow-[0_10px_30px_-12px_rgba(79, 179, 201,0.7)]",
        "transition-shadow hover:shadow-[0_20px_45px_-15px_rgba(79, 179, 201,0.9)]",
        "active:scale-[0.97]",
        className
      )}
      whileTap={{ scale: 0.96 }}
      {...props}
    >
      {shimmer && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            backgroundImage:
              "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.18) 45%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
          }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
