const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const MIGRATION_ORDER = [
  '20260402_phase_000_platform_foundation.sql',
  '20260402_phase_010_global_dictionary.sql',
  '20260402_phase_020_country_role_layer.sql',
  '20260402_phase_030_entities_and_claims.sql',
  '20260402_phase_050_intake_and_order_composer.sql',
  '20260402_phase_060_jobs_and_commerce_spine.sql',
  '20260402_phase_040_permit_and_corridor.sql',
  '20260402_phase_070_dispatch_supply_network.sql',
  '20260402_phase_080_enterprise_revenue.sql',
  '20260402_phase_090_monetization_control.sql',
  '20260402_phase_100_rls_views_leakage.sql',
  '20260402_phase_110_seed_canonical.sql',
];

/**
 * Split SQL into individual statements, respecting dollar-quoted strings
 * and multi-line DO blocks.
 */
function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    
    if (!inDollarQuote && ch === '$') {
      // Check for dollar-quote start
      let tag = '$';
      let j = i + 1;
      while (j < sql.length && (sql[j].match(/[a-zA-Z0-9_]/) || sql[j] === '$')) {
        tag += sql[j];
        if (sql[j] === '$') { j++; break; }
        j++;
      }
      if (tag.endsWith('$') && tag.length >= 2) {
        inDollarQuote = true;
        dollarTag = tag;
        current += tag;
        i = j - 1;
        continue;
      }
    } else if (inDollarQuote && ch === '$') {
      // Check for dollar-quote end
      let tag = '$';
      let j = i + 1;
      while (j < sql.length && (sql[j].match(/[a-zA-Z0-9_]/) || sql[j] === '$')) {
        tag += sql[j];
        if (sql[j] === '$') { j++; break; }
        j++;
      }
      if (tag === dollarTag) {
        current += tag;
        i = j - 1;
        inDollarQuote = false;
        dollarTag = '';
        continue;
      }
    }
    
    if (!inDollarQuote && ch === ';') {
      current += ';';
      const trimmed = current.trim();
      if (trimmed && trimmed !== ';') {
        statements.push(trimmed);
      }
      current = '';
    } else {
      current += ch;
    }
  }
  
  // Handle last statement without trailing semicolon
  const trimmed = current.trim();
  if (trimmed && trimmed !== ';' && !trimmed.startsWith('--')) {
    statements.push(trimmed);
  }
  
  return statements;
}

async function runAll() {
  const connStr = process.env.SUPABASE_DB_POOLER_URL;
  if (!connStr) {
    console.error('ERROR: SUPABASE_DB_POOLER_URL not set');
    process.exit(1);
  }
  
  const client = new Client({ connectionString: connStr });
  await client.connect();
  console.log('Connected to Supabase database.\n');
  
  // First, check what already exists
  const existing = await client.query(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema='public' 
     AND table_name IN ('countries','canonical_roles','country_roles','market_entities','hc_jobs','hc_corridors')
     ORDER BY table_name`
  );
  console.log('Pre-existing tables from target schema:', existing.rows.map(r => r.table_name).join(', ') || 'NONE');
  console.log('');
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  
  for (const file of MIGRATION_ORDER) {
    const filePath = path.join('supabase', 'migrations', file);
    if (!fs.existsSync(filePath)) {
      console.error(`SKIP: ${file} — file not found`);
      totalSkipped++;
      continue;
    }
    
    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = splitStatements(sql);
    
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`PHASE: ${file} (${statements.length} statements)`);
    console.log(`${'─'.repeat(70)}`);
    
    let phasePassed = 0;
    let phaseFailed = 0;
    
    for (let idx = 0; idx < statements.length; idx++) {
      const stmt = statements[idx];
      
      // Skip pure comments
      if (stmt.split('\n').every(line => line.trim().startsWith('--') || line.trim() === '')) {
        continue;
      }
      
      // Extract a short label for logging
      const firstLine = stmt.split('\n').find(l => !l.trim().startsWith('--') && l.trim());
      const label = (firstLine || '').substring(0, 80).trim();
      
      try {
        await client.query(stmt);
        phasePassed++;
      } catch (e) {
        phaseFailed++;
        const msg = e.message.split('\n')[0];
        // Only log non-trivial errors (skip "already exists" type errors)
        if (msg.includes('already exists')) {
          console.log(`  ⚠️  [${idx+1}] ${label}... (already exists, OK)`);
        } else {
          console.error(`  ❌ [${idx+1}] ${label}...`);
          console.error(`      ERROR: ${msg}`);
        }
      }
    }
    
    totalPassed += phasePassed;
    totalFailed += phaseFailed;
    
    if (phaseFailed === 0) {
      console.log(`  ✅ ALL ${phasePassed} statements passed`);
    } else {
      console.log(`  📊 ${phasePassed} passed, ${phaseFailed} failed`);
    }
  }
  
  // Post-migration verification
  console.log(`\n${'═'.repeat(70)}`);
  console.log('POST-MIGRATION VERIFICATION');
  console.log(`${'═'.repeat(70)}`);
  
  const verify = await client.query(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema='public' 
     AND table_name IN (
       'canonical_roles','countries','archetype_defaults','monetization_default_rules',
       'country_roles','role_aliases','market_entities','claim_activation_pipeline',
       'provider_documents','provider_performance_rollups',
       'intake_channels','intake_events','job_stack_templates',
       'hc_jobs','job_stack_line_items','job_role_requirements','job_assignments',
       'job_quotes','job_financials','pricing_observations',
       'wallets_ledger','payout_splits','reserves',
       'dispatch_supply','partner_referral_edges','capacity_heatmaps','relocation_bounties',
       'permit_actors','hc_corridors','route_survey_assets','corridor_risk_profiles',
       'enterprise_contracts','service_level_agreements','reserved_capacity_blocks',
       'api_subscriptions','webhook_subscriptions','monetization_flags'
     )
     ORDER BY table_name`
  );
  
  const expected = 35;
  const actual = verify.rows.length;
  console.log(`\nTables created: ${actual}/${expected}`);
  verify.rows.forEach(r => console.log(`  ✓ ${r.table_name}`));
  
  // Check views
  const views = await client.query(
    `SELECT table_name FROM information_schema.views 
     WHERE table_schema='public' 
     AND table_name LIKE 'v_%'
     ORDER BY table_name`
  );
  console.log(`\nViews created: ${views.rows.length}`);
  views.rows.forEach(r => console.log(`  ✓ ${r.table_name}`));
  
  // Check seed data
  try {
    const roles = await client.query('SELECT count(*) as cnt FROM public.canonical_roles');
    console.log(`\nSeed data: ${roles.rows[0].cnt} canonical roles`);
  } catch(e) { /* table might not exist */ }

  try {
    const channels = await client.query('SELECT count(*) as cnt FROM public.intake_channels');
    console.log(`Seed data: ${channels.rows[0].cnt} intake channels`);
  } catch(e) { /* table might not exist */ }
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`FINAL: ${totalPassed} statements passed, ${totalFailed} failed, ${totalSkipped} files skipped`);
  console.log(`${'═'.repeat(70)}`);
  
  await client.end();
}

runAll().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
