import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    console.log("Querying listings...");
    const { data, error } = await supabase.from('listings').select('*').limit(1);
    if(error){
        console.error("Error connecting or querying listings:", error);
    } else {
        console.log("Data:", data);
    }
}
check();
