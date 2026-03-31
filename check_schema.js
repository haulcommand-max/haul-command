const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.production.local' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function check() {
    // try to get 1 row from hc_public_operators
    const { data: d1, error: e1 } = await supabase.from('hc_public_operators').select('*').limit(1);
    console.log("hc_public_operators:", d1 ? Object.keys(d1[0] || {}) : e1.message);

    // try to get 1 row from provider_directory
    const { data: d2, error: e2 } = await supabase.from('provider_directory').select('*').limit(1);
    console.log("provider_directory:", d2 ? Object.keys(d2[0] || {}) : e2?.message);

    // Also directory_listings just in case
    const { data: d3, error: e3 } = await supabase.from('directory_listings').select('*').limit(1);
    console.log("directory_listings:", d3 ? Object.keys(d3[0] || {}) : e3?.message);
}
check();
