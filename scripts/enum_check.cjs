import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: d1 } = await sb.rpc('exec_sql', { query: `SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c WHERE c.conname = 'search_documents_entity_type_check'` });
  console.log('search_documents check:', d1);
}
check();
