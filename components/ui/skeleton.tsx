"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-white/5 rounded-lg", className)} style={style} />
  );
}

/* ── Compound skeletons for common layouts ── */

export function SkeletonText({
  lines = 1,
  className,
  lineClassName,
}: {
  lines?: number;
  className?: string;
  lineClassName?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4 w-full", i === lines - 1 && "w-3/4", lineClassName)}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      className={cn("rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonBadge({ className }: { className?: string }) {
  return (
    <Skeleton className={cn("h-6 w-20 rounded-full", className)} />
  );
}

export function SkeletonCard({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <SkeletonCard className={cn("overflow-hidden", className)}>
      <Skeleton className="h-6 w-48 mb-6" />
      <div className="h-64 w-full rounded-xl bg-white/5 relative">
        <div className="absolute bottom-0 left-0 right-0 h-full flex items-end justify-around px-4 pb-4">
          {[35, 55, 40, 70, 45, 60, 50].map((height, i) => (
            <div
              key={i}
              className="w-8 bg-white/10 rounded-t-lg"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </SkeletonCard>
  );
}

export function SkeletonRideCard({ className }: { className?: string }) {
  return (
    <SkeletonCard className={cn("animate-pulse", className)}>
      {/* Top row: date label + price */}
      <div className="flex justify-between items-start mb-4 gap-4">
        <div className="space-y-1.5 min-w-0">
          <Skeleton className="h-3 w-20 rounded bg-white/[0.06]" />
          <Skeleton className="h-8 w-16 rounded bg-white/[0.08]" />
        </div>
        <div className="text-right flex-shrink-0 space-y-1.5">
          <Skeleton className="h-6 w-16 rounded ml-auto bg-white/[0.08]" />
          <Skeleton className="h-2.5 w-12 rounded ml-auto bg-white/[0.06]" />
        </div>
      </div>

      {/* Route path indicator */}
      <div className="relative py-6 flex items-center justify-between">
        <Skeleton className="absolute left-0 right-0 h-[2px] bg-white/[0.06]" />
        <div className="relative z-10 flex flex-col items-start pr-3 max-w-[40%]">
          <Skeleton className="h-3 w-16 rounded mb-1 bg-white/[0.06]" />
          <Skeleton className="w-3 h-3 rounded-full bg-white/[0.08]" />
        </div>
        <div className="relative z-10 px-3 flex-shrink-0">
          <Skeleton className="w-5 h-5 rounded bg-white/[0.06]" />
        </div>
        <div className="relative z-10 flex flex-col items-end pl-3 max-w-[40%]">
          <Skeleton className="h-3 w-16 rounded mb-1 bg-white/[0.06]" />
          <Skeleton className="w-3 h-3 rounded-full bg-white/[0.08]" />
        </div>
      </div>

      {/* Driver info */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.04]">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0 bg-white/[0.08]" />
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-24 rounded bg-white/[0.07]" />
            <Skeleton className="h-3 w-12 rounded bg-white/[0.05]" />
          </div>
        </div>
        <Skeleton className="w-5 h-5 rounded flex-shrink-0 bg-white/[0.06]" />
      </div>
    </SkeletonCard>
  );
}

export function SkeletonProfileHeader({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-6 sm:flex-row", className)}>
      <SkeletonAvatar size={112} />
      <div className="flex-1 text-center sm:text-left space-y-3 w-full">
        <Skeleton className="h-8 w-48 mx-auto sm:mx-0" />
        <Skeleton className="h-4 w-64 mx-auto sm:mx-0" />
        <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonBadge key={i} className="h-8 w-28" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonStatsGrid({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} className="p-4">
          <Skeleton className="h-10 w-10 rounded-xl mb-3" />
          <Skeleton className="h-6 w-16 mb-1" />
          <Skeleton className="h-3 w-24" />
        </SkeletonCard>
      ))}
    </div>
  );
}
