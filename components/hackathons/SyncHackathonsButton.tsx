"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2 } from "lucide-react";

export function SyncHackathonsButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [syncedMessage, setSyncedMessage] = React.useState<string | null>(null);

  const handleSync = async () => {
    setIsLoading(true);
    setSyncedMessage(null);
    try {
      const res = await fetch("/api/hackathons/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncedMessage(data.message);
        router.refresh();
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {syncedMessage && (
        <span className="text-xs text-success flex items-center gap-1 font-medium animate-fade-in">
          <CheckCircle2 className="h-3.5 w-3.5" /> {syncedMessage}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        isLoading={isLoading}
        className="text-xs font-semibold gap-1.5 border-dashed"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Sync Verified 2026 Hackathons
      </Button>
    </div>
  );
}
