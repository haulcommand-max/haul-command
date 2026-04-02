const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const MIGRATION_ORDER = [
  '20260402_role_intent_001_catalogs.sql',
  '20260402_role_intent_002_user_state.sql',
  '20260402_role_intent_003_routing_rules.sql',
  '20260402_role_intent_004_listing_shells.sql',
  '20260402_role_intent_005_rls_policies.sql',
  '20260402_role_intent_006_seed_data.sql',
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
  
  const trimmed = current.trim();
  if (trimmed && trimmed !== ';' && !trimmed.startsWith('--')) {
    statements.push(trimmed);
  }
  
  return statements;
}

async function runAll() {
  const connStr = process.env.SUPABASE_DB_POOLER_URL;
  if (!connStr) {
    console.error('ERROR: SUPABASE_DB_POOLER_URL not set in .env.local');
    process.exit(1);
  }
  
  const client = new Client({ connectionString: connStr });
  await client.connect();
  console.log('Connected to Supabase database.\n');
  
  // Pre-flight: check what already exists
  const existing = await client.query(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema='public' 
     AND table_name LIKE 'hc_%'
     AND table_name IN (
       'hc_role_families','hc_roles','hc_role_aliases','hc_modes','hc_intents',
       'hc_page_types','hc_action_catalog','hc_completion_gates',
       'hc_user_role_state','hc_user_intent_scores','hc_mode_sessions',
       'hc_user_completion_state','hc_next_move_impressions','hc_next_move_clicks',
       'hc_role_intents','hc_route_patterns','hc_next_move_rules',
       'hc_country_role_overlays','hc_country_intent_overlays','hc_monetization_surfaces',
       'hc_entity_contact_observations','hc_listing_shell_queue',
       'hc_listing_shell_events','hc_entity_surface_links'
     )
     ORDER BY table_name`
  );
  console.log('PRE-FLIGHT: Role+Intent tables already present:', 
    existing.rows.length > 0 ? existing.rows.map(r => r.table_name).join(', ') : 'NONE');
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
      
      const firstLine = stmt.split('\n').find(l => !l.trim().startsWith('--') && l.trim());
      const label = (firstLine || '').substring(0, 90).trim();
      
      try {
        await client.query(stmt);
        phasePassed++;
      } catch (e) {
        phaseFailed++;
        const msg = e.message.split('\n')[0];
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
  
  // ═══════════════════════════════════════════════════════════════
  // POST-MIGRATION VERIFICATION
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(70)}`);
  console.log('POST-MIGRATION VERIFICATION');
  console.log(`${'═'.repeat(70)}`);
  
  const verify = await client.query(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema='public' 
     AND table_name LIKE 'hc_%'
     AND table_name IN (
       'hc_role_families','hc_roles','hc_role_aliases','hc_modes','hc_intents',
       'hc_page_types','hc_action_catalog','hc_completion_gates',
       'hc_user_role_state','hc_user_intent_scores','hc_mode_sessions',
       'hc_user_completion_state','hc_next_move_impressions','hc_next_move_clicks',
       'hc_role_intents','hc_route_patterns','hc_next_move_rules',
       'hc_country_role_overlays','hc_country_intent_overlays','hc_monetization_surfaces',
       'hc_entity_contact_observations','hc_listing_shell_queue',
       'hc_listing_shell_events','hc_entity_surface_links'
     )
     ORDER BY table_name`
  );
  
  const expectedTables = 24;
  const actualTables = verify.rows.length;
  console.log(`\nTables created: ${actualTables}/${expectedTables}`);
  verify.rows.forEach(r => console.log(`  ✓ ${r.table_name}`));
  
  // Verify seed data counts
  const seedChecks = [
    { table: 'hc_role_families', label: 'role families' },
    { table: 'hc_roles', label: 'roles' },
    { table: 'hc_modes', label: 'modes' },
    { table: 'hc_intents', label: 'intents' },
    { table: 'hc_page_types', label: 'page types' },
    { table: 'hc_action_catalog', label: 'actions' },
    { table: 'hc_completion_gates', label: 'completion gates' },
    { table: 'hc_role_intents', label: 'role-intent mappings' },
    { table: 'hc_route_patterns', label: 'route patterns' },
    { table: 'hc_next_move_rules', label: 'next-move rules' },
    { table: 'hc_role_aliases', label: 'role aliases' },
  ];
  
  console.log('\nSeed data:');
  for (const check of seedChecks) {
    try {
      const res = await client.query(`SELECT count(*) as cnt FROM public.${check.table}`);
      console.log(`  ${res.rows[0].cnt} ${check.label}`);
    } catch (e) { 
      console.log(`  ? ${check.label} (table not found)`);
    }
  }
  
  // Verify RLS is enabled
  const rlsCheck = await client.query(
    `SELECT tablename, rowsecurity 
     FROM pg_tables 
     WHERE schemaname = 'public' 
     AND tablename LIKE 'hc_%'
     AND tablename IN (
       'hc_user_role_state','hc_user_intent_scores','hc_mode_sessions',
       'hc_user_completion_state','hc_next_move_impressions','hc_next_move_clicks',
       'hc_entity_contact_observations','hc_listing_shell_queue','hc_listing_shell_events',
       'hc_role_families','hc_roles','hc_intents','hc_modes'
     )
     ORDER BY tablename`
  );
  
  console.log('\nRLS status:');
  let rlsOk = 0;
  let rlsFail = 0;
  for (const row of rlsCheck.rows) {
    if (row.rowsecurity) {
      rlsOk++;
      console.log(`  ✓ ${row.tablename} — RLS enabled`);
    } else {
      rlsFail++;
      console.log(`  ✗ ${row.tablename} — RLS NOT enabled`);
    }
  }
  
  // Verify policies exist
  const policyCheck = await client.query(
    `SELECT tablename, count(*) as policy_count
     FROM pg_policies
     WHERE schemaname = 'public'
     AND tablename LIKE 'hc_%'
     GROUP BY tablename
     ORDER BY tablename`
  );
  
  console.log('\nRLS policies:');
  for (const row of policyCheck.rows) {
    console.log(`  ${row.tablename}: ${row.policy_count} policies`);
  }
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`FINAL: ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped`);
  console.log(`Tables: ${actualTables}/${expectedTables} | RLS: ${rlsOk} enabled, ${rlsFail} missing`);
  console.log(`${'═'.repeat(70)}`);
  
  if (totalFailed > 0) {
    console.log('\n⚠️  Some statements failed. Review errors above.');
  } else {
    console.log('\n✅ Role + Intent Engine migration complete. System is live.');
  }
  
  await client.end();
}

runAll().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
