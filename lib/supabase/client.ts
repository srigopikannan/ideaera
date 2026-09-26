import { createBrowserClient } from "@supabase/ssr";
import { parse, serialize } from "cookie";

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseUrl = rawUrl.trim().replace(/^["']|["']$/g, "");

  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";
  const supabaseAnonKey = rawKey.trim().replace(/^["']|["']$/g, "");

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Supabase client initialized without NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (typeof document === "undefined") return [];
        const parsed = parse(document.cookie);
        return Object.keys(parsed).map((name) => ({
          name,
          value: parsed[name] ?? "",
        }));
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        if (typeof document === "undefined") return;
        const parsed = parse(document.cookie);
        // If sb-remember is explicitly 'false', keep cookies as session cookies (clear on browser close)
        const isRemember = parsed["sb-remember"] !== "false";

        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions: any = {
            path: "/",
            sameSite: "lax",
            ...options,
          };
          if (!isRemember && value) {
            delete cookieOptions.maxAge;
            delete cookieOptions.expires;
          } else if (isRemember && value && !cookieOptions.maxAge) {
            cookieOptions.maxAge = 60 * 60 * 24 * 365; // 1 year
          }
          document.cookie = serialize(name, value, cookieOptions);
        });
      },
    },
  });
}
