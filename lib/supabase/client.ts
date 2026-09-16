import { createBrowserClient } from "@supabase/ssr";

const REAL_SUPABASE_URL = "https://jhmnemzgbcwcryzolzbz.supabase.co";
const REAL_SUPABASE_ANON_KEY = "sb_publishable_8ddKnV869Oj7ZQ1LHJ7myQ_ifOmyhxD";

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    REAL_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    REAL_SUPABASE_ANON_KEY;

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
