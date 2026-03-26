/**
 * migrate.mjs — Apply all pending migrations in supabase/migrations/
 *
 * Usage:
 *   node scripts/migrate.mjs
 *   npm run migrate
 *
 * Env vars (optional overrides):
 *   SUPABASE_PROJECT_REF    — Supabase project reference
 *   SUPABASE_ACCESS_TOKEN   — Supabase Personal Access Token (PAT)
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'hvjyfyzotqobfkakjozp';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_c6b18d697dc25e7677e2b3e7b3c545355f95d4aa';
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

// ── API helper ────────────────────────────────────────────────────────────────

function query(sql) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ query: sql });
        const options = {
            hostname: 'api.supabase.com',
            path: `/v1/projects/${PROJECT_REF}/database/query`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Length': Buffer.byteLength(postData),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(data)); }
                    catch { resolve(data); }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 400)}`));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// ── SQL helpers ───────────────────────────────────────────────────────────────

/**
 * Preprocess SQL before sending to the API.
 *
 * Fixes two common patterns that cause failures:
 *
 * 1. `CREATE POLICY IF NOT EXISTS "x" ON t` — invalid Postgres syntax.
 *    Strips the IF NOT EXISTS clause.
 *
 * 2. `CREATE POLICY "x" ON t` — fails with 42710 if the policy already
 *    exists from a previous (partial) run. We prepend a DROP IF EXISTS so
 *    every policy creation is idempotent.
 */
