"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin } from "@/components/ui/brand-icons";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#050608] text-white py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/[0.06]">
          {/* Brand Column */}
          <div className="md:col-span-6 space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 tracking-[0.24em] text-sm font-bold uppercase text-white"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <span>IDEA ERA</span>
            </Link>
            <p className="text-neutral-400 text-xs font-mono tracking-wider max-w-sm">
              &quot;Where ideas become possibilities.&quot;
            </p>
            <p className="text-neutral-500 text-xs font-light max-w-md leading-relaxed pt-2">
              An editorial innovation platform connecting creators, engineers, and founders to form squads, participate in 195+ collegiate hackathons, and ship what comes next.
            </p>
          </div>

          {/* Platform Navigation */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400 font-light">
              <li>
                <Link href="/ideas" className="hover:text-white transition-colors">
                  Discover Ideas
                </Link>
              </li>
              <li>
                <Link href="/ideas/create" className="hover:text-white transition-colors">
                  Share Your Idea
                </Link>
              </li>
              <li>
                <Link href="/people" className="hover:text-white transition-colors">
                  Find Collaborators
                </Link>
              </li>
              <li>
                <Link href="/hackathons" className="hover:text-white transition-colors">
                  195+ Hackathons
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-white transition-colors">
                  Showcased Projects
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Account */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500">
              Account & Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400 font-light">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About Idea Era
                </a>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy-center" className="hover:text-white transition-colors text-indigo-400">
                  Privacy Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-neutral-500 font-mono gap-4">
          <p>© {new Date().getFullYear()} IDEA ERA. All rights reserved.</p>
          <div className="flex gap-5 text-neutral-400">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Twitter">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
