import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function RequestsLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1]">
      {/* Header */}
      <div className="border-b border-white/5 px-4 py-8 lg:py-12 relative">
        <div className="mx-auto max-w-5xl relative">
          <Skeleton className="h-4 w-32 mb-4 bg-white/[0.06]" />
          <Skeleton className="h-10 lg:h-14 w-64 mb-2 bg-white/[0.08]" />
        </div>
      </div>

      {/* Search bar */}
      <div className="border-b border-white/5 bg-[#0d0d0d]/95 backdrop-blur-xl px-4 py-5 sticky top-0 z-30">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end gap-3">
            <Skeleton className="h-12 flex-1 min-w-[140px] rounded-xl bg-white/[0.05]" />
            <Skeleton className="h-12 flex-1 min-w-[140px] rounded-xl bg-white/[0.05]" />
            <Skeleton className="h-12 min-w-[140px] rounded-xl bg-white/[0.05]" />
            <Skeleton className="h-12 w-12 rounded-xl bg-white/[0.05]" />
            <Skeleton className="h-12 w-32 rounded-xl bg-white/[0.05]" />
          </div>
        </div>
      </div>

      {/* Results grid */}
      <div className="px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} className="h-full">
                <div className="space-y-4">
                  <Skeleton className="h-3 w-32 rounded bg-white/[0.06]" />
                  <Skeleton className="h-8 w-48 rounded bg-white/[0.08]" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-24 rounded-full bg-white/[0.05]" />
                    <Skeleton className="h-6 w-28 rounded-full bg-white/[0.05]" />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-8 h-8 rounded-full bg-white/[0.06]" />
                      <Skeleton className="h-4 w-24 rounded bg-white/[0.07]" />
                    </div>
                    <Skeleton className="h-5 w-5 rounded bg-white/[0.06]" />
                  </div>
                </div>
              </SkeletonCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
