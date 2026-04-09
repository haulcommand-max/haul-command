import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function query() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_POOLER_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    const counts = await client.query(`
      SELECT admin1_code as state, COUNT(*) as c 
      FROM hc_places 
      WHERE country_code = 'US' AND admin1_code IS NOT NULL AND admin1_code != 'AK' AND admin1_code != 'HI' AND admin1_code != 'DC'
      GROUP BY admin1_code 
      ORDER BY c ASC 
      LIMIT 10
    `);
    console.log("\n=== BOTTOM 10 STATES IN HC_PLACES ===");
    console.log(counts.rows);
  } catch(e) {
    console.error(e);
  }
  
  await client.end();
}
query();
