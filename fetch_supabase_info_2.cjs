const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log("NO ENV");
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}

if (!key) {
  // Try finding it
  for (const line of env.split('\n')) {
    if (line.includes('SERVICE_ROLE')) key = line.split('=')[1].trim();
  }
}

const supabase = createClient(url, key, {
  auth: { persistSession: false }
});

async function run() {
  try {
    const res1 = await supabase.from('listings').select('*', { count: 'exact', head: true });
    console.log('Listings:', res1);

    const res2 = await supabase.from('tools').select('*', { count: 'exact', head: true });
    console.log('Tools table:', res2);

    const res3 = await supabase.from('faqs').select('*', { count: 'exact', head: true });
    console.log('Faqs table:', res3);

    const res4 = await supabase.from('dictionary_terms').select('*', { count: 'exact', head: true });
    console.log('Dictionary:', res4);

    const res5 = await supabase.rpc('get_table_counts');
    console.log('RPC:', res5);
  } catch (err) {
    console.error("Try catch error:", err);
  }
}
run();
