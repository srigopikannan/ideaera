import { createClient } from "@/lib/supabase/server";
import { hasAcceptedCurrentPolicies } from "@/services/legal";
import { PolicyConsentModal } from "@/components/legal/PolicyConsentModal";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { AppHeader } from "@/components/shell/AppHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let requiresConsent = false;
  if (user) {
    const hasAccepted = await hasAcceptedCurrentPolicies(user.id);
    requiresConsent = !hasAccepted;
  }

  return (
    <div className="min-h-screen w-full max-w-full flex bg-[#07080c] text-[#f8f9fa] selection:bg-indigo-500/30 selection:text-white overflow-x-hidden">
      {requiresConsent && (
        <PolicyConsentModal initialRequiresConsent={true} />
      )}
      {/* Desktop Sidebar */}
      <AppSidebar />

      {/* Main Workspace Area: Expansive Full Canvas */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        <AppHeader />
        <main className="flex-1 w-full min-h-[calc(100vh-4rem)] relative overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
