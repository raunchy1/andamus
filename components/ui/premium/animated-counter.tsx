"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, animate } from "framer-motion";
import { useLocale } from "next-intl";

/**
 * Number-flow style animated counter — inspired by number-flow shadcn extension.
 * Counts from 0 to `value` over `duration` ms when scrolled into view.
 *
 * Uses a motion value + direct DOM textContent updates instead of setState
 * so the animation does not trigger a React re-render every frame.
 */
export function AnimatedCounter({
  value,
  duration = 1.2,
  prefix = "",
  suffix = "",
  decimals = 0,
  locale,
  className,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  locale?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  const mv = useMotionValue(0);
  const ctxLocale = useLocale();
  const effectiveLocale = locale ?? ctxLocale ?? "it-IT";

  useEffect(() => {
    if (!inView) return;
    const fmt = new Intl.NumberFormat(effectiveLocale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    const controls = animate(mv, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) {
          ref.current.textContent = `${prefix}${fmt.format(v)}${suffix}`;
        }
      },
    });
    return () => controls.stop();
  }, [inView, value, duration, decimals, effectiveLocale, prefix, suffix, mv]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.4 }}
    >
      {`${prefix}0${suffix}`}
    </motion.span>
  );
}
