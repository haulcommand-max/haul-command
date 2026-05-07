// Quick check script for Supabase view + Vercel + Map diagnostics
const SUPABASE_URL = 'https://hvjyfyzotqobfkakjozp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDYzMTUsImV4cCI6MjA4NzAyMjMxNX0.K-la5Lc6PBNCjyEqK-2vyfZPct-DZCBWg69cu4c0zqg';

async function main() {
  console.log('=== CHECK 1: v_directory_publishable VIEW ===');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/v_directory_publishable?select=*&limit=3`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    const status = res.status;
    const body = await res.text();
    console.log(`Status: ${status}`);
    if (status === 200) {
      const data = JSON.parse(body);
      console.log(`Rows returned: ${data.length}`);
      if (data.length > 0) {
        console.log('First row keys:', Object.keys(data[0]).join(', '));
        console.log('Sample:', JSON.stringify(data[0], null, 2).slice(0, 500));
      } else {
        console.log('⚠️  View exists but returned 0 rows. Check if directory_listings has visible=true rows.');
      }
    } else {
      console.log('❌ VIEW DOES NOT EXIST or access denied.');
      console.log('Response:', body.slice(0, 300));
    }
  } catch (e) {
    console.log('❌ Network error:', e.message);
  }

  console.log('\n=== CHECK 2: directory_listings TABLE (raw) ===');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/directory_listings?select=id,name,region_code,is_visible&limit=3`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    const status = res.status;
    const body = await res.text();
    console.log(`Status: ${status}`);
    if (status === 200) {
      const data = JSON.parse(body);
      console.log(`Rows in directory_listings: ${data.length} (showing first 3)`);
      data.forEach((r, i) => console.log(`  [${i}] id=${r.id}, name=${r.name}, region=${r.region_code}, visible=${r.is_visible}`));
    } else {
      console.log('Response:', body.slice(0, 300));
    }
  } catch (e) {
    console.log('❌ Network error:', e.message);
  }

  console.log('\n=== CHECK 3: Mapbox Token ===');
  // Read from .env.local
  const fs = require('fs');
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const mapboxLine = env.split('\n').find(l => l.startsWith('NEXT_PUBLIC_MAPBOX_TOKEN'));
    if (mapboxLine) {
      const val = mapboxLine.split('=')[1]?.trim();
      console.log(val ? `✅ Token present: ${val.slice(0,10)}...` : '❌ Token key exists but value is EMPTY');
    } else {
      console.log('❌ NEXT_PUBLIC_MAPBOX_TOKEN is NOT SET in .env.local');
    }
  } catch (e) {
    console.log('Could not read .env.local:', e.message);
  }

  console.log('\n=== CHECK 4: Live Site Status ===');
  try {
    const res = await fetch('https://haulcommand.com/', { redirect: 'follow' });
    console.log(`Homepage: ${res.status} ${res.statusText}`);
  } catch (e) {
    console.log('❌ Cannot reach haulcommand.com:', e.message);
  }
  
  try {
    const res = await fetch('https://haulcommand.com/directory', { redirect: 'follow' });
    console.log(`Directory: ${res.status} ${res.statusText}`);
  } catch (e) {
    console.log('❌ Cannot reach /directory:', e.message);
  }

  try {
    const res = await fetch('https://haulcommand.com/map/live', { redirect: 'follow' });
    console.log(`Map/Live: ${res.status} ${res.statusText}`);
  } catch (e) {
    console.log('❌ Cannot reach /map/live:', e.message);
  }
}

main();
