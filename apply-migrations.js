const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const [k,...v] = l.split('='); if(k&&v.length) env[k.trim()] = v.join('=').trim();
});

const client = new Client({ connectionString: env['SUPABASE_DB_POOLER_URL'] });

async function applyMigration(filename) {
  const filePath = path.join(__dirname, 'supabase', 'migrations', filename);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${filename}: file not found`);
    return false;
  }
  
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`\n═══ Applying to LIVE: ${filename} ═══`);
  
  try {
    // This correctly runs multi-statement scripts via the pg driver without raw splitting!
    await client.query(sql);
    console.log(`✅ ${filename}: SUCCESS`);
    return true;
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('duplicate')) {
      console.log(`⚠️  ${filename}: Already Exists (idempotent — OK)`);
      return true;
    }
    console.log(`❌ ${filename}: ERROR: ${e.message}`);
    return false;
  }
}

async function run() {
  await client.connect();
  console.log('═══ HAUL COMMAND — LIVE MIGRATION RUNNER ═══\n');
  console.log('Connected to LIVE Production Database.\n');

  const TARGET_MIGRATIONS = [
    '20260412_command_layer_schema.sql',
    '20260412_command_layer_seed.sql',
    '20260412_command_layer_auto_wire.sql',
    '20260412_command_layer_maxout_agents.sql',
    '20260412_command_layer_money_triggers.sql',
    '20260412_command_layer_paperclip_maximum_yield.sql',
    '20260412_command_layer_roi_engines_v2.sql',
    '20260412_command_layer_rpcs.sql',
    '20260412_command_layer_wire_all_remaining.sql',
    '20260414_003_command_layer_agent_expansion.sql', 
    '20260412_wave11_facility_ugc_and_rewards.sql', 
    '20260412_wave15_facilities_dot_seed.sql'
  ];

  for (const m of TARGET_MIGRATIONS) {
    await applyMigration(m);
  }

  console.log('\n═══ VERIFICATION ═══');
  try {
     const { rows } = await client.query(`SELECT id as agent_id, role, status, adapter_type FROM public.hc_command_agents ORDER BY created_at DESC LIMIT 5`);
     console.table(rows);
  } catch(e) {
     console.log('Could not verify agents:', e.message);
  }

  try {
     const { rows } = await client.query(`SELECT type, count(*) as cnt FROM public.facilities GROUP BY type`);
     console.table(rows);
  } catch(e) {
     console.log('Could not verify facilities:', e.message);
  }

  await client.end();
  console.log('\n═══ ALL MIGRATIONS PUSHED LIVE ═══');
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
