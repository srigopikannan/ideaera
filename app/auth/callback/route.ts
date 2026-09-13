import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    const supabase = createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);

      return NextResponse.redirect(
        `${origin}/login?error=confirmation_failed`
      );
    }

    return NextResponse.redirect(`${origin}/profile`);
  } catch (error) {
    console.error("Auth callback exception:", error);

    return NextResponse.redirect(
      `${origin}/login?error=confirmation_failed`
    );
  }
}