import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '../.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CANONICAL_ROLES = [
  { role_slug: 'pilot_car_operator', role_name: 'Pilot Car Operator', role_layer: 'core_operator_layer' },
  { role_slug: 'flagger', role_name: 'Flagger', role_layer: 'traffic_control_layer' },
  { role_slug: 'height_pole', role_name: 'High Pole Escort', role_layer: 'core_operator_layer' },
  { role_slug: 'permit_service', role_name: 'Permit Service Company', role_layer: 'permit_and_compliance_layer' },
  { role_slug: 'route_survey', role_name: 'Route Survey Specialist', role_layer: 'route_and_engineering_layer' },
  { role_slug: 'freight_broker', role_name: 'Freight Broker', role_layer: 'commercial_demand_layer' }
];

const ALIASES = [
  { role_slug: 'pilot_car_operator', country: 'US', alias: 'Pilot Car' },
  { role_slug: 'pilot_car_operator', country: 'CA', alias: 'Pilot Vehicle' },
  { role_slug: 'pilot_car_operator', country: 'GB', alias: 'Escort Vehicle' },
  { role_slug: 'pilot_car_operator', country: 'AU', alias: 'Load Pilot' },
  // Brand-building Military/DoD slang
  { role_slug: 'dod_cleared_escort', country: 'US', alias: 'Convoy Commander' },
  { role_slug: 'dod_cleared_escort', country: 'US', alias: 'Military Transport Escort' },
  { role_slug: 'dod_cleared_escort', country: 'US', alias: 'Heavy Lift Clearance Pilot' },
  { role_slug: 'twic_cleared_operator', country: 'US', alias: 'Port Cleared Operator' }
];

const MILITARY_TERMS_APPEND = [
  { term_slug: 'strac', term_name: 'STRAC (Strictly Ready and Competent)', term_type: 'military_slang' },
  { term_slug: 'convoy-clearance', term_name: 'Convoy Clearance', term_type: 'military_compliance' },
  { term_slug: 'dod-secret-clearance', term_name: 'DoD Secret Clearance', term_type: 'military_compliance' }
];

async function runMigration() {
  console.log('Fetching old dictionary...');
  const { data: legacyTerms, error: fetchErr } = await supabase.from('hc_dictionary').select('*');
  if (fetchErr) {
    if (fetchErr.code === '42P01') {
      console.log('Legacy table hc_dictionary not found or not seeded. We will proceed with canonical roles mapping.');
    } else {
      console.error(fetchErr);
    }
  }
  
  console.log('Migrating Canonical Roles...');
  const rolesMap = {};
  for (const r of CANONICAL_ROLES) {
    const { data: roleData, error: rErr } = await supabase.from('canonical_role')
      .upsert({ role_slug: r.role_slug, role_name: r.role_name, role_layer: r.role_layer })
      .select().single();
    if (rErr) console.error('Error upserting role', rErr);
    else rolesMap[r.role_slug] = roleData.id;
  }

  console.log('Migrating Country Role Aliases...');
  for (const a of ALIASES) {
    if (!rolesMap[a.role_slug]) continue;
    await supabase.from('country_role_alias').insert({
      country_code: a.country,
      canonical_role_id: rolesMap[a.role_slug],
      alias_term: a.alias,
      confidence_score: 100
    }).catch(() => {}); // ignore duplicates
  }

  console.log('Migrating Legacy Terms into Global Terminology Graph...');
  if (legacyTerms && legacyTerms.length > 0) {
    const termUpserts = legacyTerms.map(t => ({
      term_slug: t.term_id,
      term_name: t.term,
      classification: 'confirmed_safe',
      term_type: t.category || 'general'
    }));

    for (let i = 0; i < termUpserts.length; i += 100) {
      await supabase.from('glossary_control_term').upsert(termUpserts.slice(i, i + 100), { onConflict: 'term_slug' });
    }
    console.log(`Migrated ${legacyTerms.length} legacy terms into the control layer.`);
  }

  console.log('Inserting Military & Specialized Taxonomies...');
  const militaryUpserts = MILITARY_TERMS_APPEND.map(t => ({
    ...t,
    classification: 'confirmed_safe'
  }));
  await supabase.from('glossary_control_term').upsert(militaryUpserts, { onConflict: 'term_slug' });
  
  console.log('Task 1 Complete.');
}

runMigration().then(() => process.exit(0)).catch(console.error);
