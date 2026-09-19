"use client";

import * as React from "react";
import Link from "next/link";
import { Connection } from "@/types";
import {
  updateConnectionAction,
  removeConnectionAction,
} from "@/app/(dashboard)/actions/social";
import {
  UserCheck,
  UserPlus,
  Clock,
  X,
  Check,
  Trash2,
  Users,
  Radio,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LivingEmptyState } from "@/components/ui/LivingEmptyState";

interface ConnectionsManagerProps {
  initialAll: Connection[];
  initialIncoming: Connection[];
  initialSent: Connection[];
}

export function ConnectionsManager({
  initialAll,
  initialIncoming,
  initialSent,
}: ConnectionsManagerProps) {
  const [activeTab, setActiveTab] = React.useState<"all" | "incoming" | "sent">("all");
  const [allConnections, setAllConnections] = React.useState<Connection[]>(initialAll);
  const [incomingRequests, setIncomingRequests] = React.useState<Connection[]>(initialIncoming);
  const [sentRequests, setSentRequests] = React.useState<Connection[]>(initialSent);

  const handleAccept = async (id: string) => {
    const conn = incomingRequests.find((c) => c.id === id);
    if (!conn) return;

    setIncomingRequests((prev) => prev.filter((c) => c.id !== id));
    setAllConnections((prev) => [{ ...conn, status: "accepted" }, ...prev]);
    await updateConnectionAction(id, "accepted");
  };

  const handleReject = async (id: string) => {
    setIncomingRequests((prev) => prev.filter((c) => c.id !== id));
    await updateConnectionAction(id, "rejected");
  };

  const handleCancelSent = async (id: string) => {
    setSentRequests((prev) => prev.filter((c) => c.id !== id));
    await removeConnectionAction(id);
  };

  const handleRemoveConnection = async (id: string) => {
    if (!confirm("Are you sure you want to decouple this quantum bond?")) return;
    setAllConnections((prev) => prev.filter((c) => c.id !== id));
    await removeConnectionAction(id);
  };

  const currentList =
    activeTab === "all"
      ? allConnections
      : activeTab === "incoming"
      ? incomingRequests
      : sentRequests;

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 lg:p-12 space-y-6 sm:space-y-10 select-none overflow-x-hidden">
      {/* Floating Top HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.9)] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.26em] text-neutral-400">
              QUANTUM BOND REGISTRY // PEER MATRIX
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extralight text-white uppercase tracking-tight">
            Network Orbit.
          </h1>
        </div>

        {/* Tab Switcher Capsule */}
        <div className="inline-flex items-center max-w-full overflow-x-auto no-scrollbar p-1 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl shrink-0">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all shrink-0",
              activeTab === "all"
                ? "bg-white text-black font-semibold shadow-lg"
                : "text-neutral-400 hover:text-white"
            )}
          >
            <span className="hidden sm:inline">Established Bonds</span>
            <span className="sm:hidden">Bonds</span> ({allConnections.length})
          </button>
          <button
            onClick={() => setActiveTab("incoming")}
            className={cn(
              "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all shrink-0",
              activeTab === "incoming"
                ? "bg-white text-black font-semibold shadow-lg"
                : "text-neutral-400 hover:text-white"
            )}
          >
            <span className="hidden sm:inline">Incoming Signals</span>
            <span className="sm:hidden">Incoming</span> ({incomingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={cn(
              "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all shrink-0",
              activeTab === "sent"
                ? "bg-white text-black font-semibold shadow-lg"
                : "text-neutral-400 hover:text-white"
            )}
          >
            <span className="hidden sm:inline">Transmitted</span>
            <span className="sm:hidden">Sent</span> ({sentRequests.length})
          </button>
        </div>
      </div>

      {/* Bond Cards Matrix */}
      {currentList.length === 0 ? (
        <div className="py-20 flex items-center justify-center">
          <LivingEmptyState
            title={
              activeTab === "all"
                ? "YOUR BOND ORBIT IS QUIET."
                : activeTab === "incoming"
                ? "NO INCOMING SIGNALS DETECTED."
                : "NO PENDING TRANSMISSIONS."
            }
            subtitle={
              activeTab === "all"
                ? "Step into the talent constellation to establish harmonic signals with builders across the globe."
                : "Transmissions directed to your frequency will resonate here."
            }
            actionText={activeTab === "all" ? "Explore Constellation" : undefined}
            actionHref={activeTab === "all" ? "/people" : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.map((conn) => {
            const partner = activeTab === "sent" ? conn.receiver : conn.requester;
            const displayName = partner?.full_name || partner?.username || "Innovator";
            const displayUsername = partner?.username || "peer";
            const displayHeadline = partner?.headline;

            return (
              <div
                key={conn.id}
                className="group relative rounded-3xl border border-white/10 bg-[#0a0c13]/70 backdrop-blur-xl p-5 sm:p-8 space-y-5 sm:space-y-6 hover:border-indigo-500/40 hover:bg-[#0e111a] transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full animate-pulse",
                          activeTab === "all"
                            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                            : activeTab === "incoming"
                            ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                            : "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"
                        )}
                      />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                        {activeTab === "all"
                          ? "HARMONIC BOND"
                          : activeTab === "incoming"
                          ? "PENDING INVITATION"
                          : "SIGNAL SENT"}
                      </span>
                    </div>

                    <Link
                      href={"/people/" + displayUsername}
                      className="text-neutral-400 hover:text-white transition-colors"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Profile Info */}
                  <div>
                    <h3 className="text-xl font-light text-white group-hover:text-indigo-200 transition-colors">
                      {displayName}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono">
                      @{displayUsername}
                    </p>
                    {displayHeadline && (
                      <p className="text-xs text-neutral-300 font-light pt-2 line-clamp-2">
                        {displayHeadline}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-white/[0.08]">
                  {activeTab === "all" && (
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={"/people/" + displayUsername}
                        className="flex-1 py-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/10 text-white text-xs font-mono text-center transition-all"
                      >
                        Inspect Matrix
                      </Link>
                      <button
                        onClick={() => handleRemoveConnection(conn.id)}
                        className="p-2 rounded-full border border-red-500/20 text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-all"
                        title="Decouple bond"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {activeTab === "incoming" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccept(conn.id)}
                        className="flex-1 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-all flex items-center justify-center gap-1.5 shadow-lg"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleReject(conn.id)}
                        className="px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-neutral-400 hover:text-white text-xs font-mono transition-all"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {activeTab === "sent" && (
                    <button
                      onClick={() => handleCancelSent(conn.id)}
                      className="w-full py-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/10 text-neutral-400 hover:text-white text-xs font-mono transition-all"
                    >
                      Withdraw Signal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
