import { getConnections } from "@/services/social";
import { getCurrentUserProfile } from "@/services/profile";
import { ConnectionsManager } from "@/components/connections/ConnectionsManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Connections — IdeaEra",
  description: "Manage your professional innovation connections and requests.",
};

export default async function ConnectionsPage() {
  const [{ all, incoming, sent }, currentUser] = await Promise.all([
    getConnections(),
    getCurrentUserProfile(),
  ]);

  return (
    <ConnectionsManager
      initialAll={all}
      initialIncoming={incoming}
      initialSent={sent}
      currentUserId={currentUser?.id}
    />
  );
}
