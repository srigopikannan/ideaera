"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { searchGlobalAction, GlobalSearchResult } from "@/app/(dashboard)/actions/discovery";
import {
  Search,
  Users,
  Lightbulb,
  FolderGit2,
  Trophy,
  Loader2,
  X,
  CornerDownLeft,
} from "lucide-react";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<GlobalSearchResult>({
    people: [],
    ideas: [],
    projects: [],
    hackathons: [],
  });

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ people: [], ideas: [], projects: [], hackathons: [] });
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          const event = new CustomEvent("open-global-search");
          window.dispatchEvent(event);
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  React.useEffect(() => {
    if (!query.trim()) {
      setResults({ people: [], ideas: [], projects: [], hackathons: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchGlobalAction(query);
        setResults(res);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const hasResults =
    results.people.length > 0 ||
    results.ideas.length > 0 ||
    results.projects.length > 0 ||
    results.hackathons.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Ambient Cosmic Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Radar Palette Modal */}
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-[#0a0c13]/95 text-white shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden animate-fade-in z-50 backdrop-blur-2xl">
        {/* Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-white/[0.08] gap-3">
          <Search className="h-5 w-5 text-indigo-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Scan across the ecosystem (ideas, people, ventures, hackathons)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 text-sm sm:text-base text-white placeholder:text-neutral-500 focus:outline-none font-light"
          />
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          ) : query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-neutral-400 rounded-md border border-white/10 bg-white/[0.03]">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Stream */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="py-10 text-center text-xs font-mono text-neutral-400 space-y-2">
              <p className="tracking-wider uppercase">Type keywords to initiate a radar sweep.</p>
              <div className="flex justify-center gap-2 pt-3 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-neutral-400">#AI</span>
                <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-neutral-400">#Python</span>
                <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-neutral-400">#Chennai</span>
                <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-neutral-400">#PostgreSQL</span>
              </div>
            </div>
          )}

          {query.trim() && !isLoading && !hasResults && (
            <div className="py-12 text-center text-xs font-mono text-neutral-500 uppercase tracking-wider">
              No resonance signals found matching &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Ideas Results */}
          {results.ideas.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-1.5 px-3 text-[10px] font-mono uppercase tracking-widest text-indigo-400">
                <Lightbulb className="h-3.5 w-3.5" />
                <span>Ideas & Sparks</span>
              </div>
              <div className="space-y-1">
                {results.ideas.map((idea) => (
                  <button
                    key={idea.id}
                    onClick={() => handleNavigate(`/ideas/${idea.id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/[0.06] border border-transparent hover:border-white/10 text-left transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-light text-white group-hover:text-indigo-200 transition-colors">
                          {idea.title}
                        </p>
                        {idea.display_id && (
                          <span className="text-[10px] font-mono text-indigo-400/80 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                            {idea.display_id}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                        {idea.category}
                      </span>
                    </div>
                    <CornerDownLeft className="h-3.5 w-3.5 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* People Results */}
          {results.people.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 px-3 text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                <Users className="h-3.5 w-3.5" />
                <span>Builders & Minds</span>
              </div>
              <div className="space-y-1">
                {results.people.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => handleNavigate(`/people/${person.username}`)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/[0.06] border border-transparent hover:border-white/10 text-left transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-xs font-mono text-cyan-300 overflow-hidden shrink-0">
                        {person.avatar_url ? (
                          <img src={person.avatar_url} alt={person.name} className="h-full w-full object-cover" />
                        ) : (
                          person.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-light text-white group-hover:text-cyan-200 transition-colors truncate">
                          {person.name}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 truncate">
                          <span>@{person.username}</span>
                          {person.skills && person.skills.length > 0 && (
                            <span className="text-indigo-300">
                              {person.skills.slice(0, 2).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <CornerDownLeft className="h-3.5 w-3.5 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Projects Results */}
          {results.projects.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 px-3 text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                <FolderGit2 className="h-3.5 w-3.5" />
                <span>Evolving Ventures</span>
              </div>
              <div className="space-y-1">
                {results.projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => handleNavigate(`/projects/${proj.slug || proj.id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/[0.06] border border-transparent hover:border-white/10 text-left transition-all group"
                  >
                    <div>
                      <p className="text-sm font-light text-white group-hover:text-emerald-200 transition-colors">
                        {proj.name}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-light line-clamp-1">
                        {proj.description}
                      </p>
                    </div>
                    <CornerDownLeft className="h-3.5 w-3.5 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hackathons Results */}
          {results.hackathons.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 px-3 text-[10px] font-mono uppercase tracking-widest text-amber-400">
                <Trophy className="h-3.5 w-3.5" />
                <span>Competitive Sprints</span>
              </div>
              <div className="space-y-1">
                {results.hackathons.map((hack) => (
                  <button
                    key={hack.id}
                    onClick={() => handleNavigate(`/hackathons/${hack.id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/[0.06] border border-transparent hover:border-white/10 text-left transition-all group"
                  >
                    <div>
                      <p className="text-sm font-light text-white group-hover:text-amber-200 transition-colors">
                        {hack.title}
                      </p>
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                        {hack.mode}
                      </span>
                    </div>
                    <CornerDownLeft className="h-3.5 w-3.5 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
