import { Skeleton } from "@/components/ui/skeleton";

// Fix #5: skeleton layout now mirrors the actual RideCardSkeleton editorial
// card layout (time + price on top row, route path in the middle, driver info
// at the bottom) instead of the old avatar-name-on-top layout.
export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] pt-16 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header area */}
        <div className="mb-8">
          <Skeleton className="h-5 w-32 mb-2 bg-white/[0.06]" />
          <Skeleton className="h-9 w-24 bg-white/[0.08]" />
        </div>

        {/* Search bar skeleton */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 mb-6">
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10 w-full bg-white/[0.05]" />
            <Skeleton className="h-10 w-full bg-white/[0.05]" />
          </div>
        </div>

        {/* Filter pills skeleton */}
        <div className="flex gap-2 mb-8 overflow-hidden">
          {(["w-20", "w-16", "w-[72px]", "w-16", "w-14"] as const).map((w, i) => (
            <Skeleton key={i} className={`h-8 rounded-full flex-shrink-0 bg-white/[0.05] ${w}`} />
          ))}
        </div>

        {/* 3 ride card skeletons matching RideCardSkeleton layout */}
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-4 sm:p-6 animate-pulse">
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
