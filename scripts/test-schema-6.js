const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
    let res = await supabase.from('seo_pages').insert({page_type: 'corridor', slug: 'test-123', title: 'test', meta_description: 'test', h1: 'test', status: 'published', country_code: 'US', is_indexable: true});
    console.log('seo_pages error:', res.error);

    let res2 = await supabase.from('ad_slots').insert({slot_type: 'premium'}).select();
    console.log('ad_slots error:', res2.error);
})();
