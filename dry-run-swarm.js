const { Client } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const client = new Client({ connectionString: env['SUPABASE_DB_POOLER_URL'] });

async function dryRun() {
  await client.connect();
  
  // Dry-run: insert exactly 5 test rows
  const values = [
    "('test-pilot-abc123', 'Test Escort ABC Pilot Cars', 'Test Escort ABC Pilot Cars', 'pilot_car', 'pilot_car', 'escort', 'MATRIX_GEN', 'active', 'Houston', 'TX', 'US', 0.75, 0, 0, 0, 'unclaimed', NOW(), NOW())",
    "('test-broker-def456', 'Test Freight Def Logistics Brokerage', 'Test Freight Def Logistics Brokerage', 'freight_broker', 'freight_broker', 'broker', 'MATRIX_GEN', 'active', 'Dallas', 'TX', 'US', 0.82, 0, 0, 0, 'unclaimed', NOW(), NOW())",
  ].join(',\n');

  try {
    const res = await client.query(`
      INSERT INTO providers (
        provider_key, name_raw, name_norm, provider_type, category_raw, role,
        source, status, city, state, country,
        trust_score, rating_avg, rating_count, jobs_completed,
        claim_status, created_at, updated_at
      ) VALUES ${values}
      ON CONFLICT (provider_key) DO NOTHING
      RETURNING provider_key, name_raw, state;
    `);
    console.log("DRY RUN SUCCESS — inserted rows:", res.rows);
    
    // Count check
    const cnt = await client.query('SELECT COUNT(*) FROM providers');
    console.log("Total providers now:", cnt.rows[0].count);
    
    // Clean up test rows
    await client.query("DELETE FROM providers WHERE source = 'MATRIX_GEN'");
    console.log("Cleaned up test rows.");
  } catch (err) {
    console.error("DRY RUN FAILED:", err.message);
    console.error("Full error:", err);
  }
  
  await client.end();
}

dryRun();
