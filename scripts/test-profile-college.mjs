import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jhmnemzgbcwcryzolzbz.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_8ddKnV869Oj7ZQ1LHJ7myQ_ifOmyhxD";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, college, college_id, college_rel:colleges!college_id(id, name, city, district, state)")
    .limit(3);

  console.log("Joined query result:", data);
  console.log("Joined query error:", error);
}

test().catch(console.error);
