export function RideDetailSkeleton() {
  return (
    <div className="min-h-screen bg-surface animate-pulse">
      {/* Hero placeholder */}
      <div className="h-[400px] bg-white/5" />

      <div className="px-5 pt-4 max-w-2xl mx-auto space-y-8">
        {/* Title */}
        <div className="space-y-3">
          <div className="h-8 w-3/4 bg-white/10 rounded" />
          <div className="h-4 w-1/2 bg-white/10 rounded" />
        </div>

        {/* Driver card */}
        <div className="bg-surface-container-high rounded-3xl p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-white/10 rounded" />
            <div className="h-3 w-20 bg-white/10 rounded" />
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-surface-container-high rounded-2xl" />
          <div className="h-32 bg-surface-container-high rounded-2xl" />
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2">
          <div className="h-8 w-24 bg-white/10 rounded-full" />
          <div className="h-8 w-20 bg-white/10 rounded-full" />
          <div className="h-8 w-28 bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
