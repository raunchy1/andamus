import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Profile Header Skeleton */}
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#1e1a3e] to-[#2a1a3e] px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <Skeleton className="h-28 w-28 rounded-full" />
            <div className="flex-1 text-center sm:text-left space-y-3">
              <Skeleton className="h-8 w-48 mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-64 mx-auto sm:mx-0" />
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-28 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-5xl mx-auto">
        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <Skeleton className="h-10 w-10 rounded-xl mb-3" />
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="mb-6 flex gap-1 rounded-xl bg-white/5 p-1">
          <Skeleton className="h-12 flex-1 rounded-lg" />
          <Skeleton className="h-12 flex-1 rounded-lg" />
        </div>

        {/* List Skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#1e2a4a] border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-7 w-64" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-12 w-32 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
