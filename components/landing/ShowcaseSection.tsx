"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Trophy, MapPin, Calendar } from "lucide-react";
import { Card3D } from "@/components/3d/Card3D";

export function ShowcaseSection() {
  const featuredCompetitions = [
    {
      title: "IIT Madras Shaastra Hackathon 2026",
      host: "IIT Madras Tech Team",
      location: "Chennai, Tamil Nadu",
      prize: "₹5,00,000 Cash Prizes & Incubation",
      date: "Oct 10 - 12, 2026",
    },
    {
      title: "NIT Trichy Pragyan Hackathon 2026",
      host: "NIT Trichy Pragyan Technical Council",
      location: "Tiruchirappalli, Tamil Nadu",
      prize: "₹3,00,000 Cash Prizes & Fellowships",
      date: "Dec 10 - 12, 2026",
    },
    {
      title: "Anna Univ Kurukshetra Hackathon 2026",
      host: "CEG Guindy Tech Association",
      location: "Chennai, Tamil Nadu",
      prize: "₹3,50,000 Cash Prizes & Sprints",
      date: "Jan 15 - 17, 2027",
    },
  ];

  return (
    <section className="relative py-28 sm:py-36 bg-[#090a0f] border-t border-white/[0.06] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <p className="text-[11px] font-mono tracking-[0.28em] text-neutral-500 uppercase">
            05 • COLLABORATIVE ARENAS
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
              Where teams compete <br />
              <span className="font-semibold text-neutral-300">and build the future.</span>
            </h2>
            <p className="text-neutral-400 font-light max-w-xl text-base">
              Over 195 verified technical hackathons with ₹1.5Cr+ in prizes and incubation across Tamil Nadu and Pan-India.
            </p>
          </div>

          <Link
            href="/hackathons"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors"
          >
            <span>View All 195+ Sprints</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Hackathon Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredCompetitions.map((comp) => (
            <Card3D key={comp.title} maxTilt={8} scale={1.02} className="h-full">
              <Link
                href="/hackathons"
                className="group block p-7 rounded-2xl bg-[#0d0f17] border border-white/[0.08] hover:border-white/20 transition-all duration-200 h-full flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Trophy className="h-3.5 w-3.5" />
                      {comp.prize}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white group-hover:text-indigo-200 transition-colors">
                    {comp.title}
                  </h3>

                  <p className="text-xs text-neutral-400 font-light">
                    Hosted by {comp.host}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-500 font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {comp.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {comp.date}
                  </span>
                </div>
              </Link>
            </Card3D>
          ))}
        </div>
      </div>
    </section>
  );
}
