import { performance } from "perf_hooks";
import pg from "pg";
import fs from "fs";

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl && fs.existsSync(".env")) {
  const m = fs.readFileSync(".env", "utf8").match(/DATABASE_URL=["']?([^"'\r\n]+)/);
  if (m) dbUrl = m[1];
}
if (!dbUrl && fs.existsSync(".env.local")) {
  const m = fs.readFileSync(".env.local", "utf8").match(/DATABASE_URL=["']?([^"'\r\n]+)/);
  if (m) dbUrl = m[1];
}
if (!dbUrl) {
  throw new Error("DATABASE_URL environment variable is required. Please set it in .env or .env.local.");
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function benchmark() {
  await client.connect();
  console.log("=========================================================");
  console.log("     IDEAERA DATABASE & ROUTE QUERY BENCHMARKS          ");
  console.log("=========================================================");

  // Find a test user
  const { rows: [testUser] } = await client.query(
    "SELECT id, username FROM public.profiles LIMIT 1;"
  );
  const userId = testUser ? testUser.id : "d1aabec0-3b89-4c1d-a33d-a6573224f5c2";
  console.log(`Benchmarking with User: ${testUser?.username || "default"} (${userId})\n`);

  async function measure(name, queryFn) {
    const start = performance.now();
    try {
      const res = await queryFn();
      const dur = (performance.now() - start).toFixed(1);
      const rowCount = Array.isArray(res?.rows) ? res.rows.length : (res?.rowCount ?? "N/A");
      console.log(`[${dur.padStart(6)} ms] ${name} (returned ${rowCount} items)`);
      return dur;
    } catch (e) {
      const dur = (performance.now() - start).toFixed(1);
      console.log(`[${dur.padStart(6)} ms] ${name} (ERROR: ${e.message})`);
      return dur;
    }
  }

  // 1. Dashboard queries
  console.log("--- 1. Dashboard Flow Queries ---");
  await measure("Profile: getCurrentUserProfile (select * + joins)", () =>
    client.query(`
      SELECT p.*, c.name as college_name 
      FROM public.profiles p 
      LEFT JOIN public.colleges c ON p.college_id = c.id 
      WHERE p.id = $1`, [userId])
  );
  await measure("People: getAllProfiles (Unbounded SELECT * + 3 joins)", () =>
    client.query(`
      SELECT p.*, c.name as college_name 
      FROM public.profiles p 
      LEFT JOIN public.colleges c ON p.college_id = c.id 
      ORDER BY p.created_at DESC`)
  );
  await measure("Ideas: getIdeas (trending)", () =>
    client.query(`
      SELECT i.*, p.full_name, p.username 
      FROM public.ideas i 
      LEFT JOIN public.profiles p ON i.creator_id = p.id 
      ORDER BY i.created_at DESC`)
  );
  await measure("Hackathons: getHackathons", () =>
    client.query(`
      SELECT h.*, p.full_name 
      FROM public.hackathons h 
      LEFT JOIN public.profiles p ON h.organizer_id = p.id 
      ORDER BY h.start_date ASC`)
  );

  // 2. People & Team Formation queries
  console.log("\n--- 2. People Directory Queries ---");
  await measure("People: Connections map query (or requester/receiver)", () =>
    client.query(`
      SELECT requester_id, receiver_id, status 
      FROM public.connections 
      WHERE requester_id = $1 OR receiver_id = $1`, [userId])
  );

  // 3. Match page queries
  console.log("\n--- 3. Match Engine Queries ---");
  await measure("Match: All candidate projects query", () =>
    client.query(`SELECT id, name, slug, owner_id FROM public.projects`)
  );
  await measure("Match: All candidate ideas query", () =>
    client.query(`SELECT creator_id, category, title FROM public.ideas`)
  );

  // 4. Messages page queries
  console.log("\n--- 4. Messages Queries ---");
  await measure("Messages: Get conversations for user", () =>
    client.query(`
      SELECT DISTINCT ON (conversation_id) 
        id, conversation_id, sender_id, receiver_id, content, created_at, read_at 
      FROM public.messages 
      WHERE sender_id = $1 OR receiver_id = $1 
      ORDER BY conversation_id, created_at DESC`, [userId])
  );
  await measure("Messages: Get message history for conversation", () =>
    client.query(`
      SELECT * FROM public.messages 
      WHERE sender_id = $1 OR receiver_id = $1 
      ORDER BY created_at ASC 
      LIMIT 100`, [userId])
  );

  // 5. Profile page queries (OLD WAY vs TARGETED WAY)
  console.log("\n--- 5. Profile Queries: Old Full Scan vs Targeted ---");
  await measure("[OLD SLOW] All projects in DB (then filtered in memory)", () =>
    client.query(`SELECT * FROM public.projects ORDER BY created_at DESC`)
  );
  await measure("[NEW FAST] Targeted User Projects by owner_id", () =>
    client.query(`
      SELECT id, name, description, owner_id, repository_url, deployment_url, status, created_at 
      FROM public.projects 
      WHERE owner_id = $1 
      ORDER BY created_at DESC`, [userId])
  );

  await measure("[OLD SLOW] All ideas in DB (then filtered in memory)", () =>
    client.query(`SELECT * FROM public.ideas ORDER BY created_at DESC`)
  );
  await measure("[NEW FAST] Targeted User Ideas by creator_id", () =>
    client.query(`
      SELECT id, title, category, stage, likes_count, comments_count, created_at 
      FROM public.ideas 
      WHERE creator_id = $1 
      ORDER BY created_at DESC`, [userId])
  );

  // 6. Notifications queries
  console.log("\n--- 6. Notifications Queries ---");
  await measure("Notifications: getNotifications with joins", () =>
    client.query(`
      SELECT n.*, p.full_name, c.status as conn_status 
      FROM public.notifications n
      LEFT JOIN public.profiles p ON n.actor_id = p.id
      LEFT JOIN public.connections c ON n.connection_id = c.id
      WHERE n.recipient_id = $1 OR n.user_id = $1
      ORDER BY n.created_at DESC`, [userId])
  );

  await client.end();
}

benchmark().catch(console.error);
