import { Skeleton } from "@/components/ui/skeleton";

export default function StatisticsLoading() {
  return (
    <main className="min-h-screen bg-[#1a1a2e] pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2 bg-white/10" />
          <Skeleton className="h-5 w-96 bg-white/10" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center space-y-2">
              <Skeleton className="h-12 w-12 rounded-full bg-white/10 mx-auto" />
              <Skeleton className="h-8 w-20 bg-white/10 mx-auto" />
              <Skeleton className="h-3 w-16 bg-white/10 mx-auto" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <Skeleton className="h-8 w-48 mb-6 bg-white/10" />
          <Skeleton className="h-64 w-full bg-white/5" />
        </div>

        {/* History Section Skeleton */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <Skeleton className="h-8 w-48 mb-6 bg-white/10" />
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-10 w-32 rounded-lg bg-white/10" />
            <Skeleton className="h-10 w-32 rounded-lg bg-white/10" />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Skeleton className="h-10 w-full rounded-lg bg-white/10" />
            <Skeleton className="h-10 w-full rounded-lg bg-white/10" />
            <Skeleton className="h-10 w-full rounded-lg bg-white/10" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
