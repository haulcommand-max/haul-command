require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log("--- directory_listings ---");
    const { data: dl, error: e1 } = await sb.from('directory_listings').select('*').limit(1);
    console.log(e1 ? e1 : Object.keys((dl || [])[0] || {}).join(', '));
    
    console.log("--- hc_places ---");
    const { data: hp, error: e2 } = await sb.from('hc_places').select('*').limit(1);
    console.log(e2 ? e2 : Object.keys((hp || [])[0] || {}).join(', '));
}
run();
