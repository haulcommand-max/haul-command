require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function chk() {
  const { data } = await supabase.from('hc_global_operators').select('id').limit(3);
  console.log(data);
}
chk();
