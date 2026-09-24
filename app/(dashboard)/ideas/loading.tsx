import { Skeleton } from "@/components/ui/skeleton";

export default function IdeasPageLoading() {
  return (
    <div className="relative w-full h-[calc(100vh-4rem)] p-4 sm:p-8 space-y-6 overflow-hidden animate-fade-in">
      {/* Top Floating Explorer Controls Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full bg-indigo-500/50" />
            <Skeleton className="h-3 w-32 bg-white/10" />
          </div>
          <Skeleton className="h-7 w-48 bg-white/10 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 bg-white/5 rounded-xl" />
          <Skeleton className="h-9 w-32 bg-white/10 rounded-xl" />
        </div>
      </div>

      {/* Category Pills Skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-28 bg-white/5 rounded-full shrink-0" />
        ))}
      </div>

      {/* Living Idea Field Canvas Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-6 rounded-3xl border border-white/10 bg-[#0a0c13]/60 backdrop-blur-xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3.5 w-1/3 bg-white/10" />
                <Skeleton className="h-3 w-1/4 bg-white/5" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full bg-white/5" />
            </div>
            <Skeleton className="h-5 w-4/5 bg-white/10" />
            <Skeleton className="h-3.5 w-full bg-white/5" />
            <Skeleton className="h-3.5 w-3/4 bg-white/5" />
            <div className="flex gap-1.5 pt-2">
              <Skeleton className="h-5 w-16 rounded-full bg-white/5" />
              <Skeleton className="h-5 w-20 rounded-full bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
