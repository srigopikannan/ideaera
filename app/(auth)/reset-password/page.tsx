"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-mesh select-none">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.9)]" />
            <span className="font-bold tracking-[0.24em] text-lg text-foreground uppercase">
              IDEA ERA
            </span>
          </Link>
          <p className="text-sm font-light text-muted-foreground mt-2">
            Establish New Security Credentials
          </p>
        </div>

        <Card className="border-border shadow-elevated bg-surface/95 backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Set New Password</CardTitle>
            <CardDescription>
              Choose a strong password with at least 8 characters.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 flex items-start gap-2.5 text-error text-xs font-mono">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="p-4 rounded-xl bg-success/10 border border-success/20 space-y-2 text-center">
                <div className="flex items-center justify-center gap-2 text-success font-semibold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Password Successfully Updated</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Credentials synchronized. Entering workspace...
                </p>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label htmlFor="password" className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">
                    New Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="default"
                  className="w-full h-10 font-semibold shadow-subtle mt-2"
                  isLoading={isLoading}
                >
                  Update Password & Enter <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-border pt-4 text-xs text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline font-medium">
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
