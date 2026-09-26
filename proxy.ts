import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Apply baseline defense-in-depth HTTP security headers
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  supabaseResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          const isRemember = request.cookies.get("sb-remember")?.value !== "false";

          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions: any = { ...options };
            if (!isRemember && value) {
              delete cookieOptions.maxAge;
              delete cookieOptions.expires;
            } else if (isRemember && value && !cookieOptions.maxAge) {
              cookieOptions.maxAge = 60 * 60 * 24 * 365;
            }
            supabaseResponse.cookies.set(name, value, cookieOptions);
          });
        },
      },
    });

    // Refreshing the auth token
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If authenticated user visits login or signup, redirect directly to dashboard or target
    const isAuthRoute =
      request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/signup";

    if (user && isAuthRoute) {
      const destination = request.nextUrl.searchParams.get("redirectedFrom") || "/dashboard";
      const url = request.nextUrl.clone();
      url.pathname = destination.startsWith("/") ? destination : "/dashboard";
      url.searchParams.delete("redirectedFrom");
      return NextResponse.redirect(url);
    }

    // Protect dashboard routes if unauthenticated in live mode
    const isDashboardRoute =
      request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/profile/edit") ||
      request.nextUrl.pathname.startsWith("/ideas/create") ||
      request.nextUrl.pathname.startsWith("/projects/create") ||
      request.nextUrl.pathname.startsWith("/messages") ||
      request.nextUrl.pathname.startsWith("/connections") ||
      request.nextUrl.pathname.startsWith("/match") ||
      request.nextUrl.pathname.startsWith("/settings");

    if (!user && isDashboardRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectedFrom", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
