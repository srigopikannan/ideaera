import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPageLoading() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 lg:p-12 space-y-8 sm:space-y-12 animate-fade-in select-none">
      {/* Hero Welcome HUD */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full bg-indigo-500/50" />
          <Skeleton className="h-3 w-48 bg-white/10 rounded-full" />
        </div>
        <Skeleton className="h-10 sm:h-14 w-80 sm:w-96 bg-white/10 rounded-2xl" />
        <Skeleton className="h-4 w-full max-w-xl bg-white/5" />
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-white/10 bg-[#0a0c13]/70 backdrop-blur-xl space-y-2"
          >
            <Skeleton className="h-3 w-20 bg-white/5" />
            <Skeleton className="h-8 w-16 bg-white/15 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Idea Universe Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-40 bg-white/10" />
          <Skeleton className="h-4 w-20 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl border border-white/10 bg-[#0a0c13]/60 backdrop-blur-xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-3/4 bg-white/10" />
                  <Skeleton className="h-3 w-1/3 bg-white/5" />
                </div>
              </div>
              <Skeleton className="h-4 w-full bg-white/5" />
              <Skeleton className="h-4 w-4/5 bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
