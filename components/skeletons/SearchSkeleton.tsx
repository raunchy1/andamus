export function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-surface animate-pulse">
      {/* Header */}
      <div className="h-20 bg-surface border-b border-line" />

      <div className="px-4 max-w-2xl mx-auto py-6 space-y-6">
        {/* Search bar */}
        <div className="h-16 bg-surface rounded-xl" />

        {/* Filter pills */}
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-surface rounded-full" />
          <div className="h-9 w-24 bg-surface rounded-full" />
          <div className="h-9 w-16 bg-surface rounded-full" />
        </div>

        {/* Results count */}
        <div className="h-4 w-32 bg-surface rounded" />

        {/* Ride cards */}
        <div className="space-y-4">
          <div className="h-32 bg-surface rounded-2xl" />
          <div className="h-32 bg-surface rounded-2xl" />
          <div className="h-32 bg-surface rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
