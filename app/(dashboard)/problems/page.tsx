import Link from "next/link";
import { getProblems } from "@/services/problems";
import { ProblemsExplorer } from "@/components/problems/ProblemsExplorer";
import { Button } from "@/components/ui/button";
import { Target, Plus, ShieldCheck, Sparkles, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Real-World Problems & Challenges — IdeaEra",
  description:
    "Discover real-world engineering challenges from tech companies and innovators. Form teams, build solution ideas, and collaborate.",
};

export default async function ProblemsPage() {
  const problemsData = await getProblems();

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <Target className="h-4 w-4" />
            <span>Problem Discovery Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            REAL-WORLD PROBLEMS.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Discover problems worth solving and turn them into ideas. Companies bring friction points, innovators craft architecture, and IdeaEra unites the talent to build them.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/problems/submit">
            <Button variant="default" size="sm" className="shadow-subtle gap-1.5 font-semibold">
              <Plus className="h-4 w-4" /> Submit a Problem
            </Button>
          </Link>
        </div>
      </div>

      {/* Explorer Interface */}
      <ProblemsExplorer initialProblems={problemsData.problems} />
    </div>
  );
}
