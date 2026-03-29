import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-[#1a1a2e] pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2 bg-white/10" />
          <Skeleton className="h-5 w-96 bg-white/10" />
        </div>

        {/* Search Form Skeleton */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 bg-white/10" />
              <Skeleton className="h-12 w-full bg-white/10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 bg-white/10" />
              <Skeleton className="h-12 w-full bg-white/10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 bg-white/10" />
              <Skeleton className="h-12 w-full bg-white/10" />
            </div>
            <div className="flex items-end">
              <Skeleton className="h-12 w-full bg-[#e63946]/50" />
            </div>
          </div>
        </div>

        {/* Results Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48 bg-white/10" />
            <Skeleton className="h-10 w-32 bg-white/10" />
          </div>
          
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-32 bg-white/10" />
                    <Skeleton className="h-6 w-6 rounded-full bg-white/10" />
                    <Skeleton className="h-6 w-32 bg-white/10" />
                  </div>
                  <Skeleton className="h-4 w-48 bg-white/10" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24 bg-white/10" />
                    <Skeleton className="h-4 w-24 bg-white/10" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-20 bg-white/10" />
                  <Skeleton className="h-12 w-32 bg-[#e63946]/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
