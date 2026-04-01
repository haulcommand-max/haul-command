require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('glossary_public').select('*').limit(1);
  console.log('glossary_public view:', data ? 'OK' : error);
  if (data) console.log(data);
}
run();
