/**
 * Haul Command Migration Runner — Zero CLI dependency
 * 
 * IMPORTANT: This script uses only Node.js built-ins + fetch.
 * No npx, no tsx, no supabase CLI needed.
 * 
 * Run with: node scripts/run-migrations.mjs
 * Or:       node scripts/run-migrations.mjs --file 20260408_001
 * Or:       node scripts/run-migrations.mjs --dry-run
 * Or:       node scripts/run-migrations.mjs --only-new
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────
const SUPABASE_URL = "https://hvjyfyzotqobfkakjozp.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938";
const MIGRATIONS_DIR = path.resolve(__dirname, "../supabase/migrations");

// ── SQL Execution via Supabase pg-meta endpoint ───────
async function executeSql(sql) {
  // The Supabase management API exposes a SQL execution endpoint
  // at /rest/v1/rpc/{function_name}, but for DDL we need the
  // pg-meta route or we can create an RPC wrapper.
  //
  // Strategy: Create a temporary RPC function, call it, drop it.
  // This works with any Supabase project using service-role key.

  const wrappedSql = `
    DO $hc_migration$
    BEGIN
      ${sql.replace(/\$/g, '$$$$')}
    END;
    $hc_migration$;
  `;

  // Try the PostgREST RPC approach using a pre-existing function
  // First, try to create the executor function if it doesn't exist
  const createExecFn = `
    CREATE OR REPLACE FUNCTION _hc_exec_sql(query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
    BEGIN
      EXECUTE query;
    END;
    $fn$;
  `;

  // Bootstrap: create the exec function via the REST API
  const bootstrapResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/_hc_exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: "SELECT 1" }),
  });

  if (!bootstrapResp.ok && bootstrapResp.status === 404) {
    // Function doesn't exist, need to create it via the SQL editor endpoint
    console.log("   ℹ️  Bootstrap: creating _hc_exec_sql function...");
    
    const sqlEditorResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: createExecFn }),
    });

    // If that also fails, try the pg endpoint directly
    if (!sqlEditorResp.ok) {
      console.log("   ⚠️  Standard RPC bootstrap unavailable. Using direct table approach...");
      return await executeSqlViaDirectInsert(sql);
    }
  }

  // Now execute the actual migration SQL
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/_hc_exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (resp.ok || resp.status === 204) {
    return { ok: true };
  }

  const errText = await resp.text();
  return { ok: false, error: errText };
}

// Fallback: split SQL into individual statements and run via the table endpoint
async function executeSqlViaDirectInsert(sql) {
  // This is the nuclear option — we split the SQL and run each statement
  // through a temporary table + trigger approach. However, the simplest
  // approach is to just use the Supabase Dashboard SQL Editor API.
  
  // Try the Management API (requires PAT or service role)
  const resp = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (resp.ok) return { ok: true };

  const errText = await resp.text();
  return { ok: false, error: errText };
}

// ── Migration tracking ────────────────────────────────
async function ensureTrackingTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS public._hc_migrations (
      id serial PRIMARY KEY,
      filename text UNIQUE NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now(),
      status text NOT NULL DEFAULT 'applied',
      duration_ms integer
    );
  `;
  return await executeSql(sql);
}

async function getAppliedMigrations() {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/_hc_migrations?select=filename&order=id.asc`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!resp.ok) return new Set();
  const data = await resp.json();
  return new Set(data.map((r) => r.filename));
}

async function recordMigration(filename, durationMs) {
  await fetch(`${SUPABASE_URL}/rest/v1/_hc_migrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      filename,
      status: "applied",
      duration_ms: durationMs,
    }),
  });
}

// ── Main ──────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyNew = args.includes("--only-new");
  const fileArgIdx = args.indexOf("--file");
  const fileFilter = fileArgIdx !== -1 ? args[fileArgIdx + 1] : null;

  console.log("═══════════════════════════════════════");
  console.log("  HAUL COMMAND MIGRATION RUNNER");
  console.log("═══════════════════════════════════════");
  console.log(`  Target:  ${SUPABASE_URL}`);
  console.log(`  Dir:     ${MIGRATIONS_DIR}`);
  console.log(`  Dry run: ${dryRun}`);
  console.log("");

  // 1. Ensure tracking table
  console.log("📋 Ensuring migration tracking table...");
  const trackResult = await ensureTrackingTable();
  if (!trackResult.ok) {
    console.log("   ⚠️  Could not create tracking table. Will proceed without tracking.");
    console.log(`   Detail: ${trackResult.error?.slice(0, 200)}`);
  } else {
    console.log("   ✅ Tracking table ready.");
  }

  // 2. Get already-applied migrations
  const applied = await getAppliedMigrations();
  console.log(`   Already applied: ${applied.size} migrations\n`);

  // 3. Get migration files
  let files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (fileFilter) {
    files = files.filter((f) => f.includes(fileFilter));
  }

  if (onlyNew) {
    // Only run 20260408_* migrations (the Discovery Graph pack)
    files = files.filter((f) => f.startsWith("20260408"));
  }

  console.log(`📂 Migration files to process: ${files.length}\n`);

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`⏭️  ${file} — already applied`);
      skipped++;
      continue;
    }

    const sqlPath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(sqlPath, "utf8");

    if (dryRun) {
      console.log(`🔍 [DRY] ${file} — ${sql.length} bytes`);
      skipped++;
      continue;
    }

    console.log(`🚀 ${file}...`);
    const start = Date.now();
    const result = await executeSql(sql);
    const duration = Date.now() - start;

    if (result.ok) {
      await recordMigration(file, duration);
      console.log(`   ✅ Applied in ${duration}ms`);
      succeeded++;
    } else {
      console.error(`   ❌ FAILED: ${result.error?.slice(0, 300)}`);
      failed++;
      console.error("\n⛔ Stopping on first failure.\n");
      break;
    }
  }

  // Summary
  console.log("\n═══════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("═══════════════════════════════════════");
  console.log(`  ✅ Succeeded: ${succeeded}`);
  console.log(`  ❌ Failed:    ${failed}`);
  console.log(`  ⏭️  Skipped:  ${skipped}`);
  console.log("");

  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
