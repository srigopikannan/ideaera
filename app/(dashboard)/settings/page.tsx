"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function SettingsPage() {
  const handleSave = async () => {
    toast.success("Settings updated successfully!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Account Settings
        </h1>

        <p className="text-muted-foreground">
          Manage your profile, preferences, and account security.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>

              <CardDescription>
                Update your public profile details.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>

                  <Input
                    id="full-name"
                    defaultValue="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>

                  <Input
                    id="username"
                    defaultValue="johndoe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>

                <Input
                  id="headline"
                  defaultValue="Full-stack Developer & AI Enthusiast"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>

                <textarea
                  id="bio"
                  className="w-full p-3 rounded-md border bg-background text-sm min-h-[120px]"
                  defaultValue="Building the future of collaboration."
                />
              </div>

              <Button
                onClick={handleSave}
                className="px-8"
              >
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>

              <CardDescription>
                Control who can see your activity and contact you.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                <div className="space-y-1">
                  <p className="font-medium">
                    Public Profile
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Allow anyone to see your profile and skills.
                  </p>
                </div>

                <Button variant="outline" size="sm">
                  Toggle
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border bg-muted/30">
                <div className="space-y-1">
                  <p className="font-medium">
                    Connection Requests
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Receive connection requests from anyone.
                  </p>
                </div>

                <Button variant="outline" size="sm">
                  Toggle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>

              <CardDescription>
                Secure your account with a strong password and 2FA.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Change Password
                  </Label>

                  <Input
                    id="password"
                    type="password"
                    placeholder="New password"
                  />
                </div>

                <Button variant="outline">
                  Update Password
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 rounded-2xl border bg-muted/30">
                <div className="space-y-1">
                  <p className="font-medium">
                    Two-Factor Authentication
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Add an extra layer of security to your account.
                  </p>
                </div>

                <Button variant="outline" size="sm">
                  Enable 2FA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}