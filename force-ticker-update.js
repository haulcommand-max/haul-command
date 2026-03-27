/**
 * Force-refresh the activity ticker on mobile.
 * 1. Delete old stale "X operators now listed globally" events
 * 2. Insert a fresh one with the real count from directory_listings
 */
const { Client } = require('pg');
const fs = require('fs');

const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const [k,...v] = l.split('='); if(k&&v.length) env[k.trim()] = v.join('=').trim();
});

const client = new Client({ connectionString: env['SUPABASE_DB_POOLER_URL'] });

async function run() {
  await client.connect();

  // Get real operator count from directory_listings
  const res = await client.query(`
    SELECT COUNT(*) as cnt FROM directory_listings 
    WHERE is_visible = true 
    AND entity_type IN (
      'operator', 'pilot_car_operator', 'pilot_driver',
      'freight_broker', 'flagger', 'permit_service',
      'heavy_towing', 'mobile_mechanic'
    );
  `);
  const realCount = parseInt(res.rows[0].cnt);
  console.log(`Real operator count from directory_listings: ${realCount.toLocaleString()}`);

  // Check what activity_events table looks like
  const colCheck = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='activity_events'
    ORDER BY ordinal_position;
  `).catch(() => ({ rows: [] }));
  console.log('activity_events columns:', colCheck.rows.map(r => r.column_name).join(', '));

  if (colCheck.rows.length === 0) {
    console.log('activity_events table not found — cron may use a different mechanism');
    await client.end();
    return;
  }

  // Delete all rate_update / operator count events (stale)
  const del = await client.query(`
    DELETE FROM activity_events 
    WHERE event_type = 'rate_update' 
    OR (payload->>'summary' LIKE '%operators now listed%');
  `).catch(e => {
    console.log('Delete by payload failed, trying simpler delete:', e.message);
    return client.query(`DELETE FROM activity_events WHERE event_type = 'rate_update';`);
  });
  console.log(`Deleted ${del.rowCount} stale ticker events`);

  // Insert fresh event with real count
  const cols = colCheck.rows.map(r => r.column_name);
  
  if (cols.includes('payload')) {
    await client.query(`
      INSERT INTO activity_events (event_type, payload, geo_country, geo_state, visibility)
      VALUES (
        'rate_update',
        $1,
        'US', 'TX', 'public'
      );
    `, [JSON.stringify({
      summary: `${realCount.toLocaleString()} operators now listed globally`,
      description: 'Directory growing across all markets',
    })]);
    console.log(`✅ Inserted fresh ticker: "${realCount.toLocaleString()} operators now listed globally"`);
  } else {
    console.log('payload column not found — dumping actual columns for manual fix:', cols);
  }

  // Show current ticker events
  const current = await client.query(`
    SELECT event_type, payload, created_at FROM activity_events 
    ORDER BY created_at DESC LIMIT 5;
  `);
  console.log('\nCurrent activity_events (newest first):');
  current.rows.forEach(r => console.log(`  [${r.event_type}] ${JSON.stringify(r.payload)?.substring(0,80)} — ${new Date(r.created_at).toISOString()}`));

  await client.end();
}

run().catch(e => console.error('Error:', e.message, e));
