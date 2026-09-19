import { SettingsManager } from "@/components/settings/SettingsManager";
import { Settings } from "lucide-react";

export const metadata = {
  title: "Settings — IdeaEra",
  description: "Manage account settings, notifications, appearance, and security.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-12 px-4 sm:px-0">
      <div>
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
          <Settings className="h-4 w-4" />
          <span>Configuration</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
          Customize your IdeaEra experience, notification frequencies, appearance mode, and security credentials.
        </p>
      </div>

      <SettingsManager />
    </div>
  );
}
