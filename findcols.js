require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findCols() {
  const { data, error } = await supabase.from('ad_slots').insert({ slot_id: 'test_foo' }).select();
  if (error) console.error(error);
  else console.log(data);
}

findCols();
