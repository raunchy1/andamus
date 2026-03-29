

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header Skeleton - Premium Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#1e1a3e] to-[#2a1a3e] px-4 py-12">
        {/* Animated background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#e63946]/10 rounded-full blur-[120px] animate-pulse" />
        
        <div className="max-w-5xl mx-auto relative">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            {/* Avatar Skeleton with shimmer ring */}
            <div className="relative">
              <div className="h-28 w-28 rounded-full bg-white/5 ring-4 ring-white/10 overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
              {/* Online indicator skeleton */}
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white/10" />
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="h-8 w-48 bg-white/10 rounded-lg overflow-hidden mx-auto sm:mx-0">
                <div className="h-full w-full animate-shimmer" />
              </div>
              <div className="h-4 w-64 bg-white/10 rounded-lg overflow-hidden mx-auto sm:mx-0">
                <div className="h-full w-full animate-shimmer" />
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-28 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-full animate-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4 overflow-hidden">
              <div className="h-10 w-10 rounded-xl bg-white/10 mb-3 overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
              <div className="h-6 w-16 bg-white/10 rounded mb-1 overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
              <div className="h-3 w-24 bg-white/10 rounded overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="mb-6 flex gap-1 rounded-xl bg-white/5 p-1">
          <div className="h-12 flex-1 rounded-lg bg-white/10 overflow-hidden">
            <div className="h-full w-full animate-shimmer" />
          </div>
          <div className="h-12 flex-1 rounded-lg bg-white/10 overflow-hidden">
            <div className="h-full w-full animate-shimmer" />
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gradient-to-br from-[#1e2a4a] to-[#1a2339] border border-white/10 rounded-2xl p-6 overflow-hidden">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-6 w-24 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-full animate-shimmer" />
                    </div>
                    <div className="h-6 w-24 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-full animate-shimmer" />
                    </div>
                  </div>
                  <div className="h-7 w-64 bg-white/10 rounded-lg overflow-hidden">
                    <div className="h-full w-full animate-shimmer" />
                  </div>
                  <div className="flex gap-4">
                    <div className="h-4 w-20 bg-white/10 rounded overflow-hidden">
                      <div className="h-full w-full animate-shimmer" />
                    </div>
                    <div className="h-4 w-20 bg-white/10 rounded overflow-hidden">
                      <div className="h-full w-full animate-shimmer" />
                    </div>
                  </div>
                </div>
                <div className="h-12 w-32 bg-white/10 rounded-xl overflow-hidden">
                  <div className="h-full w-full animate-shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
