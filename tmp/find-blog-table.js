require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', url?.substring(0, 30) + '...');

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'public' },
});

(async () => {
  // The blog_posts table might require schema reload
  // Try fetching with explicit options
  const { data, error } = await sb
    .from('blog_posts')
    .select('id, slug, title')
    .limit(5);

  if (error) {
    console.log('blog_posts error:', error.message, error.code, error.details);
    
    // Check if the table might be in a different schema
    // Also try with schema option
    const sb2 = createClient(url, key, {
      auth: { persistSession: false },
      db: { schema: 'public' },
      global: { headers: { 'x-client-info': 'haul-command-server/1.0' } },
    });
    
    const { data: d2, error: e2 } = await sb2.from('blog_posts').select('id').limit(1);
    console.log('Retry:', d2, e2?.message);
    
    // Also try using the REST API directly
    const resp = await fetch(`${url}/rest/v1/blog_posts?select=id,slug,title&limit=3`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    const body = await resp.text();
    console.log('REST Status:', resp.status);
    console.log('REST Body:', body.substring(0, 500));
  } else {
    console.log('SUCCESS! Found', data?.length, 'posts');
    data?.forEach(p => console.log(`  - ${p.slug}: ${p.title}`));
  }
})();
