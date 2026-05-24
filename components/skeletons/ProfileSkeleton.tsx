export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-surface-container-lowest animate-pulse">
      {/* Header */}
      <div className="h-16 bg-white/5" />

      <div className="max-w-md mx-auto px-4 py-8 space-y-8">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-white/10" />
          <div className="h-6 w-40 bg-white/10 rounded" />
          <div className="h-3 w-24 bg-white/10 rounded" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
          <div className="h-24 bg-white/5 rounded-2xl" />
        </div>

        {/* Sections */}
        <div className="space-y-3">
          <div className="h-4 w-32 bg-white/10 rounded" />
          <div className="h-20 bg-white/5 rounded-xl" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-32 bg-white/10 rounded" />
          <div className="h-20 bg-white/5 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
