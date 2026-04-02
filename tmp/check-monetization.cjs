// Seed monetization_flags with default paywall rules
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // First check what columns exist
  const { Client } = require('pg');
  const c = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await c.connect();
  const r = await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='monetization_flags' AND table_schema='public' ORDER BY ordinal_position`);
  console.log('=== monetization_flags columns ===');
  r.rows.forEach(x => console.log(`  ${x.column_name} (${x.data_type})`));
  await c.end();
}

main().catch(console.error);
