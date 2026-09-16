import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (forwardedHost ? `${forwardedProto}://${forwardedHost}` : requestUrl.origin || "https://ideaera.vercel.app");

  const redirectedFrom = requestUrl.searchParams.get("redirectedFrom") || "/dashboard";
  const targetPath = redirectedFrom.startsWith("/") ? redirectedFrom : "/dashboard";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("Auth callback error:", error.message);
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
      }
      // Successful authentication redirect to target path
      return NextResponse.redirect(`${origin}${targetPath}`);
    } catch (err: any) {
      console.error("Auth callback unexpected error:", err);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Authentication exchange failed.")}`);
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}${targetPath}`);
}
