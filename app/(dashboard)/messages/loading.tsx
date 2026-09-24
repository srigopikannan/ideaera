import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesPageLoading() {
  return (
    <div className="w-full h-[calc(100vh-5rem)] grid grid-cols-1 md:grid-cols-12 gap-4 animate-fade-in p-4">
      {/* Sidebar: Conversations List */}
      <div className="md:col-span-4 rounded-3xl border border-white/10 bg-[#0a0c13]/70 backdrop-blur-xl p-4 space-y-4 flex flex-col">
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <Skeleton className="h-6 w-28 bg-white/10 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-full bg-white/5" />
        </div>
        <Skeleton className="h-10 w-full rounded-2xl bg-white/5" />
        <div className="space-y-3 flex-1 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02]">
              <Skeleton className="h-11 w-11 rounded-2xl bg-white/10 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-32 bg-white/10" />
                <Skeleton className="h-3 w-44 bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="hidden md:flex md:col-span-8 rounded-3xl border border-white/10 bg-[#0a0c13]/70 backdrop-blur-xl p-6 flex-col justify-between">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <Skeleton className="h-10 w-10 rounded-2xl bg-white/10" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-36 bg-white/10" />
            <Skeleton className="h-3 w-20 bg-white/5" />
          </div>
        </div>

        {/* Messages Placeholder */}
        <div className="space-y-4 py-8">
          <div className="flex justify-start">
            <Skeleton className="h-12 w-64 rounded-2xl bg-white/5" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-56 rounded-2xl bg-indigo-500/20" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-16 w-80 rounded-2xl bg-white/5" />
          </div>
        </div>

        {/* Input Bar */}
        <div className="pt-4 border-t border-white/5">
          <Skeleton className="h-12 w-full rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
