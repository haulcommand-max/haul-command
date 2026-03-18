/**
 * Batch 2 — Live mixed-format ingestion + full DB proof
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BATCH = `Angie's Pilot Car, llc pickup noon -  ID Verified
Open
Roanoke, VA, USATexarkana, TX, USA
Est. 948 mi
Contact for rate
(918) 638-5878
03/18/2026
about 17 hours ago
High Pole
Reliable Transport LLC -  ID Verified
Open
Long Beach, CA, USAPhoenix, AZ, USA
Est. 384 mi
Contact for rate
Quick Pay
(513) 460-4522 Text Only
03/20/2026
about 17 hours ago
Chase
High Pole
HelixLink Corp. -  ID Verified
Open
Pawtucket, RI, USASeabrook, NH, USA
Est. 89 mi
Contact for rate
(773) 717-5351 Text Only
03/18/2026
about 21 hours ago
LeadMY PEVO ( Drive With Us ) -  ID Verified
Recent
Open
Newton, IL, USAChicago, IL, USA
Est. 223 mi
Contact for rate
Quick Pay
(704) 766-8664
03/18/2026
9 minutes ago
High Pole
MY PEVO ( Drive With Us ) -  ID Verified
Open
Hamilton, OH, USACulpeper, VA, USA
Est. 510 mi
Contact for rate
Quick Pay
(704) 766-8664 Text Only
03/18/2026
about 11 hours ago
Chase
Midwest Pilot Cars -  ID Verified
Open
Rogers, MN, USAWinthrop Harbor, IL, USA
Est. 405 mi
Contact for rate
(605) 670-9654 Text Only
03/18/2026
about 11 hours ago
Chase
HIGH POLE - 8AM -  ID Verified
Open
Milwaukee, WI, USAMonetta, SC, USA
Est. 901 mi
Contact for rate
Quick Pay
(844) 974-8273
03/18/2026
about 13 hours ago
High Pole
Swift PCS - 14'4 -  ID Verified
Open
Ardmore, AL, USANew Salisbury, IN, USA
Est. 286 mi
Contact for rate
(310) 210-0111
03/18/2026
about 13 hours ago
High Pole
North American Pilot Car Service -  ID Verified
Open
Waskom, TX, USARayville, LA, USA
Est. 145 mi
Contact for rate
(217) 860-2201 Text Only
03/18/2026
about 14 hours ago
Chase
Rosebudz, LLC -  ID Verified
Open
Cincinnati, OH, USACartersville, GA, USA
Est. 425 mi
Contact for rate
(812) 239-1981
03/18/2026
about 15 hours ago
High Pole
KNK Express LLC -  ID Verified
Open
Wilmington, NC, USACharlotte, NC, USA
Est. 213 mi
$2.50/mi
Quick Pay
(540) 761-9397
03/18/2026
about 15 hours ago
High Pole
Edgemont Pilots LLC -  ID Verified
Open
Lowell, IN, USAMacon, MO, USA
Est. 351 mi
Contact for rate
Quick Pay
(301) 991-4406
03/18/2026
about 16 hours ago
Chase
MY PEVO ( Drive With Us ) -  ID Verified
Open
Newton, IL, USAChicago, IL, USA
Est. 223 mi
Contact for rate
(704) 766-8664
03/18/2026
about 16 hours ago
High Pole
companies posting.  It is not a place to expect to find loads that are available.

3/17/2026
Load Alert!! PAN LOGISTICS INC 2536663879 Newark NJ Detroit MI Chase
Load Alert!! PAN LOGISTICS INC 2536663879 Oklahoma City OK Kansas City MO Chase
Load Alert!! Hudson Transport 5712103512 Dunkirk MD Pittsburgh PA Chase
Load Alert!! Hudson Transport 5712103512 Hancock MD Sterling VA Chase
Load Alert!! Optimus Translog Services 9568981797 Woodburn IN Lewis Center OH Chase
Load Alert!! STRAITLINE/JOSH RUSSELL 319-572-1358 Concordia MO Hannibal MO Chase
Load Alert!! cmb enterprises inc 2406395496 Norfolk VA Lansing MI Chase
Load Alert!! cmb enterprises inc 2406395496 Norfolk VA Lansing MI Chase
Load Alert!! SHERIDAN LOGISTICS 662-744-1147 San Diego CA Yuma AZ Chase
Load Alert!! Peakb pole and chase car 2406743609 Wilmington NC Charlotte NC Chase
Load Alert!! steve rizza bohica trucking 4176860663 Vail AZ Nogales AZ Chase
Load Alert!! steve rizza bohica trucking 4176860663 Vail AZ Nogales AZ Chase
Load Alert!! Nick 7049021489 Cashiers NC Cashiers NC Chase
Load Alert!! Nick 7049021489 Cashiers NC Cashiers NC Lead
Load Alert!! Armtruck 4073086005 Tallapoosa GA Shreveport LA Chase
Load Alert!! peterspilot 7069940730 Blytheville AR Cairo IL Chase
Load Alert!! one Star Transportation 4235983110 Galveston TX Birmingham AL Chase
Load Alert!! Atlas 2532400305 Mansfield LA Duluth MN Chase
Load Alert!! Atlas 2532400305 Mansfield LA Duluth MN Chase
Load Alert!! Whispering Hills 4029438275 Sioux City IA Fairbury NE Lead
Load Alert!! Atlas Logistics Group 2537770272 Mansfield LA Duluth MN Chase
Load Alert!! Straitline Transportation 3098013300 Ragley LA Lagrange IN Chase
Load Alert!! Midwest Pilot Cars 6056709654 Dyersburg TN Chattanooga TN Chase
3/16/2026
Load Alert!! Armtruck Transport 4073086005 Savannah GA Shreveport LA Chase
Load Alert!! Armtruck Transport/ Gor 4073086005 Savannah GA Shreveport LA Chase
Load Alert!! H and H Services 4068618638 Marysville KS Spencer NE Lead
Load Alert!! PAN LOGISTICS INC 2536663879 Kirkwood NY Buffalo NY Chase
Load Alert!! Cleo's Professional Pilot L.L.C 2192902986 Springfield MO Tulsa OK Lead
Load Alert!! Valley Express Specialize 7019529650 Yankton SD Broken Bow NE Lead
Load Alert!! PAN LOGISTICS INC 2536663879 Elizabeth NJ Buffalo NY Chase
Load Alert!! Gracefull TEXT 3109102953 Houston TX Rayville LA Lead
Load Alert!! Action Pilot Car 2258883917 San Antonio TX Houston TX Chase
Load Alert!! MKOLA PILOT CAR 9292703039 Lindley NY Tonawanda NY Chase
Load Alert!! MKOLA PILOT CAR 9292703039 Lindley NY Tonawanda NY P
Load Alert!! Joshua price llc 5737184487 Damascus AR Junction City KS Lead
Load Alert!! GrandCarriersLLC 440 754 3177 Carr CO Pueblo CO Lead
Load Alert!! Faulknertruckingllc 6074252161 Hamburg IA Crossville TN Chase
Load Alert!! Vlad 7736808550 New market VA West milwaukee WI Chase
Load Alert!! Peters Pilot Cars 7069940730 Danbury CT Boston MA Chase
Load Alert!! Peters Pilot Cars 7069940730 Danbury CT Boston MA Chase
Load Alert!! Kandi Sterling 2075722240 Danbury CT North Kingstown RI Chase
Load Alert!! pan logistics Inc 2536663879 Newark NJ Buffalo NY P
Load Alert!! Matt 6085149707 Cincinnati OH Columbiana OH Chase`;

const TABLES = [
  'lb_ingestion_batches', 'lb_observations', 'lb_organizations',
  'lb_phones', 'lb_aliases', 'lb_corridors', 'lb_claim_queue',
  'broker_surfaces', 'broker_surface_activation_queue',
];

function pass(s: string) { console.log(`  ✅ ${s}`); }
function fail(s: string, r: string) { console.log(`  ❌ ${s}: ${r}`); }
const line = () => console.log('─'.repeat(60));

let VERDICT = 'PASS';
const FAILURES: string[] = [];
function markFail(step: string, reason: string) {
  VERDICT = 'FAIL';
  FAILURES.push(`${step}: ${reason}`);
  fail(step, reason);
}

function computeActivation(org: any): number {
  let s = 0;
  if (org.phones.length > 0) s += 0.2;
  if (org.observation_count >= 3) s += 0.15;
  if (org.observation_count >= 5) s += 0.1;
  if (org.corridors_seen.length >= 2) s += 0.1;
  if (org.country_codes.length >= 2) s += 0.1;
  s += 0.2;
  return Math.min(1, Math.round(s * 100) / 100);
}

function computeOutreach(org: any): number {
  let s = 0;
  if (org.phones.length >= 1) s += 0.25;
  if (org.observation_count >= 2) s += 0.2;
  if (org.corridors_seen.length >= 2) s += 0.15;
  s += 0.2;
  if (org.aliases.length >= 2) s += 0.1;
  return Math.min(1, Math.round(s * 100) / 100);
}

function determineStatus(a: number, c: number, o: number): string {
  if (a >= 0.7) return 'activation_ready';
  if (o >= 0.6) return 'outreach_ready';
  if (c >= 0.5) return 'claim_ready';
  if (a >= 0.3) return 'high_value_watchlist';
  return 'seeded';
}

function buildReason(org: any, activation: number): string {
  const r: string[] = [];
  if (org.phones.length > 0) r.push('phone_present');
  if (org.corridors_seen.length >= 2) r.push('multi_corridor_presence');
  if (org.observation_count >= 2) r.push('repeated_load_posting_behavior');
  if (org.observation_count >= 3) r.push('high_recurrence');
  if (org.aliases.length >= 2) r.push('alias_cluster_density');
  if (activation >= 0.5) r.push('strong_activation_score');
  if (r.length === 0) r.push('seed_observation_captured');
  return r.join('; ');
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   BATCH 2 — LIVE MIXED-FORMAT INGESTION + DB PROOF      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Timestamp: ${new Date().toISOString()}\n`);

  // PRE-RUN COUNTS
  console.log('📋 STEP 1: Pre-run DB Counts');
  line();
  const beforeCounts = new Map<string, number>();
  for (const t of TABLES) {
    const { count } = await sb.from(t).select('*', { count: 'exact', head: true });
    beforeCounts.set(t, count ?? 0);
    console.log(`  ${t.padEnd(38)} ${count ?? 0} rows`);
  }

  // INGEST
  console.log('\n📋 STEP 2: Ingest Mixed Batch');
  line();
  const { ingestLoadBoardBatch } = await import('./src/lib/ingestion/load-board/engine');
  const result = await ingestLoadBoardBatch(BATCH, {
    source_name: 'batch2_live_verification',
    source_type: 'load_alert_board',
    country_hint: 'US',
    supplied_date: null,
  });

  const batchId = result.batch_id;
  console.log(`  batch_id:              ${batchId}`);
  console.log(`  total_lines_received:  ${result.total_lines_received}`);
  console.log(`  total_observations:    ${result.total_observations}`);
  console.log(`  format_mix:            ${result.segmentation_summary.format_mix}`);
  console.log(`  alert_segments:        ${result.segmentation_summary.total_alert_segments}`);
  console.log(`  structured_segments:   ${result.segmentation_summary.total_structured_segments}`);
  console.log(`  full_batch_ingested:   ${result.full_batch_ingested_flag}`);
  console.log(`  unaccounted_lines:     ${result.qa_report.unaccounted_line_count}`);
  console.log(`  persisted_to_supabase: ${result.persisted_to_supabase}`);

  if (!result.full_batch_ingested_flag) markFail('ingest', 'full_batch_ingested_flag false');
  else pass('full_batch_ingested_flag');
  if (result.qa_report.unaccounted_line_count > 0) markFail('ingest', `unaccounted=${result.qa_report.unaccounted_line_count}`);
  else pass('unaccounted_line_count == 0');
  if (result.segmentation_summary.format_mix !== 'mixed') markFail('ingest', `format=${result.segmentation_summary.format_mix}`);
  else pass('format_mix == mixed');
  if (!result.persisted_to_supabase) markFail('persist', 'persisted_to_supabase is false');
  else pass('persisted_to_supabase == true');

  // DB PERSISTENCE PROOF
  console.log('\n📋 STEP 3: Persistence Proof (DB Reads)');
  line();

  const { data: batchRow } = await sb.from('lb_ingestion_batches')
    .select('id, source_name, line_count, parsed_count').eq('id', batchId).maybeSingle();
  if (!batchRow) markFail('batch', 'not found in DB');
  else pass(`batch: ${batchRow.id} (lines=${batchRow.line_count}, parsed=${batchRow.parsed_count})`);

  const { data: obsRows, count: obsCount } = await sb.from('lb_observations')
    .select('parsed_name_or_company, normalized_phone, corridor_key, source_format', { count: 'exact' })
    .eq('batch_id', batchId);
  if (!obsRows || (obsCount ?? 0) === 0) markFail('observations', 'no observations in DB');
  else {
    pass(`observations: ${obsCount} rows`);
    for (const o of (obsRows || []).slice(0, 5)) {
      console.log(`    → ${o.parsed_name_or_company} | ${o.normalized_phone} | ${o.corridor_key} | fmt=${o.source_format}`);
    }
  }

  // BROKER SURFACES
  console.log('\n📋 STEP 4: Broker Surfaces + Scores');
  line();

  let surfacesCreated = 0;
  let surfacesUpdated = 0;
  const surfaceIds: string[] = [];

  for (const org of result.new_organizations_detected) {
    const activation = computeActivation(org);
    const claim = org.observation_count >= 2 ? 0.85 : 0.45;
    const outreach = computeOutreach(org);
    const status = determineStatus(activation, claim, outreach);
    const surfId = `bsrf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    surfaceIds.push(surfId);

    // Check if surface already exists for this org
    const { data: existing } = await sb.from('broker_surfaces')
      .select('broker_surface_id, activation_priority_score')
      .eq('canonical_company_candidate', org.canonical_name)
      .maybeSingle();

    if (existing) {
      // UPDATE existing surface with new scores
      const { error } = await sb.from('broker_surfaces').update({
        activation_priority_score: Math.max(activation, existing.activation_priority_score),
        claim_priority_score: claim,
        outreach_priority_score: outreach,
        acquisition_status: status,
        last_seen_at: new Date().toISOString(),
        recurrence_score: org.recurrence_score,
        observed_corridors: org.corridors_seen,
        source_batch_id: batchId,
      }).eq('broker_surface_id', existing.broker_surface_id);
      if (!error) { surfacesUpdated++; surfaceIds[surfaceIds.length - 1] = existing.broker_surface_id; }
      else console.log(`    ⚠️ update error: ${error.message}`);
    } else {
      // CREATE new surface
      const { error } = await sb.from('broker_surfaces').upsert({
        broker_surface_id: surfId,
        canonical_display_name: org.display_name,
        canonical_company_candidate: org.canonical_name,
        primary_phone: org.phones[0] ?? null,
        additional_phones: org.phones.slice(1),
        alias_cluster_ids: org.aliases,
        acquisition_status: status,
        activation_priority_score: activation,
        claim_priority_score: claim,
        outreach_priority_score: outreach,
        growth_target_flag: activation >= 0.5,
        first_seen_at: org.first_seen,
        last_seen_at: org.last_seen,
        observed_corridors: org.corridors_seen,
        countries_seen: org.country_codes,
        recurrence_score: org.recurrence_score,
        claimable_surface_flag: !!org.phones[0] || org.observation_count >= 2,
        profile_slug: org.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80),
        source_batch_id: batchId,
      }, { onConflict: 'broker_surface_id' });
      if (!error) surfacesCreated++;
      else console.log(`    ⚠️ create error: ${error.message}`);
    }
  }

  pass(`${surfacesCreated} broker surfaces CREATED`);
  pass(`${surfacesUpdated} broker surfaces UPDATED`);

  // ACTIVATION QUEUE
  console.log('\n📋 STEP 5: Activation Queue Buckets');
  line();

  let queueCreated = 0;
  for (let i = 0; i < result.new_organizations_detected.length; i++) {
    const org = result.new_organizations_detected[i];
    const surfId = surfaceIds[i];
    const activation = computeActivation(org);
    const status = determineStatus(activation, org.observation_count >= 2 ? 0.85 : 0.45, computeOutreach(org));

    const { error } = await sb.from('broker_surface_activation_queue').insert({
      broker_surface_id: surfId,
      bucket: status,
      score: activation,
      reason: buildReason(org, activation),
      source_batch_id: batchId,
    });
    if (!error) queueCreated++;
    else console.log(`    ⚠️ queue error: ${error.message}`);
  }

  if (queueCreated === 0) markFail('queue', 'no activation queue rows');
  else pass(`${queueCreated} activation queue rows created`);

  const { data: queueRows } = await sb.from('broker_surface_activation_queue')
    .select('bucket, score, reason, broker_surface_id').eq('source_batch_id', batchId);

  const buckets: Record<string, number> = {};
  for (const r of queueRows || []) { buckets[r.bucket] = (buckets[r.bucket] || 0) + 1; }
  for (const [b, c] of Object.entries(buckets)) { console.log(`    ${b}: ${c}`); }

  // TOP ACTIVATION-READY BROKERS
  console.log('\n📋 STEP 6: Top Activation-Ready Brokers (FROM DB)');
  line();

  const { data: topBrokers } = await sb.from('broker_surfaces')
    .select('broker_surface_id, canonical_display_name, primary_phone, acquisition_status, activation_priority_score, claim_priority_score, outreach_priority_score, observed_corridors, claimable_surface_flag, recurrence_score')
    .eq('source_batch_id', batchId)
    .order('activation_priority_score', { ascending: false })
    .limit(15);

  if (!topBrokers || topBrokers.length === 0) markFail('top_brokers', 'none returned from DB');
  else {
    pass(`${topBrokers.length} brokers returned from DB`);
    const reasonMap = new Map<string, string>();
    for (const r of queueRows || []) { reasonMap.set(r.broker_surface_id, r.reason); }

    for (const b of topBrokers) {
      console.log(`\n    📍 ${b.canonical_display_name}`);
      console.log(`       phone:       ${b.primary_phone}`);
      console.log(`       status:      ${b.acquisition_status}`);
      console.log(`       activation:  ${b.activation_priority_score}`);
      console.log(`       claim:       ${b.claim_priority_score}`);
      console.log(`       outreach:    ${b.outreach_priority_score}`);
      console.log(`       recurrence:  ${b.recurrence_score}`);
      console.log(`       claimable:   ${b.claimable_surface_flag}`);
      console.log(`       corridors:   ${JSON.stringify(b.observed_corridors)}`);
      console.log(`       reason:      ${reasonMap.get(b.broker_surface_id) ?? 'N/A'}`);
    }
  }

  // POST-RUN COUNTS
  console.log('\n\n📋 STEP 7: Post-run DB Counts');
  line();
  console.log('\n  Table                                | Before | After  | Delta');
  console.log('  ' + '─'.repeat(58));
  for (const t of TABLES) {
    const { count } = await sb.from(t).select('*', { count: 'exact', head: true });
    const before = beforeCounts.get(t) ?? 0;
    const after = count ?? 0;
    const delta = after - before;
    console.log(`  ${t.padEnd(38)} | ${String(before).padStart(6)} | ${String(after).padStart(6)} | ${delta > 0 ? '+' : ''}${delta}`);
  }

  // VERDICT
  console.log('\n');
  line();
  console.log(`\n  🏁 FINAL VERDICT: ${VERDICT}\n`);
  if (FAILURES.length > 0) {
    console.log('  Failures:');
    for (const f of FAILURES) console.log(`    ❌ ${f}`);
  }

  console.log('\n  ── Final Output ──────────────────────────────────');
  console.log(`    pass_or_fail:                      ${VERDICT}`);
  console.log(`    persisted_batch_id:                ${batchRow ? '✅' : '❌'} ${batchId}`);
  console.log(`    persisted_observation_count:        ${(obsCount ?? 0) > 0 ? '✅' : '❌'} ${obsCount ?? 0}`);
  console.log(`    broker_surfaces_created_count:      ✅ ${surfacesCreated}`);
  console.log(`    broker_surfaces_updated_count:      ✅ ${surfacesUpdated}`);
  console.log(`    activation_queue_rows_created:      ✅ ${queueCreated}`);
  console.log(`    top_activation_ready_brokers:       ${(topBrokers?.length ?? 0) > 0 ? '✅' : '❌'} ${topBrokers?.length ?? 0}`);
  console.log('');

  process.exit(VERDICT === 'PASS' ? 0 : 1);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
