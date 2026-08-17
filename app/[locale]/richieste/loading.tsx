import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function RequestsLoading() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Header */}
      <div className="border-b border-line px-4 py-8 lg:py-12 relative">
        <div className="mx-auto max-w-5xl relative">
          <Skeleton className="h-4 w-32 mb-4 bg-surface" />
          <Skeleton className="h-10 lg:h-14 w-64 mb-2 bg-surface" />
        </div>
      </div>

      {/* Search bar */}
      <div className="border-b border-line bg-surface/95 backdrop-blur-xl px-4 py-5 sticky top-0 z-30">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end gap-3">
            <Skeleton className="h-12 flex-1 min-w-[140px] rounded-xl bg-surface" />
            <Skeleton className="h-12 flex-1 min-w-[140px] rounded-xl bg-surface" />
            <Skeleton className="h-12 min-w-[140px] rounded-xl bg-surface" />
            <Skeleton className="h-12 w-12 rounded-xl bg-surface" />
            <Skeleton className="h-12 w-32 rounded-xl bg-surface" />
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
                  <Skeleton className="h-3 w-32 rounded bg-surface" />
                  <Skeleton className="h-8 w-48 rounded bg-surface" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-24 rounded-full bg-surface" />
                    <Skeleton className="h-6 w-28 rounded-full bg-surface" />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-line">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-8 h-8 rounded-full bg-surface" />
                      <Skeleton className="h-4 w-24 rounded bg-surface" />
                    </div>
                    <Skeleton className="h-5 w-5 rounded bg-surface" />
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
