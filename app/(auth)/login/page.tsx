import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign In — IdeaEra",
  description: "Sign in to your IdeaEra account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirectedFrom?: string; error?: string }>;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const resolvedParams = searchParams ? await searchParams : undefined;
    const destination = resolvedParams?.redirectedFrom || "/dashboard";

    // If already authenticated with a valid session, redirect immediately
    if (user) {
      redirect(destination.startsWith("/") ? destination : "/dashboard");
    }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    // If Supabase client fails or is unconfigured, proceed to render LoginForm safely
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center gradient-mesh">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
