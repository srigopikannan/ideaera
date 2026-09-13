"use client";

import { useEffect, useState } from "react";
import {
  getMyConnectionsAction,
  respondToConnectionAction,
  removeConnectionAction,
} from "@/app/(dashboard)/actions/social";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Check,
  X,
  UserMinus,
  Loader2,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import NextLink from "next/link";
import { toast } from "sonner";

interface ConnectionProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  headline?: string;
  location?: string;
}

interface ConnectionRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: Date;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<ConnectionProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<
    ConnectionRequest[]
  >([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadConnections = async () => {
    try {
      const data = await getMyConnectionsAction();

      if (data) {
        setConnections(
          (data.connections || []).filter(Boolean) as ConnectionProfile[]
        );

        setPendingRequests(data.pendingRequests || []);
        setSentRequests(data.sentRequests || []);
      }
    } catch (error) {
      console.error("Failed to load connections", error);
      toast.error("Failed to load your connections");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadConnections();
    };

    init();
  }, []);

  const handleRespond = async (
    requesterId: string,
    status: "accepted" | "rejected"
  ) => {
    setIsUpdating(true);

    try {
      const result = await respondToConnectionAction(
        requesterId,
        status
      );

      if (result.success) {
        if (status === "accepted") {
          toast.success("Connection accepted");
        } else {
          toast.success("Connection request declined");
        }

        await loadConnections();
      } else {
        toast.error(result.error || "Failed to respond to request");
      }
    } catch (error) {
      console.error("Failed to respond to connection request", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async (targetUserId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this connection?"
      )
    ) {
      return;
    }

    setIsUpdating(true);

    try {
      const result = await removeConnectionAction(targetUserId);

      if (result.success) {
        toast.success("Connection removed");
        await loadConnections();
      } else {
        toast.error(result.error || "Failed to remove connection");
      }
    } catch (error) {
      console.error("Failed to remove connection", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            My Network
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your connections and connection requests.
          </p>
        </div>

        <Badge variant="secondary">
          {connections.length}{" "}
          {connections.length === 1 ? "Connection" : "Connections"}
        </Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Pending Requests */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <UserPlus className="h-5 w-5" />
              Pending Requests
            </h2>

            {pendingRequests.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No pending requests at the moment.
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map((req) => (
                  <Card key={req.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            User
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <p className="font-medium">
                            Connection Request
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Requested on{" "}
                            {new Date(
                              req.created_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRespond(
                              req.requester_id,
                              "rejected"
                            )
                          }
                          disabled={isUpdating}
                          aria-label="Decline connection request"
                        >
                          <X className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          onClick={() =>
                            handleRespond(
                              req.requester_id,
                              "accepted"
                            )
                          }
                          disabled={isUpdating}
                          aria-label="Accept connection request"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* My Connections */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">
              My Connections
            </h2>

            {connections.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                You haven&apos;t connected with anyone yet. Start
                exploring people!
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {connections.map((profile) => (
                  <Card key={profile.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={profile.avatar_url}
                            alt={profile.full_name}
                          />

                          <AvatarFallback>
                            {profile.full_name?.charAt(0)?.toUpperCase() ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 overflow-hidden">
                          <p className="truncate font-medium">
                            {profile.full_name}
                          </p>

                          {profile.headline && (
                            <p className="truncate text-xs text-muted-foreground">
                              {profile.headline}
                            </p>
                          )}

                          {profile.location && (
                            <p className="truncate text-xs text-muted-foreground">
                              {profile.location}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="ml-2 flex shrink-0 gap-1">
                        <NextLink
                          href={`/profile/${profile.id}`}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "sm",
                          })}
                        >
                          View
                        </NextLink>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            handleRemove(profile.id)
                          }
                          disabled={isUpdating}
                          aria-label={`Remove ${profile.full_name}`}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Outgoing Requests
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {sentRequests.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No outgoing requests.
                </p>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-lg border bg-muted/50 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted" />

                        <p className="text-sm font-medium">
                          Pending...
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className="text-[10px]"
                      >
                        Sent
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}