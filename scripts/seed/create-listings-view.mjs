import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pkg from 'pg';
const { Client } = pkg;

async function createView() {
  const cn = process.env.SUPABASE_DB_POOLER_URL;
  if (!cn) {
    console.error("No connection string found");
    return;
  }
  const client = new Client({ connectionString: cn });
  await client.connect();
  
  const sql = `
    CREATE OR REPLACE VIEW listings AS
    SELECT 
        id,
        name AS full_name,
        city,
        region_code AS state,
        country_code,
        5.0 AS rating,
        0 AS review_count,
        (claim_status IN ('claimed', 'verified')) AS claimed,
        claim_status,
        ARRAY[entity_type] AS services,
        rank_score,
        false AS featured,
        profile_completeness,
        slug,
        is_visible AS active
    FROM directory_listings;
  `;

  console.log("Executing View creation...");
  try {
    await client.query(sql);
    console.log("View created successfully! This maps directory_listings to the schema expected by the API.");
    
    // Also grant permissions to the view so the API can read it via RLS (or anon/authenticated users)
    await client.query(`GRANT SELECT ON listings TO anon, authenticated, service_role;`);
    console.log("Granted permissions on the view.");
    
  } catch (e) {
    console.error("Error creating View:", e);
  } finally {
    await client.end();
  }
}
createView();
