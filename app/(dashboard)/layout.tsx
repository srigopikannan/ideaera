import { AppSidebar } from "@/components/shell/AppSidebar";
import { AppHeader } from "@/components/shell/AppHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#07080c] text-[#f8f9fa] selection:bg-indigo-500/30 selection:text-white">
      {/* Desktop Sidebar */}
      <AppSidebar />

      {/* Main Workspace Area: Expansive Full Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 w-full min-h-[calc(100vh-4rem)] relative overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
