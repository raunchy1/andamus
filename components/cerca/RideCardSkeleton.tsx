"use client";

import { Skeleton } from "@/components/ui/skeleton";

// Fix #5: Use explicit dark background color instead of `bg-surface`, which
// is not defined in the dark context used by the cerca page. This prevents
// the skeleton from flashing white on first render.
export function RideCardSkeleton() {
  return (
    <div className="bg-white/[0.025] border border-white/[0.06] p-4 sm:p-6 rounded-2xl animate-pulse">
      {/* Top Row: Date/Time + Price */}
      <div className="flex justify-between items-start mb-4 sm:mb-6 gap-4">
        <div className="space-y-1 min-w-0">
          <Skeleton className="h-3 w-20 sm:w-24 rounded bg-white/[0.06]" />
          <Skeleton className="h-8 sm:h-10 w-16 sm:w-20 rounded bg-white/[0.08]" />
        </div>
        <div className="text-right flex-shrink-0 space-y-1">
          <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 rounded ml-auto bg-white/[0.08]" />
          <Skeleton className="h-2.5 w-12 sm:w-16 rounded ml-auto bg-white/[0.06]" />
        </div>
      </div>

      {/* Path Indicator */}
      <div className="relative py-6 sm:py-8 flex items-center justify-between">
        <Skeleton className="absolute left-0 right-0 h-[2px] rounded bg-white/[0.06]" />
        <div className="relative z-10 flex flex-col items-start pr-2 sm:pr-4 max-w-[40%]">
          <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20 rounded mb-1 bg-white/[0.06]" />
          <Skeleton className="w-3 h-3 rounded-full bg-white/[0.08]" />
        </div>
        <div className="relative z-10 flex flex-col items-center px-2 sm:px-4 flex-shrink-0">
          <Skeleton className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-white/[0.06]" />
        </div>
        <div className="relative z-10 flex flex-col items-end pl-2 sm:pl-4 max-w-[40%]">
          <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20 rounded mb-1 bg-white/[0.06]" />
          <Skeleton className="w-3 h-3 rounded-full bg-white/[0.08]" />
        </div>
      </div>

      {/* Driver Info */}
      <div className="flex items-center justify-between mt-4 sm:mt-6 pt-4 border-t border-white/[0.04]">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0 bg-white/[0.08]" />
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-24 sm:w-32 rounded bg-white/[0.07]" />
            <Skeleton className="h-3 w-12 sm:w-16 rounded bg-white/[0.05]" />
          </div>
        </div>
        <Skeleton className="w-5 h-5 rounded flex-shrink-0 bg-white/[0.06]" />
      </div>
    </div>
  );
}