function preprocessSQL(sql) {
    // 1. Strip invalid IF NOT EXISTS from CREATE POLICY
    sql = sql.replace(/CREATE\s+POLICY\s+IF\s+NOT\s+EXISTS\s+/gi, 'CREATE POLICY ');

    // 2. Before each CREATE POLICY, inject a DROP POLICY IF EXISTS
    sql = sql.replace(
        /\bCREATE\s+POLICY\s+("(?:[^"\\]|\\.)*"|[\w$]+)\s+ON\s+((?:public\.)?[\w$"]+)/gi,
        (match, policyName, tableName) =>
            `DROP POLICY IF EXISTS ${policyName} ON ${tableName} CASCADE;\n${match}`
    );

    // 3. CREATE TABLE → CREATE TABLE IF NOT EXISTS
    sql = sql.replace(/\bCREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS\b)/gi, 'CREATE TABLE IF NOT EXISTS ');

    // 4. CREATE [UNIQUE] INDEX → CREATE [UNIQUE] INDEX IF NOT EXISTS
    sql = sql.replace(/\bCREATE\s+UNIQUE\s+INDEX\s+(?!IF\s+NOT\s+EXISTS\b)(?!CONCURRENTLY\b)/gi, 'CREATE UNIQUE INDEX IF NOT EXISTS ');
    sql = sql.replace(/\bCREATE\s+INDEX\s+(?!IF\s+NOT\s+EXISTS\b)(?!CONCURRENTLY\b)/gi, 'CREATE INDEX IF NOT EXISTS ');

    // 5. CREATE SEQUENCE → CREATE SEQUENCE IF NOT EXISTS
    sql = sql.replace(/\bCREATE\s+SEQUENCE\s+(?!IF\s+NOT\s+EXISTS\b)/gi, 'CREATE SEQUENCE IF NOT EXISTS ');

    // 6. CREATE TRIGGER → CREATE OR REPLACE TRIGGER (PG14+, skip CONSTRAINT TRIGGER)
    sql = sql.replace(/\bCREATE\s+(?!OR\s+REPLACE\b)(?!CONSTRAINT\s+)TRIGGER\s+/gi, 'CREATE OR REPLACE TRIGGER ');

    // 7. CREATE FUNCTION → CREATE OR REPLACE FUNCTION
    sql = sql.replace(/\bCREATE\s+FUNCTION\s+/gi, 'CREATE OR REPLACE FUNCTION ');

    // 8. ADD COLUMN → ADD COLUMN IF NOT EXISTS (idempotent ALTER TABLE)
    sql = sql.replace(/\bADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS\b)/gi, 'ADD COLUMN IF NOT EXISTS ');

    // 9. Before CREATE OR REPLACE VIEW, drop existing view OR table to allow recreation
    sql = sql.replace(
        /\bCREATE\s+OR\s+REPLACE\s+VIEW\s+((?:[\w$"]+\.)?[\w$"]+)/gi,
        (match, viewName) =>
            `DROP VIEW IF EXISTS ${viewName} CASCADE;\nDROP TABLE IF EXISTS ${viewName} CASCADE;\n${match}`
    );

    // 10. ALTER FUNCTION IF EXISTS → ALTER FUNCTION (IF EXISTS invalid in PG15)
    //    The callers already wrap in DO blocks with EXCEPTION handlers.
    sql = sql.replace(/\bALTER\s+FUNCTION\s+IF\s+EXISTS\s+/gi, 'ALTER FUNCTION ');

    // 10. CREATE TYPE ... AS ENUM → guard against duplicate_object.
    //     Replaces `CREATE TYPE schema.name AS ENUM` with a DO block that
    //     silently skips if the type already exists.
    sql = sql.replace(
        /\bCREATE\s+TYPE\s+((?:[\w$"]+\.)?[\w$"]+)\s+AS\s+ENUM\s*(\([^)]*\))\s*;/gis,
        (match, typeName, enumValues) => {
            // Strip schema prefix and double-quotes to get bare type name for pg_type lookup
            const bareTypeName = typeName.replace(/^[\w$"]+\./, '').replace(/"/g, '');
            return `DO $type_guard$ BEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${bareTypeName}') THEN\n    CREATE TYPE ${typeName} AS ENUM ${enumValues};\n  END IF;\nEND $type_guard$;`;
        }
    );

    return sql;
}

function stripTransactionWrapper(sql) {
    return sql
        .replace(/^\s*begin\s*;\s*\n/im, '')
        .replace(/\n\s*commit\s*;\s*$/im, '');
}

// ── Migration log table ───────────────────────────────────────────────────────

const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS _migration_log (
    filename    TEXT PRIMARY KEY,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    status      TEXT NOT NULL,
    error_msg   TEXT
);
`;

async function bootstrapLog() {
    try {
        await query(BOOTSTRAP_SQL);
    } catch (e) {
        console.error('Failed to bootstrap _migration_log:', e.message);
        process.exit(1);
    }
}

async function getAppliedMigrations() {
    const rows = await query(
        `SELECT filename FROM _migration_log WHERE status = 'applied';`
    );
    return new Set(rows.map((r) => r.filename));
}

async function recordMigration(filename, status, errorMsg = null) {
    const escaped = (errorMsg || '').replace(/'/g, "''").substring(0, 1000);
    const errSql = errorMsg ? `'${escaped}'` : 'NULL';
    await query(`
        INSERT INTO _migration_log (filename, status, error_msg)
        VALUES ('${filename}', '${status}', ${errSql})
        ON CONFLICT (filename) DO UPDATE
          SET status = EXCLUDED.status,
              applied_at = now(),
              error_msg = EXCLUDED.error_msg;
    `);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Haul Command — Migration Runner');
    console.log(`  Project: ${PROJECT_REF}`);
    console.log('═══════════════════════════════════════════════════════\n');

    // 1. Bootstrap tracking table
    console.log('Bootstrapping _migration_log...');
    await bootstrapLog();

    // 2. Read migration files
    const allFiles = fs.readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    console.log(`Found ${allFiles.length} migration files.\n`);

    // 3. Check which are already applied
    let applied;
    try {
        applied = await getAppliedMigrations();
    } catch (e) {
        console.error('Failed to read _migration_log:', e.message);
        process.exit(1);
    }

    // 4. Apply pending migrations
    let countApplied = 0;
    let countSkipped = 0;
    let countFailed = 0;

    for (const filename of allFiles) {
        if (applied.has(filename)) {
            countSkipped++;
            continue;
        }

        const filePath = path.join(MIGRATIONS_DIR, filename);
        let sql;
        try {
            sql = fs.readFileSync(filePath, 'utf-8');
        } catch (e) {
            console.log(`  ⚠️  ${filename} — could not read file: ${e.message}`);
            countFailed++;
            continue;
        }

        sql = preprocessSQL(stripTransactionWrapper(sql));
        if (!sql.trim()) {
            console.log(`  ⏭  ${filename} — empty, skipping`);
            await recordMigration(filename, 'applied');
            countSkipped++;
            continue;
        }

        try {
            await query(sql);
            await recordMigration(filename, 'applied');
            console.log(`  ✅  ${filename}`);
            countApplied++;
        } catch (e) {
            const errMsg = e.message;
            await recordMigration(filename, 'failed', errMsg).catch(() => {});
            console.log(`  ❌  ${filename}`);
            console.log(`       ${errMsg.substring(0, 200)}`);
            countFailed++;
        }
    }

    // 5. Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`  Applied:  ${countApplied}`);
    console.log(`  Skipped:  ${countSkipped}  (already applied)`);
    console.log(`  Failed:   ${countFailed}`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (countFailed > 0) {
        console.log('Some migrations failed. Check errors above or query:');
        console.log("  SELECT * FROM _migration_log WHERE status = 'failed';\n");
        process.exit(1);
    }
}

main().catch((e) => {
    console.error('Unexpected error:', e);
    process.exit(1);
});
