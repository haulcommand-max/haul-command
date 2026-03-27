/**
 * Haul Command — Full Data Architecture Audit
 * Answers: 
 * 1. What entities were incorrectly inserted into hc_places?
 * 2. What is the true operator count vs place count?
 * 3. What does the live API actually return vs DB?
 * 4. What is the correct table for operators?
 */

const { Client } = require('pg');
const https = require('https');
const fs = require('fs');

const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const [k,...v] = l.split('='); if(k&&v.length) env[k.trim()] = v.join('=').trim();
});

const client = new Client({ connectionString: env['SUPABASE_DB_POOLER_URL'] });

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({ error: 'parse_fail', raw: data.slice(0,200) }); } });
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function audit() {
  await client.connect();
  console.log('\n════════════════════════════════════════════');
  console.log(' HAUL COMMAND — FULL DATA ARCHITECTURE AUDIT');
  console.log('════════════════════════════════════════════\n');

  // ── 1. hc_places breakdown — what's really in there ──
  console.log('【1】 hc_places surface_category_key breakdown:');
  const cats = await client.query(`
    SELECT surface_category_key, COUNT(*) as cnt, source_system
    FROM hc_places 
    WHERE status = 'published'
    GROUP BY surface_category_key, source_system
    ORDER BY cnt DESC
    LIMIT 25;
  `);
  cats.rows.forEach(r => console.log(`  ${r.source_system === 'matrix_gen' ? '⚠ MATRIX' : '✓ REAL '} | ${r.surface_category_key}: ${parseInt(r.cnt).toLocaleString()}`));

  // ── 2. How many are REAL vs matrix_gen garbage ──
  console.log('\n【2】 Real vs Matrix-generated records:');
  const sources = await client.query(`
    SELECT source_system, COUNT(*) as cnt 
    FROM hc_places WHERE status='published'
    GROUP BY source_system ORDER BY cnt DESC;
  `);
  sources.rows.forEach(r => console.log(`  ${r.source_system}: ${parseInt(r.cnt).toLocaleString()}`));

  // ── 3. What's the REAL operator table? ──
  console.log('\n【3】 Checking all operator-related tables:');
  const candidateTables = ['hc_entity', 'hc_surfaces', 'operators', 'escort_operators', 'directory_listings'];
  for (const t of candidateTables) {
    const res = await client.query(`SELECT COUNT(*) FROM ${t};`).catch(() => ({ rows: [{ count: 'NOT FOUND' }] }));
    console.log(`  ${t}: ${res.rows[0].count}`);
  }

  // ── 4. directory_listings entity_type breakdown ──
  console.log('\n【4】 directory_listings entity types (the REAL 82K):');
  const dlTypes = await client.query(`
    SELECT entity_type, COUNT(*) as cnt
    FROM directory_listings WHERE is_visible = true
    GROUP BY entity_type ORDER BY cnt DESC;
  `);
  dlTypes.rows.forEach(r => console.log(`  ${r.entity_type}: ${parseInt(r.cnt).toLocaleString()}`));

  // ── 5. What does the live production API return? ──
  const siteUrl = env['NEXT_PUBLIC_SITE_URL'] || 'https://haulcommand.com';
  console.log(`\n【5】 Live API check (${siteUrl}/api/directory/listings?limit=1):`);
  const apiResult = await fetchUrl(`${siteUrl}/api/directory/listings?limit=1`);
  if (apiResult.total !== undefined) {
    console.log(`  API total: ${apiResult.total.toLocaleString()}`);
    console.log(`  First listing: ${JSON.stringify(apiResult.listings?.[0]?.name)} — ${apiResult.listings?.[0]?.city}, ${apiResult.listings?.[0]?.state}`);
    console.log(`  Cache-Control: check Vercel dashboard for edge cache`);
  } else {
    console.log(`  API error:`, apiResult);
  }

  // ── 6. Count of hc_places by original real source only ──
  console.log('\n【6】 LEGITIMATE data in hc_places (pre-matrix):');
  const legit = await client.query(`
    SELECT COUNT(*) FROM hc_places 
    WHERE status='published' AND (source_system IS NULL OR source_system != 'matrix_gen');
  `);
  console.log(`  Legitimate published places: ${parseInt(legit.rows[0].count).toLocaleString()}`);

  // ── 7. hc_entity — is this the real operator registry? ──
  console.log('\n【7】 hc_entity columns (first 10):');
  const entityCols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='hc_entity' 
    ORDER BY ordinal_position LIMIT 15;
  `).catch(() => ({ rows: [] }));
  entityCols.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
  if (entityCols.rows.length > 0) {
    const ecnt = await client.query(`SELECT COUNT(*) FROM hc_entity;`);
    console.log(`  TOTAL hc_entity records: ${parseInt(ecnt.rows[0].count).toLocaleString()}`);
  }

  console.log('\n════════════════════════════════════════════\n');
  await client.end();
}

audit().catch(e => console.error('AUDIT FAILED:', e.message));
