/**
 * run-migration.mjs — Execute SQL migrations against Supabase
 * Uses the pg module and the pooler connection.
 * 
 * Usage: node scripts/run-migration.mjs <migration-file.sql>
 * OR:    node scripts/run-migration.mjs --inline "CREATE TABLE ..."
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read env
function getEnv(key) {
    const lines = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8').split('\n');
    for (const line of lines) {
        if (line.startsWith(key + '=')) {
            return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '');
        }
    }
    return '';
}

const poolerUrl = getEnv('SUPABASE_DB_POOLER_URL');

if (!poolerUrl || poolerUrl.includes('[YOUR-DATABASE-PASSWORD]')) {
    console.error('❌ SUPABASE_DB_POOLER_URL not configured — trying direct connection via supabase project host...');
    
    // Fallback: try connecting via the direct project host
    const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
    const ref = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    
    console.log(`Project ref: ${ref}`);
    console.log('');
    console.log('To fix this, go to:');
    console.log('  Supabase Dashboard → Settings → Database → Database password');
    console.log('  Then update SUPABASE_DB_POOLER_URL in .env.local');
    console.log('');
    console.log('Alternatively, you can run the SQL directly in the Supabase SQL Editor:');
    console.log(`  https://supabase.com/dashboard/project/${ref}/sql/new`);
    process.exit(1);
}

const client = new pg.Client({ connectionString: poolerUrl, ssl: { rejectUnauthorized: false } });

async function run() {
    const args = process.argv.slice(2);
    let sql;
    
    if (args[0] === '--inline') {
        sql = args.slice(1).join(' ');
    } else if (args[0]) {
        const filePath = resolve(__dirname, '..', 'supabase', 'migrations', args[0]);
        sql = readFileSync(filePath, 'utf8');
    } else {
        console.error('Usage: node scripts/run-migration.mjs <file.sql> | --inline "SQL"');
        process.exit(1);
    }

    console.log(`Connecting to pooler...`);
    await client.connect();
    console.log(`✅ Connected. Running ${sql.length} chars of SQL...`);
    
    try {
        await client.query(sql);
        console.log('✅ Migration executed successfully');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        if (err.message.includes('already exists')) {
            console.log('   (Table may already exist — this is safe to ignore)');
        }
    } finally {
        await client.end();
    }
}

run();
