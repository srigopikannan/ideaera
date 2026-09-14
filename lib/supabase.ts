import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

function getCredentials(): { supabaseUrl: string; supabaseAnonKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function createClient(): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getCredentials();
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

let cachedClient: SupabaseClient | undefined;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!cachedClient) {
      cachedClient = createClient();
    }
    const value = cachedClient[prop as keyof SupabaseClient];
    if (typeof value === "function") {
      return value.bind(cachedClient);
    }
    return value;
  },
});