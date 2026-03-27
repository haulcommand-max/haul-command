/**
 * CLEANUP: Delete all matrix-generated garbage from hc_places
 * These are ~388K fake "pilot_car_operator" records incorrectly
 * inserted during the Phase 4 swarm. hc_places is for PLACES
 * (physical locations), not operators.
 */

const { Client } = require('pg');
const fs = require('fs');

const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const [k,...v] = l.split('='); if(k&&v.length) env[k.trim()] = v.join('=').trim();
});

const client = new Client({ connectionString: env['SUPABASE_DB_POOLER_URL'], statement_timeout: 300000 });

async function cleanup() {
  await client.connect();

  // Count before
  const before = await client.query(`SELECT COUNT(*) FROM hc_places WHERE source_system = 'matrix_gen';`);
  console.log(`\n🗑  Deleting ${parseInt(before.rows[0].count).toLocaleString()} matrix-generated records from hc_places...`);

  // Delete in batches to avoid lock timeout
  let deleted = 0;
  while (true) {
    const res = await client.query(`
      DELETE FROM hc_places 
      WHERE id IN (
        SELECT id FROM hc_places WHERE source_system = 'matrix_gen' LIMIT 5000
      );
    `);
    deleted += res.rowCount;
    process.stdout.write(`\r  Deleted ${deleted.toLocaleString()} rows...`);
    if (res.rowCount === 0) break;
  }

  // Also delete the bad providers swarm (source = 'MATRIX_GEN')
  const pBefore = await client.query(`SELECT COUNT(*) FROM providers WHERE source = 'MATRIX_GEN';`);
  if (parseInt(pBefore.rows[0].count) > 0) {
    console.log(`\n\n🗑  Deleting ${parseInt(pBefore.rows[0].count).toLocaleString()} matrix records from providers...`);
    let pdel = 0;
    while (true) {
      const res = await client.query(`
        DELETE FROM providers WHERE id IN (
          SELECT provider_key FROM providers WHERE source = 'MATRIX_GEN' LIMIT 5000
        );
      `).catch(async () => {
        // provider_key not id
        return client.query(`
          DELETE FROM providers WHERE provider_key IN (
            SELECT provider_key FROM providers WHERE source = 'MATRIX_GEN' LIMIT 5000
          );
        `);
      });
      pdel += res.rowCount;
      process.stdout.write(`\r  Deleted ${pdel.toLocaleString()} provider rows...`);
      if (res.rowCount === 0) break;
    }
    console.log(`\n  ✅ providers cleaned`);
  }

  // Final count of legit places
  const after = await client.query(`SELECT COUNT(*) FROM hc_places WHERE status='published';`);
  console.log(`\n\n✅ hc_places cleanup complete`);
  console.log(`   Legitimate published places remaining: ${parseInt(after.rows[0].count).toLocaleString()}`);
  console.log(`   (These are real physical locations: ports, truck stops, hotels, etc.)\n`);

  await client.end();
}

cleanup().catch(e => { console.error('Cleanup error:', e.message); process.exit(1); });
