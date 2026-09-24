import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePageLoading() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 lg:p-12 space-y-8 animate-fade-in">
      {/* Profile Hero Skeleton */}
      <div className="rounded-3xl border border-white/10 bg-[#0a0c13]/70 backdrop-blur-xl p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Skeleton className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-white/10 shrink-0" />
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <Skeleton className="h-8 w-64 bg-white/15 rounded-xl mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-40 bg-white/10 rounded-md mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-full max-w-xl bg-white/5" />
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-2">
              <Skeleton className="h-6 w-20 rounded-full bg-white/5" />
              <Skeleton className="h-6 w-24 rounded-full bg-white/5" />
              <Skeleton className="h-6 w-16 rounded-full bg-white/5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28 bg-white/10 rounded-full" />
        <Skeleton className="h-10 w-28 bg-white/5 rounded-full" />
        <Skeleton className="h-10 w-28 bg-white/5 rounded-full" />
      </div>

      {/* Section Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 rounded-3xl border border-white/10 bg-[#0a0c13]/60 backdrop-blur-xl space-y-4"
          >
            <Skeleton className="h-6 w-48 bg-white/10 rounded-lg" />
            <Skeleton className="h-4 w-full bg-white/5" />
            <Skeleton className="h-4 w-3/4 bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
