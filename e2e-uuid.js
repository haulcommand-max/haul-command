const env = require('dotenv').config({path: '.env.local'}).parsed;
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

async function runSmokeTests() {
  const c = new Client({ connectionString: env.SUPABASE_DB_POOLER_URL });
  await c.connect();

  console.log("🚀 STARTING E2E SMOKE TESTS WITH UUIDs...");

  try {
    const runs = await c.query(`
      SELECT r.id, r.status, a.slug
      FROM hc_command_runs r
      JOIN hc_command_agents a ON a.id = r.agent_id
      WHERE r.started_at > NOW() - INTERVAL '5 minute'
      ORDER BY r.started_at DESC
    `);
    
    if (runs.rows.length > 0) {
      console.log("✅ Command Runs Automatically Spawned:", runs.rows.length);
      runs.rows.forEach(r => console.log(`   - Agent: ${r.slug} | Status: ${r.status}`));
    } else {
      console.log("⚠️ No Command Runs found within 5 minutes.");
    }

  } catch (error) {
    console.error("❌ E2E Smoke Test Failed:", error);
  } finally {
    await c.end();
  }
}

runSmokeTests();
