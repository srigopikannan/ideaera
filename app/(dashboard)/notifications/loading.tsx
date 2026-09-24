import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPageLoading() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 lg:p-12 space-y-6 sm:space-y-10 animate-fade-in select-none">
      {/* Header HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full bg-indigo-500/50" />
            <Skeleton className="h-3 w-48 bg-white/10" />
          </div>
          <Skeleton className="h-8 sm:h-12 w-64 bg-white/10 rounded-2xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 bg-white/10 rounded-full" />
          <Skeleton className="h-8 w-24 bg-white/5 rounded-full" />
        </div>
      </div>

      {/* Signals Stream Skeleton */}
      <div className="space-y-4 max-w-4xl">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl border border-white/10 bg-[#0a0c13]/70 backdrop-blur-xl flex items-start gap-4"
          >
            <Skeleton className="h-10 w-10 rounded-2xl bg-white/10 shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3 bg-white/10" />
              <Skeleton className="h-3.5 w-3/4 bg-white/5" />
            </div>
            <Skeleton className="h-3 w-16 bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
