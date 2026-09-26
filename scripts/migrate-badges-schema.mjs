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

async function migrate() {
  await client.connect();
  console.log("=== MIGRATING BADGE & ACHIEVEMENT SYSTEM SCHEMA ===");

  try {
    // 1. Create badges table
    console.log("1. Creating public.badges table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT 'indigo',
        tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold')),
        category TEXT NOT NULL CHECK (category IN ('idea_creator', 'problem_solver', 'team_player', 'hackathon_achiever', 'project_builder', 'collaborator', 'top_performer')),
        criteria_type TEXT NOT NULL,
        criteria_value INTEGER NOT NULL DEFAULT 1,
        criteria_description TEXT NOT NULL,
        why_it_matters TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 2. Create user_badges table
    console.log("2. Creating public.user_badges table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
        awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        awarded_by TEXT NOT NULL DEFAULT 'system',
        evidence JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id)
      );
    `);

    // 3. Add performance indexes
    console.log("3. Creating performance indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id, awarded_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
      CREATE INDEX IF NOT EXISTS idx_badges_tier ON public.badges(tier);
      CREATE INDEX IF NOT EXISTS idx_badges_category ON public.badges(category);
    `);

    // 4. Enable Row Level Security (RLS)
    console.log("4. Configuring Row Level Security policies...");
    await client.query(`
      ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.badges;
      CREATE POLICY "Badges are viewable by everyone" ON public.badges FOR SELECT USING (true);

      DROP POLICY IF EXISTS "User badges are viewable by everyone" ON public.user_badges;
      CREATE POLICY "User badges are viewable by everyone" ON public.user_badges FOR SELECT USING (true);
    `);

    // 5. Seed standard badge definitions
    console.log("5. Seeding normalized badge catalog...");
    const badges = [
      // Bronze Tiers
      {
        name: "Idea Spark",
        slug: "idea-spark",
        description: "Published a verified innovation concept with complete problem and solution statements.",
        icon: "Lightbulb",
        color: "amber",
        tier: "bronze",
        category: "idea_creator",
        criteria_type: "ideas_created",
        criteria_value: 1,
        criteria_description: "Publish 1 validated idea",
        why_it_matters: "Every monumental product starts with a single articulated idea. This honors innovators who take the first step from concept to definition."
      },
      {
        name: "Venture Builder",
        slug: "venture-builder",
        description: "Initiated and published an active software product or prototype.",
        icon: "FolderGit2",
        color: "indigo",
        tier: "bronze",
        category: "project_builder",
        criteria_type: "projects_created",
        criteria_value: 1,
        criteria_description: "Build & publish 1 project",
        why_it_matters: "Turns theoretical ideas into tangible code. Recognizes users who ship real software artifacts."
      },
      {
        name: "Network Innovator",
        slug: "network-innovator",
        description: "Formed a verified professional connection with a fellow creator.",
        icon: "Users",
        color: "cyan",
        tier: "bronze",
        category: "collaborator",
        criteria_type: "connections_count",
        criteria_value: 1,
        criteria_description: "Form 1 verified connection",
        why_it_matters: "Collaboration multiplies capabilities. Demonstrates active outreach within the innovation ecosystem."
      },
      {
        name: "Hackathon Contender",
        slug: "hackathon-contender",
        description: "Active participant in hackathons and competitive engineering sprints.",
        icon: "Trophy",
        color: "purple",
        tier: "bronze",
        category: "hackathon_achiever",
        criteria_type: "hackathons_count",
        criteria_value: 1,
        criteria_description: "Participate in 1 hackathon sprint",
        why_it_matters: "Hackathons challenge developers to produce high-velocity innovation under strict deadlines."
      },

      // Silver Tiers
      {
        name: "Prolific Ideator",
        slug: "prolific-ideator",
        description: "Authored 3 or more distinct validated ideas across technology domains.",
        icon: "Sparkles",
        color: "amber",
        tier: "silver",
        category: "idea_creator",
        criteria_type: "ideas_created",
        criteria_value: 3,
        criteria_description: "Publish 3 validated ideas",
        why_it_matters: "Demonstrates sustained creative problem solving and depth of domain thinking."
      },
      {
        name: "Ship Architect",
        slug: "ship-architect",
        description: "Engineered and shipped 2 or more complete projects or working prototypes.",
        icon: "Rocket",
        color: "indigo",
        tier: "silver",
        category: "project_builder",
        criteria_type: "projects_created",
        criteria_value: 2,
        criteria_description: "Build & publish 2 projects",
        why_it_matters: "Proves consistency in software engineering and execution capability."
      },
      {
        name: "Synergy Catalyst",
        slug: "synergy-catalyst",
        description: "Established a collaborative network of 3 or more verified innovator connections.",
        icon: "UserCheck",
        color: "cyan",
        tier: "silver",
        category: "collaborator",
        criteria_type: "connections_count",
        criteria_value: 3,
        criteria_description: "Establish 3 verified connections",
        why_it_matters: "Catalyzes multidisciplinary teams by connecting designers, backend developers, and AI researchers."
      },
      {
        name: "High Performer",
        slug: "high-performer",
        description: "Cross-functional achievement in concept formulation and project implementation.",
        icon: "Zap",
        color: "emerald",
        tier: "silver",
        category: "top_performer",
        criteria_type: "composite",
        criteria_value: 3,
        criteria_description: "Combine 2 ideas and 1 project",
        why_it_matters: "Recognizes well-rounded contributors who both conceive solutions and build prototypes."
      },

      // Gold Tier
      {
        name: "Top Performer",
        slug: "top-performer",
        description: "Pinnacle achievement recognizing demonstrated excellence across ideation, engineering, and collaboration.",
        icon: "Award",
        color: "amber",
        tier: "gold",
        category: "top_performer",
        criteria_type: "composite",
        criteria_value: 6,
        criteria_description: "Publish 3 ideas, build 1 project, and form 2 connections",
        why_it_matters: "Awarded exclusively to top-tier leaders who consistently drive innovation from initial concept to shipped product and cross-squad collaboration."
      }
    ];

    for (const b of badges) {
      await client.query(`
        INSERT INTO public.badges (
          name, slug, description, icon, color, tier, category, criteria_type, criteria_value, criteria_description, why_it_matters
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          icon = EXCLUDED.icon,
          color = EXCLUDED.color,
          tier = EXCLUDED.tier,
          category = EXCLUDED.category,
          criteria_type = EXCLUDED.criteria_type,
          criteria_value = EXCLUDED.criteria_value,
          criteria_description = EXCLUDED.criteria_description,
          why_it_matters = EXCLUDED.why_it_matters,
          updated_at = now();
      `, [
        b.name, b.slug, b.description, b.icon, b.color, b.tier, b.category, b.criteria_type, b.criteria_value, b.criteria_description, b.why_it_matters
      ]);
      console.log(` - Upserted badge [${b.tier.toUpperCase()}] ${b.name}`);
    }

    console.log("\n=== BADGE SYSTEM MIGRATION COMPLETE ===");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

migrate();
