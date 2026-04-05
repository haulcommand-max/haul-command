require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const updateMap = {
  'texas-pilot-car-requirements-2026': '/blog/hero-texas-pilot.png',
  'high-pole-pilot-car-requirements': '/blog/hero-high-pole.png',
  'how-to-get-verified-pilot-car-operator': '/blog/hero-verified.png',
  'i-35-corridor-heavy-haul-guide': '/blog/hero-i35.png'
};

async function update() {
  for (const [slug, url] of Object.entries(updateMap)) {
    const { data, error } = await sb.from('blog_posts').update({ hero_image_url: url }).eq('slug', slug);
    if (error) {
       console.error(`Failed to update ${slug}:`, error.message);
    } else {
       console.log(`Updated ${slug} with ${url}`);
    }
  }
}
update();
