import fs from "fs";
import path from "path";
import pg from "pg";
import { execSync } from "child_process";

// -----------------------------------------------------------------------------
// 1. SCAN DIRECTORIES FOR HARDCODED SECRETS (WITHOUT PRINTING SECRETS)
// -----------------------------------------------------------------------------
const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".system_generated",
  "dist",
  "build",
]);

const SECRET_PATTERNS = [
  { name: "PostgreSQL connection string with credentials", regex: /postgres(ql)?:\/\/[a-zA-Z0-9_\-\.]+:[^@\s"']+@[a-zA-Z0-9_\-\.]+/i },
  { name: "Supabase service_role JWT", regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/ },
  { name: "Hardcoded API Key / Secret variable assignment", regex: /(api_key|service_role_key|secret_key|private_key|password)\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}["']/i },
  { name: "Bearer token hardcoded", regex: /["']Bearer\s+[a-zA-Z0-9_\-\.]{20,}["']/i },
];

const findings = {
  hardcodedSecrets: [],
  clientExposedSecrets: [],
  gitExposures: [],
  rlsStatus: [],
  envConfigIssues: [],
};

function scanFileForSecrets(filePath) {
  // Don't scan .env and .env.local since they are expected to hold local secrets
  const baseName = path.basename(filePath);
  if (baseName === ".env" || baseName === ".env.local") return;

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    // Ignore comments that explicitly say example or placeholder
    if (line.includes("your-project") || line.includes("[PASSWORD]") || line.includes("placeholder")) {
      return;
    }

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(line)) {
        findings.hardcodedSecrets.push({
          file: filePath,
          line: idx + 1,
          type: pattern.name,
        });
        break;
      }
    }
  });
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        walkDir(path.join(dir, entry.name));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".md", ".yml", ".yaml"].includes(ext) || entry.name.startsWith(".env")) {
        scanFileForSecrets(path.join(dir, entry.name));
      }
    }
  }
}

// -----------------------------------------------------------------------------
// 2. CHECK CLIENT-SIDE FOR SERVER SECRETS
// -----------------------------------------------------------------------------
function scanClientSideComponents(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        scanClientSideComponents(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
      const content = fs.readFileSync(fullPath, "utf8");
      const isClientComponent = content.includes('"use client"') || content.includes("'use client'");

      if (isClientComponent) {
        if (content.includes("SUPABASE_SERVICE_ROLE_KEY") || content.includes("DATABASE_URL")) {
          findings.clientExposedSecrets.push({
            file: fullPath,
            issue: "Client component references server-only secret env var name",
          });
        }
        if (content.includes("/admin") && content.includes("@/lib/supabase/admin")) {
          findings.clientExposedSecrets.push({
            file: fullPath,
            issue: "Client component imports Supabase admin / service role client",
          });
        }
      }

      // Check if any NEXT_PUBLIC_ variable holds sensitive words
      const nextPublicMatches = content.match(/NEXT_PUBLIC_[A-Z0-9_]+/g);
      if (nextPublicMatches) {
        for (const envVar of nextPublicMatches) {
          if (envVar.includes("SECRET") || envVar.includes("SERVICE_ROLE") || envVar.includes("PASSWORD") || envVar.includes("PRIVATE")) {
            findings.clientExposedSecrets.push({
              file: fullPath,
              issue: `Potentially sensitive variable name exposed via NEXT_PUBLIC prefix: ${envVar}`,
            });
          }
        }
      }
    }
  }
}

// -----------------------------------------------------------------------------
// 3. CHECK GIT COMMIT HISTORY FOR COMMITTED SECRETS
// -----------------------------------------------------------------------------
function scanGitHistory() {
  try {
    // Search git log for commits that added postgres:// or service_role or env files
    const logOutput = execSync(
      'git log --all --grep="secret\\|password\\|key\\|credential" --oneline -n 20',
      { encoding: "utf8" }
    );
    if (logOutput.trim()) {
      const commits = logOutput.trim().split("\n");
      for (const commit of commits) {
        findings.gitExposures.push({
          type: "Commit message mentioning sensitive keywords",
          detail: commit,
        });
      }
    }

    // Check if .env or .env.local was ever committed to git history
    const envHistory = execSync(
      'git log --all --full-history -- ".env" ".env.local" ".env.production"',
      { encoding: "utf8" }
    );
    if (envHistory.trim()) {
      findings.gitExposures.push({
        type: "Env file present in Git history",
        detail: "One or more .env files appear in Git log history",
      });
    }

    // Check if any commit touched credentials in scripts/
    try {
      const grepCommits = execSync(
        'git log --all -S "postgresql://postgres:" --oneline -n 10',
        { encoding: "utf8" }
      );
      if (grepCommits.trim()) {
        findings.gitExposures.push({
          type: "Database URL / credentials detected in Git commit history",
          detail: `${grepCommits.trim().split("\n").length} commits in history contain hardcoded database URL (Credential rotation required)`,
        });
      }
    } catch {
      // No commits matched
    }
  } catch (err) {
    findings.gitExposures.push({
      type: "Git scan error",
      detail: err.message,
    });
  }
}

