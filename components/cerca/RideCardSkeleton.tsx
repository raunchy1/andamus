"use client";

import { motion } from "framer-motion";

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-white/[0.04] shimmer ${className || ""}`}
    />
  );
}

export function RideCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/[0.06] bg-[#111111] p-4 sm:p-6"
      style={{
        boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      {/* Top Row: Date/Time + Price */}
      <div className="flex justify-between items-start mb-4 sm:mb-6 gap-4">
        <div className="space-y-2 min-w-0">
          <SkeletonLine className="h-3 w-20 sm:w-24" />
          <SkeletonLine className="h-8 sm:h-10 w-16 sm:w-20" />
        </div>
        <div className="text-right flex-shrink-0 space-y-2">
          <SkeletonLine className="h-6 sm:h-8 w-16 sm:w-20 ml-auto" />
          <SkeletonLine className="h-2.5 w-12 sm:w-16 ml-auto" />
        </div>
      </div>

      {/* Path Indicator */}
      <div className="relative py-6 sm:py-8 flex items-center justify-between">
        <div className="absolute left-0 right-0 h-[2px] rounded bg-white/[0.04]" />
        <div className="relative z-10 flex flex-col items-start pr-2 sm:pr-4 max-w-[40%]">
          <SkeletonLine className="h-2.5 sm:h-3 w-16 sm:w-20 mb-1" />
          <div className="w-3 h-3 rounded-full bg-white/[0.06]" />
        </div>
        <div className="relative z-10 flex flex-col items-center px-2 sm:px-4 flex-shrink-0">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-white/[0.04]" />
        </div>
        <div className="relative z-10 flex flex-col items-end pl-2 sm:pl-4 max-w-[40%]">
          <SkeletonLine className="h-2.5 sm:h-3 w-16 sm:w-20 mb-1" />
          <div className="w-3 h-3 rounded-full bg-white/[0.06]" />
        </div>
      </div>

      {/* Driver Info */}
      <div className="flex items-center justify-between mt-4 sm:mt-6 pt-4 border-t border-white/[0.04]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/[0.06] flex-shrink-0" />
          <div className="min-w-0 space-y-1.5">
            <SkeletonLine className="h-4 w-24 sm:w-32" />
            <SkeletonLine className="h-3 w-12 sm:w-16" />
          </div>
        </div>
        <div className="w-5 h-5 rounded bg-white/[0.04] flex-shrink-0" />
      </div>
    </motion.div>
  );
}
