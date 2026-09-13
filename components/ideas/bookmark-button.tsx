"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleBookmarkAction } from "@/app/(dashboard)/actions/ideas";
import { toast } from "sonner";

export default function BookmarkClientButton({ isBookmarked, ideaId }: { isBookmarked: boolean, ideaId: string }) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const result = await toggleBookmarkAction(ideaId);
      if (result.success) {
        setBookmarked(!bookmarked);
        toast.success(bookmarked ? "Removed from bookmarks" : "Added to bookmarks");
      } else {
        toast.error(result.error || "Failed to update bookmark");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      className={`transition-colors ${bookmarked ? "text-primary bg-primary/10 border-primary" : ""}`}
    >
      <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-primary" : ""}`} />
    </Button>
  );
}
