import { getAllProfiles, getCurrentUserProfile } from "@/services/profile";
import { PeopleDirectory } from "@/components/people/PeopleDirectory";
import { Users, Trophy, Sparkles } from "lucide-react";

export const metadata = {
  title: "Discover People & Form Teams — IdeaEra",
  description: "Find students, developers, and designers to build ideas and form hackathon squads.",
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ hackathon?: string; action?: string; skills?: string }>;
}) {
  const { hackathon, action, skills } = await searchParams;
  const [people, currentUser] = await Promise.all([
    getAllProfiles(),
    getCurrentUserProfile().catch(() => null),
  ]);
  const isFormingTeam = Boolean(hackathon || action === "form-team");

  return (
    <div className="space-y-8 pb-12">
      {/* Hackathon Squad Formation Banner */}
      {isFormingTeam ? (
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-surface p-6 sm:p-8 shadow-card space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-primary text-primary-foreground shadow-sm flex items-center gap-1">
              <Trophy className="h-3 w-3" /> Hackathon Team Assembly
            </span>
            <span className="text-xs font-bold text-foreground">
              Form Team Members
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {hackathon ? `Assemble Squad for: ${hackathon}` : "Form Your Hackathon Squad"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Browse verified students, frontend & backend engineers, UI/UX designers, and AI specialists from top institutions (CEG Anna University, IIT Madras, NIT Trichy, PSG Tech, etc.). View their verified skills, GitHub, and connect directly to build a winning team.
          </p>
        </div>
      ) : (
        /* Standard Header */
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="h-4 w-4" />
            <span>Talent Discovery & Team Formation</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Discover People & Form Teams
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Find fellow students, developers, and designers ready to collaborate on projects and hackathons.
          </p>
        </div>
      )}

      {/* Directory with Filters */}
      <PeopleDirectory
        initialPeople={people}
        currentUser={currentUser}
        initialHackathon={hackathon}
        initialSkills={skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : []}
      />
    </div>
  );
}
