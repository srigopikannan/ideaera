import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardRootLoading() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 space-y-8 animate-fade-in">
      {/* Top HUD Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 bg-white/5 rounded-full" />
          <Skeleton className="h-9 w-64 bg-white/10 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 bg-white/5 rounded-xl" />
          <Skeleton className="h-9 w-32 bg-white/5 rounded-xl" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-6 rounded-3xl border border-white/10 bg-[#0a0c13]/60 backdrop-blur-xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl bg-white/10 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4 bg-white/10" />
                <Skeleton className="h-3 w-1/2 bg-white/5" />
              </div>
            </div>
            <Skeleton className="h-4 w-full bg-white/5" />
            <Skeleton className="h-4 w-4/5 bg-white/5" />
            <div className="pt-4 flex items-center justify-between border-t border-white/5">
              <Skeleton className="h-6 w-20 rounded-full bg-white/5" />
              <Skeleton className="h-8 w-24 rounded-full bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
