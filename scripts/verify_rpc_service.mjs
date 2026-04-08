import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  console.log("Calling rpc_state_counts via service role key...");
  const { data, error } = await supabase.rpc('rpc_state_counts');
  
  if (error) {
    console.error("RPC Error:", error);
  } else {
    console.log("Success! Data visibility verified. Rows:", data?.length);
    console.log("Sample:", data?.slice(0, 3));
  }
}

verify();
