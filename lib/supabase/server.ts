import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const REAL_SUPABASE_URL = "https://jhmnemzgbcwcryzolzbz.supabase.co";
const REAL_SUPABASE_ANON_KEY = "sb_publishable_8ddKnV869Oj7ZQ1LHJ7myQ_ifOmyhxD";

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    REAL_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    REAL_SUPABASE_ANON_KEY;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          const isRemember = cookieStore.get("sb-remember")?.value !== "false";

          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions: any = { ...options };
            if (!isRemember && value) {
              delete cookieOptions.maxAge;
              delete cookieOptions.expires;
            } else if (isRemember && value && !cookieOptions.maxAge) {
              cookieOptions.maxAge = 60 * 60 * 24 * 365;
            }
            cookieStore.set(name, value, cookieOptions);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have proxy/middleware refreshing user sessions.
        }
      },
    },
  });
}
