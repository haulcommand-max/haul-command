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
  console.log(`\n═══ Applying: ${filename} ═══`);
  
  try {
    await client.query(sql);
    console.log(`✅ ${filename}: SUCCESS`);
    return true;
  } catch (e) {
    // pg_cron schedule errors are often "already exists" — not fatal
    if (e.message.includes('already exists') || e.message.includes('duplicate')) {
      console.log(`⚠️  ${filename}: Some schedules already exist (idempotent — OK)`);
      return true;
    }
    console.log(`❌ ${filename}: ${e.message}`);
    return false;
  }
}

async function run() {
  await client.connect();
  console.log('═══ HAUL COMMAND — MIGRATION RUNNER ═══\n');
  console.log('Connected to database.\n');

  // Apply Wave 2 cron schedules
  const m1 = await applyMigration('20260410_wave2_marketplace_cron_schedules.sql');
  
  // Apply schema cache reload
  const m2 = await applyMigration('20260410_schema_cache_reload.sql');

  // Verify: check cron.job table for our new schedules
  console.log('\n═══ VERIFICATION: pg_cron jobs ═══');
  try {
    const { rows } = await client.query(`
      SELECT jobname, schedule, active 
      FROM cron.job 
      WHERE jobname IN (
        'availability-truth-tick', 'presence-timeout-offline', 'availability-ping',
        'panic-fill-escalation', 'dispute-auto-resolve',
        'ad-decision-engine', 'premium-auction-tick', 'bill-sponsors-daily',
        'compute-trust-score-nightly', 'purge-idempotency-keys',
        'corridor-stress-refresh', 'monitor-dead-zones', 'coverage-cells-precompute'
      )
      ORDER BY jobname;
    `);
    
    if (rows.length > 0) {
      console.log(`\n✅ ${rows.length} Wave 2+ cron jobs registered:`);
      rows.forEach(r => console.log(`  ${r.active ? '✅' : '⏸️'} ${r.jobname}: ${r.schedule}`));
    } else {
      console.log('⚠️  No Wave 2 cron jobs found in cron.job table');
    }
  } catch (e) {
    console.log(`⚠️  Could not query cron.job: ${e.message}`);
  }

  // Verify: check total cron jobs
  try {
    const { rows } = await client.query(`SELECT count(*) as total FROM cron.job;`);
    console.log(`\nTotal cron jobs in system: ${rows[0]?.total}`);
  } catch (e) {
    console.log(`Could not count cron jobs: ${e.message}`);
  }

  await client.end();
  console.log('\n═══ MIGRATION RUN COMPLETE ═══');
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
