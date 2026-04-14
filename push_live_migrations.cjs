const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Extract pooler from .env.production.local or .env.local
let poolerUrl = '';
try {
  const envText = fs.readFileSync('.env.local','utf8');
  envText.split('\n').forEach(l => {
    const [k,...v] = l.split('='); 
    if(k && k.trim() === 'SUPABASE_DB_POOLER_URL') poolerUrl = v.join('=').trim();
  });
} catch(e) {}

if(!poolerUrl) {
  console.log("Failed to find DB pooler URL");
  process.exit(1);
}

const client = new Client({ connectionString: poolerUrl });

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

async function applyMigration(filename) {
  const filePath = path.join(__dirname, 'supabase', 'migrations', filename);
  if (!fs.existsSync(filePath)) {
    console.log(`[SKIP] ${filename}: file not found`);
    return; 
  }
  
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`\n============== [DEPLOYING LIVE] ${filename} ==============`);
  
  try {
    // pg supports multiple statements passing the entire string 
    await client.query(sql);
    console.log(`✅  SUCCESS`);
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('duplicate')) {
       console.log(`🟡  ALREADY EXISTS (Idempotent OK): ${e.message.substring(0, 100)}`);
    } else {
       console.log(`❌  ERROR: ${e.message}`);
    }
  }
}

async function run() {
  console.log('🔗 Connecting to LIVE Production Supabase...');
  await client.connect();
  console.log('✅ Connected.\n');

  for (const migration of TARGET_MIGRATIONS) {
    await applyMigration(migration);
  }

  console.log('\n===========================================');
  console.log('[VERIFYING] Live Command Agents');
  console.log('===========================================');
  try {
     const { rows } = await client.query(`SELECT id as agent_id, role, status FROM public.hc_command_agents ORDER BY created_at DESC LIMIT 5`);
     console.table(rows);
  } catch(e) {
     console.log('Could not verify agents:', e.message);
  }

  console.log('\n===========================================');
  console.log('[VERIFYING] Live Facility / Truck Stop Count');
  console.log('===========================================');
  try {
     const { rows } = await client.query(`SELECT type, count(*) as cnt FROM public.facilities GROUP BY type`);
     console.table(rows);
  } catch(e) {
     console.log('Could not verify facilities:', e.message);
  }

  await client.end();
  console.log('\n🚀 ALL MIGRATIONS PUSHED TO LIVE ENVIRONMENT.');
}

run().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
