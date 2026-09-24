import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsPageLoading() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-32 bg-white/5 rounded-full" />
        <Skeleton className="h-8 sm:h-10 w-64 bg-white/10 rounded-xl" />
        <Skeleton className="h-4 w-96 max-w-full bg-white/5" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-white/10 bg-[#0a0c13]/70 backdrop-blur-xl overflow-hidden space-y-4"
          >
            <Skeleton className="h-44 w-full bg-white/5" />
            <div className="p-6 space-y-3">
              <Skeleton className="h-5 w-3/4 bg-white/10" />
              <Skeleton className="h-3.5 w-full bg-white/5" />
              <Skeleton className="h-3.5 w-2/3 bg-white/5" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-full bg-white/5" />
                <Skeleton className="h-6 w-16 rounded-full bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
