import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pkg from 'pg';
const { Client } = pkg;
import * as fs from 'fs';

async function runSQL() {
  const cn = process.env.SUPABASE_DB_POOLER_URL;
  if (!cn) {
    console.error("No connection string found");
    return;
  }
  const client = new Client({ connectionString: cn });
  await client.connect();
  
  const sql = fs.readFileSync('supabase/migrations/20260326080000_mass_ingestion_1_5m_us.sql', 'utf-8');
  console.log("Executing SQL...");
  try {
    await client.query(sql);
    console.log("SQL executed successfully!");
  } catch (e) {
    console.error("Error executing SQL:", e);
  } finally {
    await client.end();
  }
}
runSQL();
