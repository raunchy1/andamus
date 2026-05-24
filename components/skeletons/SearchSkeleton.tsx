export function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] animate-pulse">
      {/* Header */}
      <div className="h-20 bg-white/5 border-b border-white/5" />

      <div className="px-4 max-w-2xl mx-auto py-6 space-y-6">
        {/* Search bar */}
        <div className="h-16 bg-white/5 rounded-xl" />

        {/* Filter pills */}
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-white/10 rounded-full" />
          <div className="h-9 w-24 bg-white/10 rounded-full" />
          <div className="h-9 w-16 bg-white/10 rounded-full" />
        </div>

        {/* Results count */}
        <div className="h-4 w-32 bg-white/10 rounded" />

        {/* Ride cards */}
        <div className="space-y-4">
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-32 bg-white/5 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
