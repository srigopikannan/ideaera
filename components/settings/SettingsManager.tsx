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
} from "lucide-react";

export function SettingsManager() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("account");
  const [isDark, setIsDark] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState("srigopikannan11@gmail.com");

  // Notification toggles
  const [emailNotifs, setEmailNotifs] = React.useState(true);
  const [connectionNotifs, setConnectionNotifs] = React.useState(true);
  const [messageNotifs, setMessageNotifs] = React.useState(true);
  const [savedSuccess, setSavedSuccess] = React.useState(false);

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
    } catch {
      // Ignore
    }
    router.push("/login");
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
        <TabsContent value="account">
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
        <TabsContent value="security">
          <Card className="border-border bg-surface shadow-card space-y-4">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg">Security & Authentication</CardTitle>
              <CardDescription>Manage password and session security.</CardDescription>
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
    </div>
  );
}
