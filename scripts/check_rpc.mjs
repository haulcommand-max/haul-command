import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('Testing bulk_ingestion_rpc...');
  const { data, error, status } = await supabase.rpc('bulk_ingest_directory_listings', {
    p_rows: []
  });
  console.log('Status code:', status);
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('✅ RPC is live!');
  }
}
check();
