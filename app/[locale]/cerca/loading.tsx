

export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-[#1a1a2e] pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-8 reveal">
          <div className="h-10 w-64 mb-2 bg-white/10 rounded-lg overflow-hidden">
            <div className="h-full w-full animate-shimmer" />
          </div>
          <div className="h-5 w-96 bg-white/10 rounded-lg overflow-hidden">
            <div className="h-full w-full animate-shimmer" />
          </div>
        </div>

        {/* Search Form Skeleton - Glass Effect */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-white/10 rounded overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
              <div className="h-12 w-full bg-white/10 rounded-xl overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-white/10 rounded overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
              <div className="h-12 w-full bg-white/10 rounded-xl overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-white/10 rounded overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
              <div className="h-12 w-full bg-white/10 rounded-xl overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
            </div>
            <div className="flex items-end">
              <div className="h-12 w-full bg-[#e63946]/30 rounded-xl overflow-hidden">
                <div className="h-full w-full animate-shimmer" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-48 bg-white/10 rounded-lg overflow-hidden">
              <div className="h-full w-full animate-shimmer" />
            </div>
            <div className="h-10 w-32 bg-white/10 rounded-lg overflow-hidden">
              <div className="h-full w-full animate-shimmer" />
            </div>
          </div>
          
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-lift bg-gradient-to-br from-[#1e2a4a] to-[#1a2339] border border-white/10 rounded-2xl p-6 overflow-hidden">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-32 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-full animate-shimmer" />
                    </div>
                    <div className="h-6 w-6 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-full animate-shimmer" />
                    </div>
                    <div className="h-6 w-32 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-full animate-shimmer" />
                    </div>
                  </div>
                  <div className="h-4 w-48 bg-white/10 rounded overflow-hidden">
                    <div className="h-full w-full animate-shimmer" />
                  </div>
                  <div className="flex gap-4">
                    <div className="h-4 w-24 bg-white/10 rounded overflow-hidden">
                      <div className="h-full w-full animate-shimmer" />
                    </div>
                    <div className="h-4 w-24 bg-white/10 rounded overflow-hidden">
                      <div className="h-full w-full animate-shimmer" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-20 bg-white/10 rounded-xl overflow-hidden">
                    <div className="h-full w-full animate-shimmer" />
                  </div>
                  <div className="h-12 w-32 bg-[#e63946]/30 rounded-xl overflow-hidden">
                    <div className="h-full w-full animate-shimmer" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
