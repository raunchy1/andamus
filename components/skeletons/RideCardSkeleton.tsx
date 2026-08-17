export function RideCardSkeleton() {
  return (
    <div className="bg-elevated rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-surface" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-surface rounded" />
          <div className="h-2 w-16 bg-surface rounded" />
        </div>
        <div className="h-6 w-12 bg-surface rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 bg-surface rounded" />
        <div className="h-3 w-1/2 bg-surface rounded" />
      </div>
    </div>
  );
}
