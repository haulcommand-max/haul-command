// Apply composite_score migration to Supabase
// Run: node scripts/apply-composite-score.cjs
const fs = require('fs');
const path = require('path');

// Read env
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) envVars[key.trim()] = rest.join('=').trim();
});

const SUPABASE_URL = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_KEY in .env.local');
  process.exit(1);
}

const sql = `
create or replace view public.hc_corridor_public_v1 as
select
  c.id, c.corridor_code, c.slug, c.name, c.short_name,
  c.status, c.corridor_type, c.tier, c.country_code,
  c.primary_language_code, c.currency_code,
  c.origin_country_code, c.origin_region_code, c.origin_city_name,
  c.destination_country_code, c.destination_region_code, c.destination_city_name,
  c.is_cross_border, c.distance_km, c.distance_miles, c.typical_mode,
  c.corridor_score,
  c.corridor_score as composite_score,
  c.seo_priority_score, c.market_priority_score,
  c.monetization_priority_score, c.freshness_score, c.confidence_score,
  c.permit_complexity_score, c.escort_complexity_score,
  c.credential_complexity_score, c.scarcity_score, c.urgency_score,
  c.ad_inventory_score, c.commercial_value_estimate, c.search_volume_estimate,
  req.requirement_count, req.permit_count, req.escort_count,
  cr.credential_count, cr.required_credential_count,
  pr.escort_rate_median, pr.operator_rate_median, pr.urgent_fill_premium
from public.hc_corridors c
left join (
  select corridor_id,
    count(*) as requirement_count,
    count(*) filter (where requirement_type='permit') as permit_count,
    count(*) filter (where requirement_type in ('escort','pilot_car')) as escort_count
  from public.hc_corridor_requirements
  group by corridor_id
) req on req.corridor_id = c.id
left join (
  select corridor_id,
    count(*) as credential_count,
    count(*) filter (where required=true) as required_credential_count
  from public.hc_corridor_credentials
  group by corridor_id
) cr on cr.corridor_id = c.id
left join (
  select corridor_id,
    max(amount_median) filter (where observation_type='escort_rate') as escort_rate_median,
    max(amount_median) filter (where observation_type='operator_rate') as operator_rate_median,
    max(amount_median) filter (where observation_type='urgent_fill_premium') as urgent_fill_premium
  from public.hc_corridor_pricing_obs
  group by corridor_id
) pr on pr.corridor_id = c.id
where c.active = true and c.status = 'active';
`;

async function run() {
  console.log('Deploying composite_score view to:', SUPABASE_URL);
  
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ query: sql }),
  });

  // The RPC approach may not work for DDL. Try the pg_net or SQL endpoint instead.
  // Supabase has a SQL execution endpoint at /pg/query for service role
  if (!resp.ok) {
    console.log('RPC approach returned:', resp.status, await resp.text());
    console.log('Trying direct SQL via Supabase Management API...');
    
    // Use the Supabase Management API SQL endpoint
    const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
    const mgmtResp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    
    if (mgmtResp.ok) {
      console.log('✅ Migration deployed successfully via Management API!');
      console.log(await mgmtResp.text());
    } else {
      console.log('Management API returned:', mgmtResp.status);
      console.log(await mgmtResp.text());
      console.log('\n⚠️  Auto-deploy failed. Please run the SQL manually:');
      console.log('    1. Go to https://supabase.com/dashboard/project/hvjyfyzotqobfkakjozp/sql/new');
      console.log('    2. Paste the SQL from: supabase/migrations/20260407_001_add_composite_score_to_view.sql');
      console.log('    3. Click "Run"');
    }
  } else {
    console.log('✅ Migration deployed successfully!');
  }
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
