"use client";

import * as React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError("Please enter your account email address.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : "/reset-password";

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset email. Please try again.");
    } finally {
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
            Account Access Recovery
          </p>
        </div>

        <Card className="border-border shadow-elevated bg-surface/95 backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Reset Your Password</CardTitle>
            <CardDescription>
              Enter the email address associated with your Idea Era account and we&apos;ll dispatch a secure recovery link.
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
              <div className="p-4 rounded-xl bg-success/10 border border-success/20 space-y-2">
                <div className="flex items-center gap-2 text-success font-medium text-sm">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>Recovery Signal Dispatched</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We have sent password reset instructions to <strong className="text-foreground">{email}</strong>. Check your inbox and follow the secure link.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label htmlFor="email" className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">
                    Account Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="h-4 w-4" />}
                    required
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  variant="default"
                  className="w-full h-10 font-semibold shadow-subtle mt-2"
                  isLoading={isLoading}
                >
                  Send Recovery Link <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
            <Link href="/signup" className="text-muted-foreground hover:text-foreground">
              Create Account
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
