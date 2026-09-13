import { getMyConnectionsAction } from "@/app/(dashboard)/actions/social";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NextLink from "next/link";
import { MessageSquare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
export const dynamic = "force-dynamic";
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const result = await getMyConnectionsAction();

  const connections = result.connections.filter(
    (
      connection
    ): connection is NonNullable<typeof connection> => Boolean(connection)
  );

  const query = searchParams.q?.toLowerCase().trim() || "";

  const filteredConnections = query
    ? connections.filter((connection) =>
        connection.full_name?.toLowerCase().includes(query)
      )
    : connections;

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Start a conversation with your connections.
        </p>
      </div>

      {/* Search */}
      <form method="GET" className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          name="q"
          placeholder="Search connections..."
          defaultValue={searchParams.q || ""}
          className="pl-9"
        />
      </form>

      {/* Connections */}
      <div className="rounded-lg border bg-card">
        {filteredConnections.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <MessageSquare className="mb-4 h-10 w-10 text-muted-foreground" />

            <h2 className="text-lg font-semibold">
              {query ? "No connections found" : "No connections yet"}
            </h2>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {query
                ? "Try searching for a different name."
                : "Connect with people to start having conversations."}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConnections.map((connection) => (
              <NextLink
                key={connection.id}
                href={`/messages/${connection.id}`}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
              >
                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={connection.avatar_url ?? undefined}
                    alt={connection.full_name || "User"}
                  />

                  <AvatarFallback>
                    {connection.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                {/* User information */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {connection.full_name || "Unknown User"}
                  </p>

                  {connection.headline && (
                    <p className="truncate text-sm text-muted-foreground">
                      {connection.headline}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-muted-foreground">
                    Start a conversation
                  </p>
                </div>

                {/* Message icon */}
                <MessageSquare className="h-5 w-5 shrink-0 text-muted-foreground" />
              </NextLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}