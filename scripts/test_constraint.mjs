import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('directory_listings').select('entity_type').limit(10);
  console.log('from directory_listings:', [...new Set(data?.map(o=>o.entity_type))]);
  
  // try inserting a dummy with entity_type='operator'
  const res = await supabase.from('directory_listings').insert({ 
      entity_id: 'test-1234', 
      name: 'test', 
      slug: 'test-1234', 
      entity_type: 'operator' 
  });
  console.log('insert operator info:', res);
}
check();
