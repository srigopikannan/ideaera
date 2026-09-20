"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Bell,
  Shield,
  LogOut,
  Moon,
  Sun,
  Save,
  CheckCircle2,
  Lock,
  Mail,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { deleteAccountAction } from "@/app/(dashboard)/actions/account";

export function SettingsManager() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("account");
  const [isDark, setIsDark] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState("");

  // Notification toggles
  const [emailNotifs, setEmailNotifs] = React.useState(true);
  const [connectionNotifs, setConnectionNotifs] = React.useState(true);
  const [messageNotifs, setMessageNotifs] = React.useState(true);
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  // Security password state
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordLoading, setPasswordLoading] = React.useState(false);
  const [passwordMsg, setPasswordMsg] = React.useState<{ error?: string; success?: string } | null>(null);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));

    const fetchEmail = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
        }
      } catch {}
    };
    fetchEmail();
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      if (typeof document !== "undefined") {
        document.cookie = "sb-remember=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    } catch {
      // Ignore
    }
    window.location.href = "/login";
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ error: "Password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ error: "Passwords do not match." });
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordMsg({ error: error.message });
      } else {
        setPasswordMsg({ success: "Password successfully updated!" });
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordMsg(null), 4000);
      }
    } catch (err: any) {
      setPasswordMsg({ error: err?.message || "Failed to update password." });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Delete Profile modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [deleteUnderstandChecked, setDeleteUnderstandChecked] = React.useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const isDeleteConfirmed =
    deleteUnderstandChecked && deleteConfirmationInput.trim() === "DELETE";

  const handleDeleteAccount = async () => {
    if (!isDeleteConfirmed || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteAccountAction(deleteConfirmationInput);
      if (!res.success) {
        setDeleteError(res.error || "Failed to delete account. Please try again.");
        setIsDeleting(false);
        return;
      }

      // Clear client session and hard-redirect to /login
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {}

      window.location.href = "/login";
    } catch (err: any) {
      setDeleteError(err?.message || "An unexpected error occurred during account deletion.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-success/10 border border-success/20 flex items-center gap-2.5 text-success text-sm animate-fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>Preferences updated successfully!</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="profile">Profile Shortcuts</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security & Privacy</TabsTrigger>
        </TabsList>

        {/* Tab 1: Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <Card className="border-border bg-surface shadow-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg">Account Information</CardTitle>
              <CardDescription>Manage your authentication email and platform appearance.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <form onSubmit={handleSavePreferences} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">
                    Registered Email
                  </label>
                  <Input
                    type="email"
                    value={userEmail}
                    leftIcon={<Mail className="h-4 w-4" />}
                    disabled
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Contact platform administration to change primary account email.
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Color Appearance</h4>
                    <p className="text-xs text-muted-foreground">Switch between light and dark interface styles.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleTheme}
                    className="font-medium text-xs"
                  >
                    {isDark ? <Sun className="h-4 w-4 mr-1.5 text-warning" /> : <Moon className="h-4 w-4 mr-1.5" />}
                    {isDark ? "Use Light Theme" : "Use Dark Theme"}
                  </Button>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <Button type="submit" variant="default" size="sm">
                    <Save className="h-4 w-4 mr-1.5" />
                    Save Account Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone Section */}
          <Card className="border-destructive/30 bg-destructive/[0.02] shadow-card">
            <CardHeader className="border-b border-destructive/20 pb-4">
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Danger Zone
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Irreversible actions that permanently delete your personal account and platform data.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/[0.04]">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-foreground">Delete Profile</h4>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your IdeaEra account and personal profile.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setIsDeleteModalOpen(true);
                    setDeleteUnderstandChecked(false);
                    setDeleteConfirmationInput("");
                    setDeleteError(null);
                  }}
                  className="whitespace-nowrap font-medium"
                >
                  Delete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Profile Shortcuts */}
        <TabsContent value="profile">
          <Card className="border-border bg-surface shadow-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg">Profile Management</CardTitle>
              <CardDescription>Quick links to edit or preview your public innovator profile.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-border bg-muted/40 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Edit Full Biography & Skills</h4>
                  <p className="text-xs text-muted-foreground">Update your portfolio, social profiles, and domain competencies.</p>
                </div>
                <Link href="/profile/edit">
                  <Button variant="default" size="sm">
                    Open Profile Editor
                  </Button>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-border bg-muted/40 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">View Public Profile as Others See It</h4>
                  <p className="text-xs text-muted-foreground">Preview your projects, active ideas, and showcase.</p>
                </div>
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    View Live Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Notifications */}
        <TabsContent value="notifications">
          <Card className="border-border bg-surface shadow-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
              <CardDescription>Configure which ecosystem alerts you wish to receive.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-foreground block">Email Digest</span>
                    <span className="text-xs text-muted-foreground">Weekly roundup of trending ideas and hackathons</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifs}
                    onChange={(e) => setEmailNotifs(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-border">
                  <div>
                    <span className="text-sm font-medium text-foreground block">Connection Requests</span>
                    <span className="text-xs text-muted-foreground">Notify when another builder invites you to connect</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={connectionNotifs}
                    onChange={(e) => setConnectionNotifs(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-border">
                  <div>
                    <span className="text-sm font-medium text-foreground block">Direct Messages</span>
                    <span className="text-xs text-muted-foreground">Instant notifications for new collaborator messages</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={messageNotifs}
                    onChange={(e) => setMessageNotifs(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button onClick={handleSavePreferences} variant="default" size="sm">
                  <Save className="h-4 w-4 mr-1.5" />
                  Save Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Security & Privacy */}
        <TabsContent value="security" className="space-y-6">
          {/* Change Password Card */}
          <Card className="border-border bg-surface shadow-card">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" /> Update Password
              </CardTitle>
              <CardDescription>
                Ensure your account is protected with a secure password.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                {passwordMsg?.error && (
                  <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-mono">
                    {passwordMsg.error}
                  </div>
                )}
                {passwordMsg?.success && (
                  <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-xs text-success font-mono flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{passwordMsg.success}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={passwordLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={passwordLoading}
                  />
                </div>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border bg-surface shadow-card space-y-4">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg">Security & Authentication</CardTitle>
              <CardDescription>Manage session security and active sign-ins.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Session Security
                </h4>
                <p className="text-xs text-muted-foreground">
                  Your session is authenticated via secure HttpOnly cookies refreshed through Next.js proxy middleware.
                </p>
              </div>

              <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-error">Sign Out Everywhere</h4>
                  <p className="text-xs text-muted-foreground">Terminate active sessions on all devices.</p>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  size="sm"
                  className="text-xs"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Sign Out of IdeaEra
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Profile Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-profile-dialog-title"
            className="bg-card border border-border shadow-2xl rounded-2xl max-w-lg w-full p-6 space-y-5 relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="delete-profile-dialog-title" className="text-lg font-bold text-foreground">
                    Delete your IdeaEra profile?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    This action is permanent and cannot be reversed.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                disabled={isDeleting}
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-foreground/90 leading-relaxed">
              This will permanently remove your account and personal profile. Your connections, notifications, messages, and other personal data may also be removed according to IdeaEra&apos;s data-retention rules.
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-xs text-destructive font-mono">
                {deleteError}
              </div>
            )}

            <div className="space-y-4">
              {/* Requirement 1: Confirm they understand */}
              <label className="flex items-start gap-3 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={deleteUnderstandChecked}
                  onChange={(e) => setDeleteUnderstandChecked(e.target.checked)}
                  disabled={isDeleting}
                  className="mt-0.5 h-4 w-4 rounded border-border text-destructive focus:ring-destructive"
                />
                <span className="text-foreground font-medium leading-normal">
                  I understand that deleting my profile is permanent and cannot be undone.
                </span>
              </label>

              {/* Requirement 2: Type "DELETE" */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-foreground block">
                  To confirm, type <span className="font-mono font-bold text-destructive">DELETE</span> below:
                </label>
                <Input
                  type="text"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  placeholder="DELETE"
                  disabled={isDeleting}
                  className="font-mono tracking-widest text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Final action buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={!isDeleteConfirmed || isDeleting}
                className="gap-2 font-medium"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting Profile...
                  </>
                ) : (
                  "Delete My Profile"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
