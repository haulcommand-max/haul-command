const env = require('dotenv').config({path: '.env.local'}).parsed;
const { Client } = require('pg');

async function runSmokeTests() {
  const c = new Client({ connectionString: env.SUPABASE_DB_POOLER_URL });
  await c.connect();

  console.log("🚀 STARTING HAUL COMMAND E2E SMOKE TESTS...");

  try {
    // 1. Simulate Broker Booking a Load in Houston
    console.log("[TEST 1] Simulating Broker Load Booking in Houston...");
    const loadId = 'mock-load-houston-1001';
    await c.query(`
      INSERT INTO os_event_log (event_type, entity_type, entity_id, payload)
      VALUES (
        'load.booked',
        'directory_loads',
        $1,
        jsonb_build_object(
          'origin', 'Houston, TX',
          'destination', 'Dallas, TX',
          'broker_id', 'mock-broker-001',
          'payout_cents', 75000,
          'status', 'booked'
        )
      )
    `, [loadId]);
    console.log("✅ Broker Load Event injected successfully.");

    // 2. Simulate Operator Insurance Document Upload (Compliance Flag)
    console.log("[TEST 2] Simulating Operator Insurance Upload...");
    const docId = 'mock-doc-ins-992';
    await c.query(`
      INSERT INTO os_event_log (event_type, entity_type, entity_id, payload)
      VALUES (
        'compliance.document_uploaded',
        'operator_documents',
        $1,
        jsonb_build_object(
          'operator_id', 'mock-op-tx-555',
          'document_type', 'insurance',
          'status', 'pending_review',
          'ai_confidence_score', 0.94
        )
      )
    `, [docId]);
    console.log("✅ Operator Document Event injected successfully.");

    // 3. Verify Command Run Generation (Auto-Wire Trigger)
    console.log("[TEST 3] Verifying Command Layer Auto-Wire Trigger...");
    const runs = await c.query(`
      SELECT r.id, r.status, a.slug, r.trigger
      FROM hc_command_runs r
      JOIN hc_command_agents a ON a.id = r.agent_id
      WHERE r.started_at > NOW() - INTERVAL '5 minutes'
      ORDER BY r.started_at DESC
      LIMIT 5
    `);
    
    if (runs.rows.length > 0) {
      console.log("✅ Command Runs Successfully Spawned:", runs.rows.length, "runs found.");
      runs.rows.forEach(r => console.log(`   - Agent: ${r.slug} | Status: ${r.status}`));
    } else {
      console.log("⚠️ No Command Runs found. Ensure trigger logic is active.");
    }

  } catch (error) {
    console.error("❌ E2E Smoke Test Failed:", error);
  } finally {
    await c.end();
    console.log("🏁 SMOKE TESTS COMPLETE.");
  }
}

runSmokeTests();
