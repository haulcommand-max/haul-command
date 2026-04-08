/**
 * Haul Command Migration Runner
 * 
 * Executes SQL migration files against production Supabase
 * via the PostgREST/Management API, bypassing the Supabase CLI entirely.
 * 
 * This solves the Windows UnauthorizedAccess blocker.
 * 
 * Usage:
 *   npx tsx scripts/run-migrations.ts
 *   npx tsx scripts/run-migrations.ts --file 20260408_001_core_entities.sql
 *   npx tsx scripts/run-migrations.ts --dry-run
 */

import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const MIGRATIONS_DIR = path.resolve(__dirname, "../supabase/migrations");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

interface MigrationResult {
  file: string;
  status: "success" | "failed" | "skipped";
  error?: string;
  duration_ms?: number;
}

async function executeSql(sql: string): Promise<{ ok: boolean; error?: string }> {
  // Use the Supabase SQL endpoint (service-role required)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (response.ok) {
    return { ok: true };
  }

  // Fallback: try the raw pg endpoint  
  const fallbackResponse = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (fallbackResponse.ok) {
    return { ok: true };
  }

  const errorText = await response.text();
  return { ok: false, error: errorText };
}

async function executeSqlViaPooler(sql: string): Promise<{ ok: boolean; error?: string }> {
  // Use the Supabase database REST endpoint
  // This endpoint accepts raw SQL when using service-role key
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: "return=minimal",
    },
    body: sql,
  });

  if (response.ok || response.status === 200 || response.status === 204) {
    return { ok: true };
  }

  const err = await response.text();
  return { ok: false, error: err };
}

async function createMigrationTrackingTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS public._hc_migrations (
      id serial PRIMARY KEY,
      filename text UNIQUE NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now(),
      status text NOT NULL DEFAULT 'applied'
    );
  `;
  await executeSql(sql);
}

async function isAlreadyApplied(filename: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/_hc_migrations?filename=eq.${encodeURIComponent(filename)}&select=id`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) && data.length > 0;
    }
  } catch {
    // Table might not exist yet
  }
  return false;
}

async function markApplied(filename: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/_hc_migrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ filename, status: "applied" }),
  });
}

async function runMigrations(opts: { singleFile?: string; dryRun?: boolean }) {
  console.log("🔧 Haul Command Migration Runner");
  console.log(`   Target: ${SUPABASE_URL}`);
  console.log(`   Migrations dir: ${MIGRATIONS_DIR}`);
  console.log("");

  // Ensure tracking table exists
  await createMigrationTrackingTable();

  // Get migration files
  let files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (opts.singleFile) {
    files = files.filter((f) => f.includes(opts.singleFile!));
    if (files.length === 0) {
      console.error(`❌ No migration file matching: ${opts.singleFile}`);
      process.exit(1);
    }
  }

  console.log(`📋 Found ${files.length} migration file(s)\n`);

  const results: MigrationResult[] = [];

  for (const file of files) {
    const startTime = Date.now();

    // Check if already applied
    const applied = await isAlreadyApplied(file);
    if (applied) {
      console.log(`⏭️  ${file} — already applied, skipping`);
      results.push({ file, status: "skipped" });
      continue;
    }

    const sqlPath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(sqlPath, "utf8");

    if (opts.dryRun) {
      console.log(`🔍 [DRY RUN] ${file} — ${sql.length} bytes`);
      results.push({ file, status: "skipped" });
      continue;
    }

    console.log(`🚀 Executing: ${file}...`);

    const result = await executeSql(sql);
    const duration = Date.now() - startTime;

    if (result.ok) {
      await markApplied(file);
      console.log(`✅ ${file} — applied in ${duration}ms`);
      results.push({ file, status: "success", duration_ms: duration });
    } else {
      console.error(`❌ ${file} — FAILED`);
      console.error(`   Error: ${result.error?.slice(0, 300)}`);
      results.push({ file, status: "failed", error: result.error, duration_ms: duration });
      
      // Stop on first failure
      console.error("\n⛔ Stopping migration run due to failure.");
      break;
    }
  }

  // Summary
  console.log("\n════════════════════════════════");
  console.log("MIGRATION SUMMARY");
  console.log("════════════════════════════════");
  const succeeded = results.filter((r) => r.status === "success").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  console.log(`  ✅ Succeeded: ${succeeded}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log("");

  if (failed > 0) {
    process.exit(1);
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileArgIdx = args.indexOf("--file");
const singleFile = fileArgIdx !== -1 && args[fileArgIdx + 1] ? args[fileArgIdx + 1] : undefined;

runMigrations({ singleFile, dryRun }).catch((e) => {
  console.error(e);
  process.exit(1);
});
