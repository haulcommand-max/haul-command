const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (!inDollarQuote && ch === '$') {
      let tag = '$'; let j = i + 1;
      while (j < sql.length && (sql[j].match(/[a-zA-Z0-9_]/) || sql[j] === '$')) { tag += sql[j]; if (sql[j] === '$') { j++; break; } j++; }
      if (tag.endsWith('$') && tag.length >= 2) { inDollarQuote = true; dollarTag = tag; current += tag; i = j - 1; continue; }
    } else if (inDollarQuote && ch === '$') {
      let tag = '$'; let j = i + 1;
      while (j < sql.length && (sql[j].match(/[a-zA-Z0-9_]/) || sql[j] === '$')) { tag += sql[j]; if (sql[j] === '$') { j++; break; } j++; }
      if (tag === dollarTag) { current += tag; i = j - 1; inDollarQuote = false; dollarTag = ''; continue; }
    }
    if (!inDollarQuote && ch === ';') { current += ';'; const t = current.trim(); if (t && t !== ';') statements.push(t); current = ''; } else { current += ch; }
  }
  const t = current.trim();
  if (t && t !== ';' && !t.startsWith('--')) statements.push(t);
  return statements;
}

async function run() {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await c.connect();
  console.log('Connected. Running phase 120 schema patch...\n');
  
  const sql = fs.readFileSync('supabase/migrations/20260402_phase_120_schema_patch.sql', 'utf8');
  const stmts = splitStatements(sql);
  let passed = 0, failed = 0;
  
  for (let i = 0; i < stmts.length; i++) {
    const s = stmts[i];
    if (s.split('\n').every(l => l.trim().startsWith('--') || !l.trim())) continue;
    const label = (s.split('\n').find(l => !l.trim().startsWith('--') && l.trim()) || '').substring(0, 80).trim();
    try {
      await c.query(s);
      passed++;
    } catch (e) {
      const msg = e.message.split('\n')[0];
      if (msg.includes('already exists')) {
        console.log(`  ⚠️  [${i+1}] ${label}... (already exists)`);
      } else {
        console.error(`  ❌ [${i+1}] ${label}...`);
        console.error(`      ERROR: ${msg}`);
      }
      failed++;
    }
  }
  
  // Verify
  const tbl = await c.query(`SELECT count(*) as cnt FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('canonical_roles','countries','country_roles','market_entities','hc_jobs','hc_corridors','dispatch_supply','enterprise_contracts','monetization_flags')`);
  const views = await c.query(`SELECT table_name FROM information_schema.views WHERE table_schema='public' AND table_name LIKE 'v_public_%' OR table_name LIKE 'v_internal_%' OR table_name LIKE 'v_margin_%' OR table_name LIKE 'v_claim_%' OR table_name LIKE 'v_route_survey_%' OR table_name LIKE 'v_unused_%' OR table_name LIKE 'v_dispatch_ready%' ORDER BY table_name`);
  
  console.log(`\n${passed} passed, ${failed} failed`);
  console.log(`\nCore tables verified: ${tbl.rows[0].cnt}/9`);
  console.log('Money OS views:');
  views.rows.forEach(r => console.log(`  ✓ ${r.table_name}`));
  
  // Check countries has code column
  const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='countries' AND column_name IN ('code','tier','archetype_profile','market_status') ORDER BY column_name`);
  console.log(`\ncountries patched columns: ${cols.rows.map(r => r.column_name).join(', ')}`);
  
  const jcols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='hc_jobs' AND column_name IN ('country_id','corridor_id','job_status','urgency_level','enterprise_contract_id') ORDER BY column_name`);
  console.log(`hc_jobs patched columns: ${jcols.rows.map(r => r.column_name).join(', ')}`);
  
  await c.end();
}
run().catch(e => { console.error('Fatal:', e); process.exit(1); });
