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
    //    Matches:  CREATE POLICY "quoted name" ON [public.]table
    //          or: CREATE POLICY unquoted_name ON [public.]table
    sql = sql.replace(
        /\bCREATE\s+POLICY\s+("(?:[^"\\]|\\.)*"|[\w$]+)\s+ON\s+((?:public\.)?[\w$"]+)/gi,
        (match, policyName, tableName) =>
            `DROP POLICY IF EXISTS ${policyName} ON ${tableName} CASCADE;\n${match}`
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
