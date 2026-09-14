"use client";

import { Star, Sparkles, Code2, Users, Rocket } from "lucide-react";

export function SocialProof() {
  const stats = [
    { label: "Innovators & Builders", value: "14,000+", icon: Users },
    { label: "Ideas Validated", value: "3,800+", icon: Sparkles },
    { label: "Showcased Projects", value: "950+", icon: Code2 },
    { label: "Hackathon Teams Formed", value: "620+", icon: Rocket },
  ];

  return (
    <section className="py-16 border-y border-border/80 bg-surface/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="space-y-2">
                <div className="inline-flex p-2.5 rounded-xl bg-primary/10 text-primary mb-1">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
