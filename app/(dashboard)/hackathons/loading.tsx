import { Skeleton } from "@/components/ui/skeleton";

export default function HackathonsPageLoading() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 lg:p-12 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full bg-indigo-500/50" />
            <Skeleton className="h-3 w-40 bg-white/10" />
          </div>
          <Skeleton className="h-8 sm:h-12 w-80 bg-white/10 rounded-2xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 bg-white/5 rounded-full" />
          <Skeleton className="h-9 w-32 bg-white/10 rounded-full" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-24 bg-white/5 rounded-full shrink-0" />
        ))}
      </div>

      {/* Hackathons Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-white/10 bg-[#0a0c13]/70 backdrop-blur-xl overflow-hidden space-y-4 p-5"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-24 bg-white/10 rounded-full" />
              <Skeleton className="h-4 w-20 bg-white/5" />
            </div>
            <Skeleton className="h-6 w-3/4 bg-white/10 rounded-lg" />
            <Skeleton className="h-3.5 w-full bg-white/5" />
            <Skeleton className="h-3.5 w-2/3 bg-white/5" />
            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
              <Skeleton className="h-4 w-28 bg-white/5" />
              <Skeleton className="h-9 w-28 bg-white/10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
