import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Search Form Skeleton */}
        <div className="bg-[#1c1b1b] rounded-2xl p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
            <div className="flex items-end">
              <Skeleton className="h-12 w-full bg-[#e63946]/20" />
            </div>
          </div>
        </div>

        {/* Results Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* 5 Ride Card Skeletons */}
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-[#1c1b1b] p-4 sm:p-5 border border-white/5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="w-8 h-[2px] bg-white/10" />
                  <div className="text-center">
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
