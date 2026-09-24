import { Skeleton } from "@/components/ui/skeleton";

export default function MatchPageLoading() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 lg:p-12 space-y-8 animate-fade-in">
      {/* Header HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full bg-indigo-500/50" />
            <Skeleton className="h-3 w-48 bg-white/10" />
          </div>
          <Skeleton className="h-8 sm:h-12 w-96 bg-white/10 rounded-2xl" />
        </div>
      </div>

      {/* Match Cards List */}
      <div className="space-y-6 max-w-4xl">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#0a0c13]/70 backdrop-blur-xl space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-2xl bg-white/10 shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48 bg-white/10" />
                  <Skeleton className="h-3.5 w-32 bg-white/5" />
                </div>
              </div>
              <Skeleton className="h-10 w-28 bg-white/10 rounded-full" />
            </div>

            <Skeleton className="h-4 w-full bg-white/5" />
            <Skeleton className="h-4 w-5/6 bg-white/5" />

            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 bg-white/5 rounded-full" />
              <Skeleton className="h-6 w-28 bg-white/5 rounded-full" />
              <Skeleton className="h-6 w-20 bg-white/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
