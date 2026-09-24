import { Skeleton } from "@/components/ui/skeleton";

export default function ConnectionsPageLoading() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 lg:p-12 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full bg-indigo-500/50" />
          <Skeleton className="h-3 w-40 bg-white/10" />
        </div>
        <Skeleton className="h-8 sm:h-12 w-72 bg-white/10 rounded-2xl" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 bg-white/10 rounded-full" />
        <Skeleton className="h-9 w-28 bg-white/5 rounded-full" />
        <Skeleton className="h-9 w-28 bg-white/5 rounded-full" />
      </div>

      {/* User cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-6 rounded-3xl border border-white/10 bg-[#0a0c13]/70 backdrop-blur-xl space-y-4"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-2xl bg-white/10 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4 bg-white/10" />
                <Skeleton className="h-3 w-1/2 bg-white/5" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-full bg-white/5" />
            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
              <Skeleton className="h-7 w-20 rounded-full bg-white/5" />
              <Skeleton className="h-8 w-24 rounded-full bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