// -----------------------------------------------------------------------------
// 4. CHECK DATABASE RLS POLICIES ACROSS ALL PUBLIC TABLES
// -----------------------------------------------------------------------------
async function scanDatabaseRLS() {
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
    console.log("No DATABASE_URL available to scan DB RLS.");
    return;
  }

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT 
        c.relname AS table_name,
        c.relrowsecurity AS rls_enabled,
        (SELECT count(*) FROM pg_policy pol WHERE pol.polrelid = c.oid) AS policy_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname;
    `);

    for (const row of res.rows) {
      findings.rlsStatus.push({
        table: row.table_name,
        rlsEnabled: row.rls_enabled,
        policyCount: parseInt(row.policy_count, 10),
      });
    }
    await client.end();
  } catch (err) {
    console.error("DB RLS scan error:", err.message);
  }
}

// -----------------------------------------------------------------------------
// 5. RUN SCAN AND PRINT STRUCTURED AUDIT
// -----------------------------------------------------------------------------
async function run() {
  console.log("Starting repository security audit scan...\n");

  walkDir(process.cwd());
  scanClientSideComponents(path.join(process.cwd(), "app"));
  scanClientSideComponents(path.join(process.cwd(), "components"));
  scanGitHistory();
  await scanDatabaseRLS();

  console.log("==================================================================");
  console.log("   SECURITY AUDIT SCAN RESULTS (REDACTED)");
  console.log("==================================================================\n");

  console.log(`1. Hardcoded Secrets in Codebase: ${findings.hardcodedSecrets.length} found`);
  for (const h of findings.hardcodedSecrets) {
    const relPath = path.relative(process.cwd(), h.file);
    console.log(`   - [${h.type}] in ${relPath}:${h.line}`);
  }

  console.log(`\n2. Client-Side Secret Exposure: ${findings.clientExposedSecrets.length} found`);
  for (const c of findings.clientExposedSecrets) {
    const relPath = path.relative(process.cwd(), c.file);
    console.log(`   - ${relPath}: ${c.issue}`);
  }

  console.log(`\n3. Git History Exposures: ${findings.gitExposures.length} found`);
  for (const g of findings.gitExposures) {
    console.log(`   - [${g.type}]: ${g.detail}`);
  }

  console.log(`\n4. Database Tables RLS Status: ${findings.rlsStatus.length} tables inspected`);
  const tablesWithoutRLS = findings.rlsStatus.filter((t) => !t.rlsEnabled);
  if (tablesWithoutRLS.length === 0) {
    console.log("   ✅ All public database tables have Row Level Security (RLS) ENABLED!");
  } else {
    console.log(`   ⚠️ Tables with RLS DISABLED (${tablesWithoutRLS.length}):`);
    for (const t of tablesWithoutRLS) {
      console.log(`      - ${t.table} (Policies: ${t.policyCount})`);
    }
  }

  const tablesWithoutPolicies = findings.rlsStatus.filter((t) => t.rlsEnabled && t.policyCount === 0);
  if (tablesWithoutPolicies.length > 0) {
    console.log(`   ⚠️ Tables with RLS enabled but 0 policies (${tablesWithoutPolicies.length}) [Default deny]:`);
    for (const t of tablesWithoutPolicies) {
      console.log(`      - ${t.table}`);
    }
  }

  // Save report JSON
  fs.writeFileSync(
    "scripts/security-audit-report.json",
    JSON.stringify(findings, null, 2),
    "utf8"
  );
  console.log("\nScan complete. Output saved to scripts/security-audit-report.json.");
}

run().catch((err) => {
  console.error("Audit scan failed:", err);
  process.exit(1);
});
