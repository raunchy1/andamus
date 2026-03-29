import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-br from-[#e63946] to-[#c92a37] px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <Skeleton className="h-28 w-28 rounded-full bg-white/20" />
            <div className="flex-1 text-center sm:text-left space-y-3">
              <Skeleton className="h-8 w-48 bg-white/20 mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-64 bg-white/20 mx-auto sm:mx-0" />
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
                <Skeleton className="h-8 w-28 rounded-full bg-white/20" />
                <Skeleton className="h-8 w-28 rounded-full bg-white/20" />
                <Skeleton className="h-8 w-28 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-4 py-8 max-w-5xl mx-auto">
        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-white/5 p-1">
          <Skeleton className="h-12 flex-1 rounded-lg bg-white/10" />
          <Skeleton className="h-12 flex-1 rounded-lg bg-white/10" />
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24 rounded-full bg-white/10" />
                    <Skeleton className="h-6 w-24 rounded-full bg-white/10" />
                  </div>
                  <Skeleton className="h-7 w-64 bg-white/10" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-20 bg-white/10" />
                    <Skeleton className="h-4 w-20 bg-white/10" />
                  </div>
                </div>
                <Skeleton className="h-12 w-32 bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
