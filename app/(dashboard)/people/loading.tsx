import { Skeleton } from "@/components/ui/skeleton";

export default function PeoplePageLoading() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-40 bg-white/5 rounded-full" />
        <Skeleton className="h-8 sm:h-10 w-72 bg-white/10 rounded-xl" />
        <Skeleton className="h-4 w-96 max-w-full bg-white/5" />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-11 flex-1 bg-white/5 rounded-2xl" />
        <Skeleton className="h-11 w-36 bg-white/5 rounded-2xl" />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-8 w-24 bg-white/5 rounded-full shrink-0" />
        ))}
      </div>

      {/* People Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-6 rounded-3xl border border-white/10 bg-[#0a0c13]/70 backdrop-blur-xl space-y-4"
          >
            <div className="flex items-start gap-4">
              <Skeleton className="h-14 w-14 rounded-2xl bg-white/10 shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4 bg-white/10" />
                <Skeleton className="h-3 w-1/2 bg-white/5" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-full bg-white/5" />
            <Skeleton className="h-3.5 w-4/5 bg-white/5" />
            <div className="flex gap-1.5 pt-2">
              <Skeleton className="h-6 w-16 rounded-full bg-white/5" />
              <Skeleton className="h-6 w-20 rounded-full bg-white/5" />
              <Skeleton className="h-6 w-14 rounded-full bg-white/5" />
            </div>
            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
              <Skeleton className="h-8 w-24 rounded-full bg-white/10" />
              <Skeleton className="h-8 w-8 rounded-full bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
