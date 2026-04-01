/**
 * WLS Data Loader — Push extracted WLS regulation + certification data into Supabase
 * 
 * Prerequisites:
 *   1. Run wls_regulation_ddl.sql in Supabase SQL Editor
 *   2. Run wls_regulation_crawler.mjs to generate data/wls_regulations.json + data/wls_certifications.json
 * 
 * Usage:
 *   node scripts/wls_data_loader.mjs              # Load regulations + certifications
 *   node scripts/wls_data_loader.mjs --dry-run    # Preview without writing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DRY_RUN = process.argv.includes('--dry-run');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  WLS Data Loader → Supabase');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Mode: ${DRY_RUN ? '🧪 DRY RUN' : '🔴 LIVE'}`);
  console.log('');

  // ── Load regulation data ──
  const regPath = path.resolve(__dirname, '..', 'data', 'wls_regulations.json');
  if (!fs.existsSync(regPath)) {
    console.error('❌ data/wls_regulations.json not found. Run wls_regulation_crawler.mjs first.');
    process.exit(1);
  }

  const regulations = JSON.parse(fs.readFileSync(regPath, 'utf-8'));
  console.log(`  📋 Loaded ${regulations.length} regulation records\n`);

  // ── Phase 1: Upsert jurisdiction regulations ──
  console.log('📋 PHASE 1: Upserting jurisdiction regulations\n');
  let regSuccess = 0, regFail = 0;

  for (const reg of regulations) {
    const record = {
      country_code: reg.country_code,
      admin1_code: reg.admin1_code,
      admin1_name: reg.admin1_name,
      max_length_ft: reg.max_length_ft,
      max_width_ft: reg.max_width_ft,
      max_height_ft: reg.max_height_ft,
      max_weight_lbs: reg.max_weight_lbs,
      max_overhang_rear_ft: reg.max_overhang_rear_ft,
      max_overhang_front_ft: reg.max_overhang_front_ft,
      superload_threshold_lbs: reg.superload_threshold_lbs,
      superload_threshold_width_ft: reg.superload_threshold_width_ft,
      superload_threshold_height_ft: reg.superload_threshold_height_ft,
      superload_threhold_length_ft: reg.superload_threshold_length_ft, // NOTE: typo in DB column name
      source: 'wls',
      source_url: reg.source_url,
      confidence_score: reg.confidence_score,
      raw_text: reg.raw_text?.substring(0, 4000),
      last_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (DRY_RUN) {
      console.log(`  [DRY] ${reg.country_code}/${reg.admin1_code} ${reg.admin1_name}`);
      regSuccess++;
      continue;
    }

    const { data, error } = await supabase
      .from('hc_jurisdiction_regulations')
      .upsert(record, { onConflict: 'country_code,admin1_code' })
      .select('id');

    if (error) {
      console.error(`  ❌ ${reg.admin1_code}: ${error.message}`);
      regFail++;
    } else {
      const jurisdictionId = data?.[0]?.id;
      console.log(`  ✅ ${reg.country_code}/${reg.admin1_code} ${reg.admin1_name} → id:${jurisdictionId}`);
      regSuccess++;

      // ── Insert permit cost rules ──
      if (reg.permit_costs?.length > 0 && jurisdictionId) {
        // Delete existing cost rules for this jurisdiction
        await supabase
          .from('hc_permit_cost_rules')
          .delete()
          .eq('jurisdiction_id', jurisdictionId);

        const costRecords = reg.permit_costs.map(pc => ({
          jurisdiction_id: jurisdictionId,
          permit_type: pc.permit_type,
          base_cost_usd: pc.base_cost_usd,
          weight_min_lbs: pc.weight_min_lbs || null,
          weight_max_lbs: pc.weight_max_lbs || null,
          source: 'wls',
          last_verified_at: new Date().toISOString(),
        }));

        const { error: costErr } = await supabase
          .from('hc_permit_cost_rules')
          .insert(costRecords);
        
        if (costErr) {
          console.error(`     ⚠ Permit costs: ${costErr.message}`);
        } else {
          console.log(`     💰 ${costRecords.length} permit cost rules`);
        }
      }

      // ── Insert travel restrictions ──
      if (reg.travel_restrictions?.length > 0 && jurisdictionId) {
        await supabase
          .from('hc_travel_restrictions')
          .delete()
          .eq('jurisdiction_id', jurisdictionId);

        const travelRecords = reg.travel_restrictions.map(tr => ({
          jurisdiction_id: jurisdictionId,
          restriction_type: tr.restriction_type,
          description: tr.description,
          source: 'wls',
          last_verified_at: new Date().toISOString(),
        }));

        const { error: travelErr } = await supabase
          .from('hc_travel_restrictions')
          .insert(travelRecords);
        
        if (travelErr) {
          console.error(`     ⚠ Travel restrictions: ${travelErr.message}`);
        } else {
          console.log(`     🕐 ${travelRecords.length} travel restrictions`);
        }
      }

      // ── Insert signage requirements ──
      if (reg.signage_requirements && Object.keys(reg.signage_requirements).length > 0 && jurisdictionId) {
        await supabase
          .from('hc_signage_requirements')
          .delete()
          .eq('jurisdiction_id', jurisdictionId);

        const signRecord = {
          jurisdiction_id: jurisdictionId,
          headlights_required: reg.signage_requirements.headlights_required || true,
          sign_text: reg.signage_requirements.sign_text || 'OVERSIZE LOAD',
          sign_min_width_ft: reg.signage_requirements.sign_min_width_ft,
          sign_letter_height_inches: reg.signage_requirements.letter_height_inches,
          source: 'wls',
          last_verified_at: new Date().toISOString(),
        };

        const { error: signErr } = await supabase
          .from('hc_signage_requirements')
          .insert(signRecord);
        
        if (signErr) {
          console.error(`     ⚠ Signage: ${signErr.message}`);
        } else {
          console.log(`     🚧 Signage requirements`);
        }
      }
    }
  }

  console.log(`\n  Regulations: ✅ ${regSuccess} succeeded, ❌ ${regFail} failed\n`);

  // ── Phase 2: Load certifications ──
  const certPath = path.resolve(__dirname, '..', 'data', 'wls_certifications.json');
  if (fs.existsSync(certPath)) {
    console.log('\n📋 PHASE 2: Loading pilot car certification data\n');
    const certifications = JSON.parse(fs.readFileSync(certPath, 'utf-8'));
    let certSuccess = 0, certFail = 0;

    for (const cert of certifications) {
      const record = {
        country_code: 'US',
        admin1_code: cert.state_code,
        admin1_name: cert.state_name,
        requires_certification: cert.requires_certification,
        min_age: cert.min_age,
        training_hours: cert.training_hours,
        insurance_min_usd: cert.insurance_min_usd,
        renewal_period_years: cert.renewal_period_years,
        reciprocity_states: cert.reciprocity_states,
        training_urls: cert.training_urls,
        application_urls: cert.application_urls,
        special_notes: cert.notes?.substring(0, 2000),
        source: 'wls',
      };

      if (DRY_RUN) {
        console.log(`  [DRY] ${cert.state_code} ${cert.state_name} — recip: ${cert.reciprocity_states.join(',')}`);
        certSuccess++;
        continue;
      }

      const { error } = await supabase
        .from('hc_certification_requirements')
        .insert(record);

      if (error) {
        console.error(`  ❌ ${cert.state_code}: ${error.message}`);
        certFail++;
      } else {
        console.log(`  ✅ ${cert.state_code} ${cert.state_name}`);
        certSuccess++;
      }
    }

    console.log(`\n  Certifications: ✅ ${certSuccess} succeeded, ❌ ${certFail} failed\n`);
  }

  // ── Phase 3: Insert content freshness records ──
  if (!DRY_RUN) {
    console.log('\n📋 PHASE 3: Registering content freshness\n');
    
    const freshnessRecords = regulations.map(r => ({
      page_path: `/directory/${r.country_code.toLowerCase()}/${r.admin1_code.toLowerCase()}`,
      content_type: 'regulation',
      jurisdiction_code: `${r.country_code}/${r.admin1_code}`,
      last_verified_at: new Date().toISOString(),
      next_review_due: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      confidence_score: r.confidence_score,
      auto_refreshable: false,
    }));

    const { error } = await supabase
      .from('hc_content_freshness')
      .upsert(freshnessRecords, { onConflict: 'page_path' });

    if (error) {
      console.error(`  ⚠ Freshness: ${error.message}`);
    } else {
      console.log(`  ✅ ${freshnessRecords.length} freshness records registered`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  WLS Data Loader — COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
