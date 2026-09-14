import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("Auth callback error:", error.message);
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
      }
      // Successful authentication redirect to profile
      return NextResponse.redirect(`${origin}/profile`);
    } catch (err: any) {
      console.error("Auth callback unexpected error:", err);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Authentication exchange failed.")}`);
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/profile`);
}
