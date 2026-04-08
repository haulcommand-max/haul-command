const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let res = await supabase.from('hc_monetization_products').select('*').limit(1);
    console.log('monetization_products:', res.error || (res.data.length ? Object.keys(res.data[0]) : 'empty table'));
    
    let res2 = await supabase.from('hc_page_surfaces').select('*').limit(1);
    console.log('hc_page_surfaces:', res2.error || (res2.data.length ? Object.keys(res2.data[0]) : 'empty table'));

    let res3 = await supabase.from('seo_pages').select('*').limit(1);
    console.log('seo_pages:', res3.error || (res3.data.length ? Object.keys(res3.data[0]) : 'empty table'));
})();
