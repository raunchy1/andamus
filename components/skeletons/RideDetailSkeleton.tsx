export function RideDetailSkeleton() {
  return (
    <div className="min-h-screen bg-surface animate-pulse">
      {/* Hero placeholder */}
      <div className="h-[400px] bg-surface" />

      <div className="px-5 pt-4 max-w-2xl mx-auto space-y-8">
        {/* Title */}
        <div className="space-y-3">
          <div className="h-8 w-3/4 bg-surface rounded" />
          <div className="h-4 w-1/2 bg-surface rounded" />
        </div>

        {/* Driver card */}
        <div className="bg-elevated rounded-3xl p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-surface rounded" />
            <div className="h-3 w-20 bg-surface rounded" />
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-elevated rounded-2xl" />
          <div className="h-32 bg-elevated rounded-2xl" />
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2">
          <div className="h-8 w-24 bg-surface rounded-full" />
          <div className="h-8 w-20 bg-surface rounded-full" />
          <div className="h-8 w-28 bg-surface rounded-full" />
        </div>
      </div>
    </div>
  );
}
