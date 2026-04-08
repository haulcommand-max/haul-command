const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { error: e1 } = await supabase.from('seo_pages').insert({
    page_type: 'corridor',
    slug: 'test-slug',
    title: 'Test',
    description: 'Test',
    h1: 'Test',
    status: 'published'
  });
  console.log('seo_pages insert error:', e1 || 'None');

  const { error: e2 } = await supabase.from('seo_content_corridor_pages').insert({
    slug: 'test-slug',
    title_tag: 'Test'
  });
  console.log('seo_content_corridor_pages insert error:', e2 || 'None');
  
  const { data: products, error: e3 } = await supabase.from('sponsorship_products').select('*');
  console.log('sponsorship_products config count:', products?.length, 'error:', e3 || 'None');
  
  const { data: ads, error: e4 } = await supabase.from('ad_campaigns').select('*').limit(1);
  console.log('ad_campaigns query list:', ads?.length, 'error:', e4 || 'None');
})();
