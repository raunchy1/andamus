import { Skeleton } from "@/components/ui/skeleton";

export default function PremiumLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Skeleton className="h-4 w-32 mx-auto mb-6 bg-white/[0.06]" />
          <div className="flex justify-center mb-6">
            <Skeleton className="h-16 w-16 rounded-2xl bg-white/[0.08]" />
          </div>
          <Skeleton className="h-10 w-64 mx-auto mb-4 bg-white/[0.08]" />
          <Skeleton className="h-6 w-96 mx-auto bg-white/[0.05]" />
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="relative rounded-2xl p-6 border border-white/10 bg-white/5"
            >
              <div className="mb-6 space-y-2">
                <Skeleton className="h-6 w-24 bg-white/[0.08]" />
                <Skeleton className="h-4 w-full bg-white/[0.05]" />
              </div>
              <div className="mb-6">
                <Skeleton className="h-10 w-20 bg-white/[0.08]" />
              </div>
              <div className="space-y-3 mb-6">
                {[...Array(4 + i)].map((__, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 bg-white/[0.06]" />
                    <Skeleton className="h-4 flex-1 bg-white/[0.05]" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-12 w-full rounded-xl bg-white/[0.08]" />
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded bg-white/[0.06]" />
              <Skeleton className="h-4 w-32 bg-white/[0.05]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
