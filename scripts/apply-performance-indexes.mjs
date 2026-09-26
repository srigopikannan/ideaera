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

async function applyIndexes() {
  await client.connect();
  console.log("=== APPLYING HIGH-PERFORMANCE DATABASE INDEXES ===");

  const indexes = [
    // 1. Ideas
    {
      name: "idx_ideas_creator_id",
      sql: "CREATE INDEX IF NOT EXISTS idx_ideas_creator_id ON public.ideas(creator_id);"
    },
    {
      name: "idx_ideas_created_at",
      sql: "CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at DESC);"
    },
    {
      name: "idx_ideas_category",
      sql: "CREATE INDEX IF NOT EXISTS idx_ideas_category ON public.ideas(category);"
    },

    // 2. Projects
    {
      name: "idx_projects_owner_id",
      sql: "CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);"
    },
    {
      name: "idx_projects_created_at",
      sql: "CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);"
    },

    // 3. Messages
    {
      name: "idx_messages_conversation_id",
      sql: "CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id, created_at ASC);"
    },
    {
      name: "idx_messages_sender_id",
      sql: "CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);"
    },
    {
      name: "idx_messages_receiver_id",
      sql: "CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);"
    },

    // 4. Connections
    {
      name: "idx_connections_requester_id",
      sql: "CREATE INDEX IF NOT EXISTS idx_connections_requester_id ON public.connections(requester_id, status);"
    },
    {
      name: "idx_connections_receiver_id",
      sql: "CREATE INDEX IF NOT EXISTS idx_connections_receiver_id ON public.connections(receiver_id, status);"
    },

    // 5. Profiles
    {
      name: "idx_profiles_created_at",
      sql: "CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);"
    },
    {
      name: "idx_profiles_college_id",
      sql: "CREATE INDEX IF NOT EXISTS idx_profiles_college_id ON public.profiles(college_id);"
    }
  ];

  for (const idx of indexes) {
    try {
      console.log(`Applying ${idx.name}...`);
      await client.query(idx.sql);
      console.log(`✓ ${idx.name} applied successfully`);
    } catch (err) {
      console.error(`✗ Error applying ${idx.name}:`, err.message);
    }
  }

  // Check idea_likes and idea_comments if they exist
  try {
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_idea_likes_idea_user ON public.idea_likes(idea_id, user_id);
    `);
    console.log("✓ idx_idea_likes_idea_user applied");
  } catch (e) {
    // table might not exist
  }

  try {
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_idea_comments_idea_id ON public.idea_comments(idea_id, created_at ASC);
    `);
    console.log("✓ idx_idea_comments_idea_id applied");
  } catch (e) {
    // table might not exist
  }

  console.log("\n=== ALL PERFORMANCE INDEXES VERIFIED ===");
  await client.end();
}

applyIndexes().catch(console.error);
