

export default function StatisticsLoading() {
  return (
    <main className="min-h-screen bg-[#1a1a2e] pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-10 w-64 mb-2 bg-white/10 rounded-lg overflow-hidden">
            <div className="h-full w-full animate-shimmer" />
          </div>
          <div className="h-5 w-96 bg-white/10 rounded-lg overflow-hidden">
            <div className="h-full w-full animate-shimmer" />
          </div>
        </div>

        {/* Stats Grid Skeleton - Premium Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass rounded-xl p-4 text-center space-y-2 overflow-hidden">
              <div className="h-12 w-12 rounded-full bg-white/10 mx-auto overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
              <div className="h-8 w-20 bg-white/10 mx-auto rounded overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
              <div className="h-3 w-16 bg-white/10 mx-auto rounded overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="glass rounded-2xl p-6 mb-8 overflow-hidden">
          <div className="h-8 w-48 mb-6 bg-white/10 rounded-lg overflow-hidden">
            <div className="h-full w-full animate-shimmer" />
          </div>
          <div className="h-64 w-full bg-white/5 rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 animate-shimmer" />
            {/* Chart bars placeholder */}
            <div className="absolute bottom-0 left-0 right-0 h-full flex items-end justify-around px-4 pb-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div 
                  key={i} 
                  className="w-8 bg-white/10 rounded-t-lg"
                  style={{ height: `${20 + Math.random() * 60}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* History Section Skeleton */}
        <div className="glass rounded-2xl p-6 overflow-hidden">
          <div className="h-8 w-48 mb-6 bg-white/10 rounded-lg overflow-hidden">
            <div className="h-full w-full animate-shimmer" />
          </div>
          <div className="flex gap-2 mb-6">
            <div className="h-10 w-32 rounded-lg bg-white/10 overflow-hidden">
              <div className="h-full w-full animate-shimmer" />
            </div>
            <div className="h-10 w-32 rounded-lg bg-white/10 overflow-hidden">
              <div className="h-full w-full animate-shimmer" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="h-10 w-full rounded-lg bg-white/10 overflow-hidden">
              <div className="h-full w-full animate-shimmer" />
            </div>
            <div className="h-10 w-full rounded-lg bg-white/10 overflow-hidden">
              <div className="h-full w-full animate-shimmer" />
            </div>
            <div className="h-10 w-full rounded-lg bg-white/10 overflow-hidden">
              <div className="h-full w-full animate-shimmer" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 w-full rounded-xl bg-white/5 overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
