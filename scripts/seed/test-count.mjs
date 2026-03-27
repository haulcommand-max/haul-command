import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { count, error } = await supabase.from('directory_listings').select('*', { count: 'exact', head: true });
  if (error) {
    console.error("directory_listings Error:", error);
  } else {
    console.log("directory_listings Count:", count);
  }
}
check();
