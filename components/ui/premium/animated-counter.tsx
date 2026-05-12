"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { useLocale } from "next-intl";

/**
 * Number-flow style animated counter — inspired by number-flow shadcn extension.
 * Counts from 0 to `value` over `duration` ms when scrolled into view.
 */
export function AnimatedCounter({
  value,
  duration = 1.4,
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
  const [display, setDisplay] = useState("0");
  const ctxLocale = useLocale();
  const effectiveLocale = locale ?? ctxLocale ?? "it-IT";

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        setDisplay(
          v.toLocaleString(effectiveLocale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        );
      },
    });
    return () => controls.stop();
  }, [inView, value, duration, decimals, effectiveLocale]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5 }}
    >
      {prefix}
      {display}
      {suffix}
    </motion.span>
  );
}
