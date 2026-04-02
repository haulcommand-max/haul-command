require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await c.connect();

  const tables = [
    'hc_role_families',
    'hc_roles',
    'hc_modes',
    'hc_intents',
    'hc_page_types',
    'hc_action_catalog',
    'hc_completion_gates',
    'hc_role_intents',
    'hc_route_patterns',
    'hc_next_move_rules',
    'hc_role_aliases',
  ];

  console.log('=== ROLE + INTENT ENGINE: SEED DATA VERIFICATION ===\n');

  for (const t of tables) {
    const r = await c.query('SELECT count(*) as cnt FROM public.' + t);
    console.log(`  ${String(r.rows[0].cnt).padStart(4)} rows  ${t}`);
  }

  // Show sample data
  console.log('\n--- Role Families ---');
  const fams = await c.query('SELECT family_key, label, sort_order FROM public.hc_role_families ORDER BY sort_order');
  fams.rows.forEach(r => console.log(`  [${r.sort_order}] ${r.family_key}: ${r.label}`));

  console.log('\n--- Modes ---');
  const modes = await c.query('SELECT mode_key, label, color_token FROM public.hc_modes ORDER BY sort_order');
  modes.rows.forEach(r => console.log(`  ${r.mode_key}: ${r.label} (${r.color_token})`));

  console.log('\n--- Intents ---');
  const intents = await c.query('SELECT intent_key, label, mode_key, urgency_class FROM public.hc_intents ORDER BY sort_order');
  intents.rows.forEach(r => console.log(`  ${r.intent_key}: ${r.label} [${r.mode_key}] urgency=${r.urgency_class}`));

  console.log('\n--- Sample Next-Move Rules ---');
  const rules = await c.query('SELECT role_key, intent_key, page_type_key, primary_action_key, helper_copy FROM public.hc_next_move_rules ORDER BY role_key, page_type_key LIMIT 10');
  rules.rows.forEach(r => console.log(`  ${r.role_key} + ${r.intent_key} @ ${r.page_type_key} -> ${r.primary_action_key}\n    "${r.helper_copy}"`));

  await c.end();
  console.log('\n✅ Verification complete.');
})();
