import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPageLoading() {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 lg:p-12 space-y-8 animate-fade-in max-w-4xl">
      <div className="space-y-2 pb-6 border-b border-white/[0.08]">
        <Skeleton className="h-3 w-32 bg-white/5 rounded-full" />
        <Skeleton className="h-8 sm:h-10 w-48 bg-white/10 rounded-xl" />
      </div>

      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#0a0c13]/70 backdrop-blur-xl space-y-4"
          >
            <Skeleton className="h-6 w-48 bg-white/10 rounded-lg" />
            <Skeleton className="h-4 w-full max-w-md bg-white/5" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-10 w-full rounded-2xl bg-white/5" />
              <Skeleton className="h-10 w-full rounded-2xl bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
