/**
 * Haul Command Migration Runner — Direct Postgres via pg
 * 
 * Zero CLI dependency. Uses the pg module + pooler URL to execute
 * DDL directly against production Supabase.
 * 
 * Run: node scripts/run-migrations-pg.mjs
 *      node scripts/run-migrations-pg.mjs --only-new
 *      node scripts/run-migrations-pg.mjs --file 20260408_001
 *      node scripts/run-migrations-pg.mjs --dry-run
 */

const { Client } = require("pg");
const fs = require("node:fs");
const path = require("node:path");

const POOLER_URL =
  "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres";
const MIGRATIONS_DIR = path.resolve(__dirname, "../supabase/migrations");

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyNew = args.includes("--only-new");
  const fileArgIdx = args.indexOf("--file");
  const fileFilter = fileArgIdx !== -1 ? args[fileArgIdx + 1] : null;

  console.log("═══════════════════════════════════════");
  console.log("  HAUL COMMAND MIGRATION RUNNER (pg)");
  console.log("═══════════════════════════════════════");
  console.log(`  Dir:     ${MIGRATIONS_DIR}`);
  console.log(`  Dry run: ${dryRun}`);
  console.log("");

  const client = new Client({
    connectionString: POOLER_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("🔌 Connecting to Supabase Postgres...");
    await client.connect();
    console.log("   ✅ Connected.\n");

    // 1. Ensure tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._hc_migrations (
        id serial PRIMARY KEY,
        filename text UNIQUE NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now(),
        status text NOT NULL DEFAULT 'applied',
        duration_ms integer
      );
    `);
    console.log("📋 Migration tracking table ready.");

    // 2. Get already-applied
    const { rows: appliedRows } = await client.query(
      "SELECT filename FROM public._hc_migrations ORDER BY id"
    );
    const applied = new Set(appliedRows.map((r) => r.filename));
    console.log(`   Already applied: ${applied.size} migrations\n`);

    // 3. Get migration files
    let files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (fileFilter) {
      files = files.filter((f) => f.includes(fileFilter));
    }
    if (onlyNew) {
      files = files.filter((f) => f.startsWith("20260408"));
    }

    console.log(`📂 Migrations to process: ${files.length}\n`);

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

      try {
        await client.query(sql);
        const duration = Date.now() - start;

        // Record in tracking table
        await client.query(
          "INSERT INTO public._hc_migrations (filename, duration_ms) VALUES ($1, $2) ON CONFLICT (filename) DO NOTHING",
          [file, duration]
        );

        console.log(`   ✅ Applied in ${duration}ms`);
        succeeded++;
      } catch (err) {
        const duration = Date.now() - start;
        console.error(`   ❌ FAILED (${duration}ms): ${err.message}`);
        failed++;

        // Log but continue — many migrations use IF NOT EXISTS
        if (err.message.includes("already exists")) {
          console.log(`   ℹ️  Objects already exist. Recording as applied.`);
          await client.query(
            "INSERT INTO public._hc_migrations (filename, duration_ms, status) VALUES ($1, $2, 'applied_partial') ON CONFLICT (filename) DO NOTHING",
            [file, duration]
          );
          failed--;
          succeeded++;
        } else {
          console.error("\n⛔ Stopping on hard failure.\n");
          break;
        }
      }
    }

    console.log("\n═══════════════════════════════════════");
    console.log("  SUMMARY");
    console.log("═══════════════════════════════════════");
    console.log(`  ✅ Succeeded: ${succeeded}`);
    console.log(`  ❌ Failed:    ${failed}`);
    console.log(`  ⏭️  Skipped:  ${skipped}`);
    console.log("");

    if (failed > 0) process.exit(1);
  } finally {
    await client.end();
    console.log("🔌 Connection closed.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
