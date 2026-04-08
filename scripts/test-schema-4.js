const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let res = await supabase.from('ad_slots').select('*').limit(1);
    console.log('ad_slots config:', res.error || (res.data.length ? Object.keys(res.data[0]) : 'empty table'));
})();
