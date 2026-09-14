"use client";

import * as React from "react";
import Link from "next/link";
import { Idea } from "@/types";
import { toggleLikeAction } from "@/app/(dashboard)/actions/ideas";
import { formatTimeAgo } from "@/lib/utils";
import { Heart, MessageSquare, ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface IdeaCardProps {
  idea: Idea;
  trending?: boolean;
}

export function IdeaCard({ idea, trending = false }: IdeaCardProps) {
  const [isLiked, setIsLiked] = React.useState(idea.is_liked || false);
  const [likesCount, setLikesCount] = React.useState(idea.likes_count || 0);
  const [isLiking, setIsLiking] = React.useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiking) return;

    setIsLiking(true);
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : Math.max(prev - 1, 0)));

    try {
      const res = await toggleLikeAction(idea.id);
      setIsLiked(res.liked);
      setLikesCount(res.likes_count);
    } catch {
      setIsLiked(!newLiked);
      setLikesCount((prev) => (!newLiked ? prev + 1 : Math.max(prev - 1, 0)));
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Link
      href={`/ideas/${idea.id}`}
      className={cn(
        "group relative p-7 rounded-3xl border border-white/[0.08] bg-[#0a0c13] hover:border-white/25 transition-all duration-300 flex flex-col justify-between space-y-6 shadow-sm",
        trending && "border-indigo-500/30 bg-[#0d0f1a]"
      )}
    >
      <div className="space-y-4">
        {/* Category & Status */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-1.5">
            {trending && <Sparkles className="h-3 w-3 text-indigo-400" />}
            {idea.category}
          </span>
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
            {formatTimeAgo(idea.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-light tracking-tight text-white group-hover:text-indigo-200 transition-colors leading-snug">
          {idea.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed line-clamp-3">
          {idea.description}
        </p>

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {idea.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/[0.06] text-neutral-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-5 border-t border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
              isLiked ? "text-indigo-300 font-bold" : "hover:text-white"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-indigo-300 text-indigo-300")} />
            <span>{likesCount}</span>
          </button>

          <span className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-neutral-500" />
            <span>{idea.comments_count || 0}</span>
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-neutral-300 group-hover:text-white group-hover:translate-x-0.5 transition-all">
          <span>Read</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
