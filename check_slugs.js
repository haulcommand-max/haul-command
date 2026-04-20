require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { data: c } = await supabase.from('hc_training_courses').select('slug, title, id');
  console.log('hc_training_courses slugs:', c?.map(x => x.slug).slice(0, 5));
  
  const { data: m } = await supabase.from('training_modules').select('slug, title, id');
  console.log('training_modules slugs:', m?.map(x => x.slug));
}

fix();
