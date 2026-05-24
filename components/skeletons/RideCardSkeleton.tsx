export function RideCardSkeleton() {
  return (
    <div className="bg-surface-container-high rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-white/10 rounded" />
          <div className="h-2 w-16 bg-white/10 rounded" />
        </div>
        <div className="h-6 w-12 bg-white/10 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 bg-white/10 rounded" />
        <div className="h-3 w-1/2 bg-white/10 rounded" />
      </div>
    </div>
  );
}
