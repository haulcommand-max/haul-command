// Seed monetization_flags with production-ready paywall defaults
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Get all market_entities that don't have monetization_flags yet
  const { data: entities, error: entErr } = await supabase
    .from('market_entities')
    .select('id, country_id, claim_status');

  if (entErr || !entities) {
    console.error('Failed to fetch entities:', entErr?.message);
    return;
  }
  
  console.log(`Found ${entities.length} market_entities`);

  // Get existing monetization_flags to avoid duplicates
  const { data: existing } = await supabase
    .from('monetization_flags')
    .select('entity_id');
  
  const existingIds = new Set((existing || []).map(e => e.entity_id));
  const toSeed = entities.filter(e => !existingIds.has(e.id));
  
  console.log(`${toSeed.length} entities need monetization_flags`);

  // Get country_roles for each entity
  let seeded = 0;
  for (const entity of toSeed) {
    // Get a country_role for this entity's country
    const { data: roles } = await supabase
      .from('country_roles')
      .select('id')
      .eq('country_id', entity.country_id)
      .limit(1);

    if (!roles || roles.length === 0) {
      console.log(`  ⚠ No roles for entity ${entity.id}`);
      continue;
    }

    const isClaimed = entity.claim_status === 'claimed' || entity.claim_status === 'verified';

    const { error } = await supabase
      .from('monetization_flags')
      .insert({
        entity_id: entity.id,
        country_id: entity.country_id,
        country_role_id: roles[0].id,
        // Claimed entities get more revenue opportunities
        can_receive_jobs: isClaimed,
        can_pay_take_rate: isClaimed,
        lead_unlockable: true, // All entities can have leads unlocked
        subscription_eligible: true,
        featured_listing_eligible: isClaimed,
        territory_sponsor_eligible: isClaimed,
        corridor_sponsor_eligible: isClaimed,
        training_eligible: true,
        insurance_referral_eligible: isClaimed,
        financing_referral_eligible: isClaimed,
        equipment_marketplace_eligible: true,
        rush_fee_eligible: isClaimed,
        standby_margin_eligible: isClaimed,
        data_sale_eligible: false, // Opt-in only
        api_exposure_eligible: true,
        revenue_priority_score: isClaimed ? 80 : 30,
        lifecycle_stage: isClaimed ? 'activate' : 'seed',
      });

    if (error) {
      console.log(`  ✗ ${entity.id}: ${error.message}`);
    } else {
      seeded++;
    }
  }

  console.log(`\n✅ Seeded ${seeded} monetization_flags entries`);
  
  // Verify
  const { count } = await supabase
    .from('monetization_flags')
    .select('*', { count: 'exact', head: true });
  console.log(`Total monetization_flags in DB: ${count}`);
}

main().catch(console.error);
