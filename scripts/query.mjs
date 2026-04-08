import pg from 'pg';
import { readFileSync } from 'fs';

const envLines = readFileSync('.env.local', 'utf8').split('\n');
function g(k) {
    for (const l of envLines) {
        if (l.startsWith(k + '=')) return l.slice(k.length + 1).trim().replace(/^['"]|['"]$/g, '');
    }
    return '';
}

const c = new pg.Client({ connectionString: g('SUPABASE_DB_POOLER_URL'), ssl: { rejectUnauthorized: false } });

const sql = process.argv[2] || "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name";

(async () => {
    await c.connect();
    const r = await c.query(sql);
    r.rows.forEach(row => console.log(JSON.stringify(row)));
    await c.end();
})();
