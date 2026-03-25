#!/usr/bin/env node
/**
 * Fix Package Migration Runner
 * 
 * Runs the two fix-package SQL migrations against Supabase:
 * 1. Categories + Ad activation (20260325180000)
 * 2. Blog content upgrade (20260325190000)
 * 
 * Usage: node scripts/run-fix-migrations.mjs
 * Requires: ../.env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load env from parent .env.local (matching existing pattern)
let SUPABASE_URL, SERVICE_KEY;
for (const envFile of [resolve(ROOT, '..', '.env.local'), resolve(ROOT, '.env.local'), resolve(ROOT, '.env')]) {
  try {
    const env = readFileSync(envFile, 'utf8');
    SUPABASE_URL = SUPABASE_URL || env.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)/)?.[1]?.trim();
    SERVICE_KEY = SERVICE_KEY || env.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)/)?.[1]?.trim();
    if (SUPABASE_URL && SERVICE_KEY) break;
  } catch {}
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('   Checked: ../.env.local, .env.local, .env');
  process.exit(1);
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

const ref = SUPABASE_URL.match(/https:\/\/(\w+)\./)?.[1];
console.log(`📡 Supabase project: ${ref}\n`);

// Migration files to run in order
const MIGRATIONS = [
  '20260325180000_fix_package_categories_ads.sql',
  '20260325190000_blog_content_upgrade.sql',
];

// Split SQL by statements, handling DO blocks
function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inDo = false;

  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    
    // Skip pure comments
    if (trimmed.startsWith('--') && !inDo) {
      continue;
    }

    current += line + '\n';

    if (trimmed.startsWith('DO $$') || trimmed.startsWith('DO $')) {
      inDo = true;
    }

    if (inDo && (trimmed === '$$;' || trimmed.endsWith('$$;'))) {
      inDo = false;
      statements.push(current.trim());
      current = '';
      continue;
    }

    if (!inDo && trimmed.endsWith(';') && current.trim()) {
      statements.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements.filter(s => s && !s.startsWith('--'));
}

// Run SQL via Supabase RPC or PostgREST
async function runSQL(sql) {
  // Try the exec_sql RPC if it exists
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sql_query: sql }),
    });
    if (r.status < 400) {
      return { ok: true, body: await r.text() };
    }
  } catch {}

  // Try pg/query endpoint
  try {
    const r = await fetch(`https://${ref}.supabase.co/pg/query`, {
      method: 'POST',
      headers: { ...headers, 'x-connection-encrypted': 'false' },
      body: JSON.stringify({ query: sql }),
    });
    if (r.status < 400) {
      return { ok: true, body: await r.text() };
    }
  } catch {}
  
  return { ok: false };
}

// Main execution
async function main() {
  // Test connectivity
  const test = await runSQL('SELECT 1 as test;');
  
  if (test.ok) {
    console.log('✅ SQL API available — running migrations directly\n');
    
    for (const file of MIGRATIONS) {
      console.log(`\n🔧 Running: ${file}`);
      console.log('─'.repeat(60));
      
      const sqlPath = resolve(ROOT, 'supabase', 'migrations', file);
      let sql;
      try {
        sql = readFileSync(sqlPath, 'utf8');
      } catch (e) {
        console.error(`   ❌ Could not read ${file}: ${e.message}`);
        continue;
      }

      const statements = splitStatements(sql);
      console.log(`   ${statements.length} statements to execute\n`);

      let success = 0;
      let failed = 0;

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
        process.stdout.write(`   [${i+1}/${statements.length}] ${preview}... `);

        const result = await runSQL(stmt);
        if (result.ok) {
          console.log('✅');
          success++;
        } else {
          console.log('❌');
          failed++;
        }
      }

      console.log(`\n   Results: ${success} succeeded, ${failed} failed`);
    }
  } else {
    console.log('⚠️  SQL API not available via HTTP.\n');
    console.log('═══════════════════════════════════════════');
    console.log('  MANUAL MIGRATION REQUIRED');
    console.log('═══════════════════════════════════════════\n');
    console.log('Copy and paste each migration file into the Supabase SQL Editor:');
    console.log(`https://supabase.com/dashboard/project/${ref}/sql/new\n`);

    for (const file of MIGRATIONS) {
      console.log(`📄 ${file}`);
      const sqlPath = resolve(ROOT, 'supabase', 'migrations', file);
      try {
        readFileSync(sqlPath, 'utf8');
        console.log(`   → ${sqlPath}`);
      } catch {
        console.log('   → File not found');
      }
    }
    
    console.log('\nRun them in the order listed above.');
  }

  // Verify blog articles exist
  console.log('\n\n📊 Verifying blog articles...\n');
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/hc_blog_articles?select=slug,title&status=eq.published&order=slug`, {
      headers,
    });
    if (r.status === 200) {
      const articles = JSON.parse(await r.text());
      console.log(`   Found ${articles.length} published articles:`);
      for (const a of articles) {
        console.log(`   ✅ ${a.slug}: ${a.title}`);
      }
    } else {
      console.log('   ⚠️  Could not query hc_blog_articles (table may not exist yet)');
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  // Verify categories
  console.log('\n📊 Checking hc_places category distribution...\n');
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/hc_places?select=surface_category_key&status=eq.published&limit=50000`, {
      headers,
    });
    if (r.status === 200) {
      const places = JSON.parse(await r.text());
      const counts = {};
      for (const p of places) {
        const key = p.surface_category_key || 'unknown';
        counts[key] = (counts[key] || 0) + 1;
      }
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      for (const [key, count] of sorted) {
        console.log(`   ${key}: ${count} listings`);
      }
      console.log(`\n   Total: ${places.length} published listings`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
}

main().catch(console.error);
