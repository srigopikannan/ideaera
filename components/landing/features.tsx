import { CheckCircle2, Code2, Palette, Briefcase, Zap, Globe, Lightbulb } from "lucide-react";

const features = [
  {
    title: "Professional Teammate Discovery",
    description: "Advanced filtering by skill level, experience, and availability. No more guessing who is a fit for your project.",
    icon: Code2,
    list: ["Skill-level verification", "Availability tracking", "Remote/On-site preferences"]
  },
  {
    title: "Idea-to-Project Pipeline",
    description: "Move from a raw concept to a structured project with milestones, tasks, and a dedicated team.",
    icon: Lightbulb,
    list: ["Idea validation", "Milestone planning", "Team management"]
  },
  {
    title: "Hackathon Ecosystem",
    description: "Find upcoming hackathons and the perfect teammates to win them. Integrated registration and team building.",
    icon: Zap,
    list: ["Event discovery", "Rapid team matching", "Organizer tools"]
  },
  {
    title: "Company-Backed Projects",
    description: "Apply to real projects published by startups and established companies. Get professional experience.",
    icon: Briefcase,
    list: ["Real-world impact", "Professional networking", "Application tracking"]
  },
  {
    title: "Design-First Approach",
    description: "Connect with world-class UI/UX designers to ensure your product isn't just functional, but beautiful.",
    icon: Palette,
    list: ["Design-led development", "Figma collaboration", "User-centric focus"]
  },
  {
    title: "Global Collaboration",
    description: "Break geographical barriers. Find the best talent regardless of where they are located.",
    icon: Globe,
    list: ["Timezone matching", "Global talent pool", "Remote-first culture"]
  }
];

export function Features() {
  return (
    <section className="py-24 bg-slate-50/50 dark:bg-slate-900/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Built for the Modern Creator
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to turn a spark of an idea into a production-ready product.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="group p-8 rounded-3xl border border-border bg-background transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>
              <ul className="space-y-3">
                {feature.list.map((item, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
