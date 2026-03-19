/**
 * Local batch ingestion script — 2026-03-19
 * Runs both alert-line and structured-listing parsers directly,
 * bypasses HTTP + Supabase for fast local analysis.
 *
 * Usage: npx tsx scripts/ingest-batch-2026-03-19.ts
 */

import { parseLine } from '../src/lib/ingestion/load-board/parser';
import { parseStructuredListings } from '../src/lib/ingestion/load-board/structured-parser';
import { segmentBatch } from '../src/lib/ingestion/load-board/segmenter';
import { IdentityGraph, scoreEntity } from '../src/lib/ingestion/load-board/entity-resolution';
import {
  CorridorIntelligence,
  scoreCorridor,
  buildDailyVolume,
  calculateBoardVelocity,
  buildPricingSummary,
} from '../src/lib/ingestion/load-board/corridor-intelligence';
import { BrokerSurfaceBuilder } from '../src/lib/ingestion/load-board/broker-surface';
import type { ParsedObservation, ReputationSignal } from '../src/lib/ingestion/load-board/types';

// ─── Batch 1: Load Alert Lines ───────────────────────────────────
const BATCH1_ALERT_LINES = `Load Alert!! Action Pilot Car 12noon 2258883917 Charleston MO Omaha NE Chase
Load Alert!! Nvs TEXT ONLY 6084876145 Portland TX Sulphur LA Chase
Load Alert!! cmb enterprises inc 2406395496 Norfolk VA Lansing MI Chase
Load Alert!! Hudson Day Rate & QP 5712103512 Rosman NC Glenville NC Chase
Load Alert!! PAN LOGISTICS INC 2536663879 Texarkana TX Memphis TN P
Load Alert!! Johnson PCS 8505333449 Lantana FL Port Charlotte FL Chase
Load Alert!! Johnson PCS 8505333449 Lantana FL Port Charlotte FL P
Load Alert!! Hudson Transport DR & QP 5712103512 Rosman NC Glenville NC Chase
Load Alert!! Hudson Transport 5712103512 Rosman NC Glenville NC Chase
Load Alert!! Gracefull TEXT 3109102953 Wheeling WV Morgantown WV Chase
Load Alert!! J&C Specialized LLC - Joe 626-733-1366 Montgomery IN Switz City IN Chase
Load Alert!! Nick 2 cars lead and chas 7049021489 Cashiers NC Cashiers NC Chase
Load Alert!! WAYPOINT PERMITS LLC 9092757111 Fair play SC Oxon hill MD Chase
Load Alert!! WAYPOINT PERMITS LLC 9092757111 Foley AL West point GA Chase
Load Alert!! PAN LOGISTICS INC 2536663879 Tulsa OK Wichita KS Chase
Load Alert!! Ace jason 7138269727 Savannah GA Bristow OK Chase
Load Alert!! Tag and Title scam won't pay 7328967700 Bordentown NJ Chase
Load Alert!! RBS TRANSPORT LLC 2812166761 Denison TX Welch OK Chase
Load Alert!! CASH 313-690-5335 Wilmington CA Denver CO Chase
Load Alert!! BH Trans 6462048325 Friendsville MD Taneytown MD Route Survey
Load Alert!! Johnson Pilot Car ASAP QP 850-533-3449 Lantana FL Port Charlotte FL Chase
Load Alert!! Atlas Logistics Group 2537770272 Long Beach CA Las Vegas NV Chase
Load Alert!! Atlas 2532400305 Long Beach CA Las Vegas NV Chase
Load Alert!! Peakb 2406743609 Spokane WA Cheyenne WY Chase
Load Alert!! Johnson Pilot Car(ASAP) 2566471539 Lantana FL Port charlotte FL Chase
Load Alert!! Peakb. ASAP 2406743609 Spokane WA Cheyenne WY P
Load Alert!! Atlas 2532400305 Long Beach CA Laughlin NV Chase
Load Alert!! Jodi at Iowa Pilot Cars 712-574-4538 Baltimore MD Friedensburg PA Chase
Load Alert!! Project Freight 9126891230 Hopkins SC Augusta GA Chase
Load Alert!! Coastal Lights at Sunrise 8606398468 Pottsboro TX Afton OK Chase
Load Alert!! Demase (Text Only) 6014194210 Jersey City NJ Warren MI P
Load Alert!! PAN LOGISTICS INC 2536663879 Newark NJ Detroit MI Chase
3/17/2026
Load Alert!! V & M Trucking LLC 8322645223 Houston TX Calhoun GA Chase
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
Load Alert!! Whispering Hills 4029438275 Sioux City IA Fairbury NE Chase
Load Alert!! Atlas Logistics Group 2537770272 Mansfield LA Duluth MN Chase
Load Alert!! Straitline Transportation 3098013300 Ragley LA Lagrange GA Chase
Load Alert!! Midwest Pilot Cars 6056709654 Dyersburg TN Chattanooga TN Chase`;

// ─── Batch 2: Structured PilotCarLoads.com Listings ──────────────
const BATCH2_STRUCTURED = `Maks llc -  ID Verified
Recent
Open
Manassas, VA, USASterling, VA, USA
Est. 32 mi
Contact for rate
(301) 408-8220 Text Only
03/19/2026
3 minutes ago
Chase

valley transportation -  ID Verified
Recent
Open
Shiprock, NM, USAHelper, UT, USA
Est. 295 mi
Contact for rate
Quick Pay
(507) 718-8187 Text Only
03/19/2026
about 1 hour ago
Chase

Xcellent pcs Pam- -  ID Verified
Recent
Open
Monroe, MI, USAGreenwood, NY, USA
Est. 385 mi
Contact for rate
(313) 600-5172 Text Only
03/20/2026
about 2 hours ago
Steer
NY Certified

D&D Transporting -  ID Verified
Recent
Open
Great Falls, MT, USAGlendive, MT, USA
Est. 359 mi
Contact for rate
(773) 572-1769
03/19/2026
about 2 hours ago
Chase
Lead

JLS Pilot Car Services -  ID Verified
Recent
Open
Albert Lea, MN, USALamoni, IA, USA
Est. 229 mi
Contact for rate
(678) 873-5016
03/20/2026
about 3 hours ago
High Pole

JLS Pilot Car Services -  ID Verified
Recent
Open
Newark, NJ, USANew Bedford, MA, USA
Est. 247 mi
Contact for rate
(678) 873-5016
03/19/2026
about 3 hours ago
High Pole

Niels escort no show -  ID Verified
Recent
Open
Lincoln, NE, USAWalcott, IA, USA
Est. 340 mi
Contact for rate
Quick Pay
(651) 786-9582
03/19/2026
about 3 hours ago
High Pole

LinRon Pilot Cars -  ID Verified
Recent
Open
Lantana, FL, USAPort Charlotte, FL, USA
Est. 162 mi
Contact for rate
(954) 558-1942
03/19/2026
about 3 hours ago
High Pole

Swift PCS - RATE NEG -  ID Verified
Recent
Open
Harrison, NE, USAAmarillo, TX, USA
Est. 571 mi
Contact for rate
Quick Pay
(310) 210-0111 Text Only
03/20/2026
about 4 hours ago
High Pole

Starvin Marvin Pilot Service -  ID Verified
Open
Milwaukee, WI, USAState College, PA, USA
Est. 674 mi
Contact for rate
Quick Pay
(951) 264-8174 Text Only
03/20/2026
about 10 hours ago
High Pole

Angie's Pilot Car, llc -  ID Verified
Open
York, NE, USALincoln, NE, USA
Est. 53 mi
Contact for rate
(918) 638-5878
03/19/2026
about 12 hours ago
Lead

Johnson Pilot Car Service -  ID Verified
Open
Lantana, FL, USAPort Charlotte, FL, USA
Est. 162 mi
Contact for rate
(850) 533-3449
03/19/2026
about 14 hours ago
Chase
High Pole

Edgemont Pilots LLC -  ID Verified
Open
Baltimore, MD, USAMillville, NJ, USA
Est. 115 mi
Contact for rate
Quick Pay
(301) 991-4406
03/19/2026
about 15 hours ago
Chase

Chris at 2:30 pm -  ID Verified
Open
Marshall, IL, USACrane, IN, USA
Est. 86 mi
Contact for rate
Quick Pay
(417) 536-5722
03/19/2026
about 16 hours ago
Chase

patelpcs 2 HP -  ID Verified
Open
Kingsland, GA, USAPembroke Pines, FL, USA
Est. 367 mi
Contact for rate
(785) 206-0065
03/19/2026
about 16 hours ago
High Pole

MKOLA PILOT CAR -  ID Verified
Open
Port Jervis, NY, USAChelsea, MA, USA
Est. 241 mi
Contact for rate
(929) 270-3039
03/19/2026
about 18 hours ago
High Pole

KEENCO Transport, LLC -  ID Verified
Covered
McDonald, OH, USAWilburton, OK, USA
Est. 1069 mi
Contact for rate
Quick Pay
Hidden for Covered Loads
03/20/2026
about 1 hour ago
Chase

Pilot Cars & Permits -  ID Verified
Covered
Toddville, MD, USABruceton Mills, WV, USA
Est. 298 mi
Contact for rate
Quick Pay
Hidden for Covered Loads
03/19/2026
about 2 hours ago
Chase

Optimus Translog Services -  ID Verified
Covered
Brandenburg, KY, USAWaskom, TX, USA
Est. 736 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 3 hours ago
Chase

First Response ( need ASAP, RIGHT NOW NOT LATER ) -  ID Verified
Covered
Norfolk, VA, USALansing, MI, USA
Est. 761 mi
$1.70/mi
Hidden for Covered Loads
03/19/2026
about 3 hours ago
Chase

Swift PCS - No Chase Needed -  ID Verified
Covered
Ardmore, AL, USANew Salisbury, IN, USA
Est. 286 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 17 hours ago
High Pole

Swift PCS -  ID Verified
Covered
Ardmore, AL, USANew Salisbury, IN, USA
Est. 286 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 17 hours ago
Chase

GC Pilot Car Supply -  ID Verified
Covered
Childress, TX, USADenver, CO, USA
Est. 555 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 17 hours ago
High Pole

MTG PCS, one car only -  ID Verified
Covered
Middletown, DE, USAOmaha, NE, USA
Est. 1242 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 17 hours ago
Chase
Lead

Pilotcarz4u -  ID Verified
Covered
Twentynine Palms, CA, USAYuma, AZ, USA
Est. 226 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 17 hours ago
High Pole

D&D Transporting -  ID Verified
Covered
Great Falls, MT, USAGlendive, MT, USA
Est. 359 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 17 hours ago
Chase

Chris -  ID Verified
Covered
Decatur, IL, USADavenport, IA, USA
Est. 174 mi
Contact for rate
Quick Pay
Hidden for Covered Loads
03/19/2026
about 18 hours ago
Third Car

Texas Highway haulers -  ID Verified
Covered
Yuma, AZ, USAEl Centro, CA, USA
Est. 82 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 18 hours ago
Chase

valley transportation -  ID Verified
Covered
Shiprock, NM, USAHelper, UT, USA
Est. 295 mi
Contact for rate
Quick Pay
Hidden for Covered Loads
03/19/2026
about 18 hours ago
Chase

patelpcs -  ID Verified
Covered
El Paso, TX, USALordsburg, NM, USA
Est. 169 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 18 hours ago
Lead

SGS Pilot Cars (Southern Gentlemen Services, Inc.) -  ID Verified
Covered
Dallas, TX, USADallas, TX, USA
Contact for rate
Hidden for Covered Loads
03/19/2026
about 18 hours ago
High Pole

Rosebudz, LLC -- Noon -  ID Verified
Covered
Perrysburg, OH, USACelina, OH, USA
Est. 107 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 18 hours ago
Lead

SHAWQI TRANSPORTATION LLC -  ID Verified
Covered
Lafayette, LA, USAPensacola, FL, USA
Est. 313 mi
Contact for rate
Quick Pay
Hidden for Covered Loads
03/19/2026
about 18 hours ago
Chase

Jb Motor Carrier LLC -  ID Verified
Covered
Austin, TX, USAAbilene, TX, USA
Est. 205 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 18 hours ago
Chase
Lead

patelpcs -  ID Verified
Covered
El Paso, TX, USALordsburg, NM, USA
Est. 169 mi
Contact for rate
Hidden for Covered Loads
03/18/2026
about 18 hours ago
Lead

JLS Pilot Car Services -  ID Verified
Covered
De Pere, WI, USANorthlake, IL, USA
Est. 198 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 18 hours ago
Chase
High Pole

JLS Pilot Car Services -  ID Verified
Covered
Birmingham, AL, USABall Ground, GA, USA
Est. 198 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 19 hours ago
Chase

JLS Pilot Car Services -  ID Verified
Covered
Texarkana, TX, USABlytheville, AR, USA
Est. 335 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 19 hours ago
Chase

Big E's Flag/Will not respond to "available" -  ID Verified
Covered
Rockingham, NC, USAMt Juliet, TN, USA
Est. 487 mi
Contact for rate
Quick Pay
Hidden for Covered Loads
03/19/2026
about 19 hours ago
Lead

RDJ Trucking -  ID Verified
Covered
Snowville, UT, USABoise, ID, USA
Est. 243 mi
Contact for rate
Hidden for Covered Loads
03/19/2026
about 19 hours ago
Lead`;


// ─── Run Ingestion ───────────────────────────────────────────────

async function main() {
  const ingestionDate = new Date().toISOString();
  const allObservations: ParsedObservation[] = [];

  // ── Process Batch 1: Alert Lines ─────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('  BATCH 1: Load Alert Lines (56 lines)');
  console.log('═══════════════════════════════════════════════════════\n');

  const seg1 = segmentBatch(BATCH1_ALERT_LINES, null);
  let b1_parsed = 0, b1_partial = 0, b1_unparsed = 0;

  for (const seg of seg1.segments) {
    if (seg.type === 'alert_line') {
      for (const line of seg.lines) {
        if (!line.trimmed) continue;
        try {
          const obs = parseLine(line.text, {
            activeDate: seg.dateContext,
            batchDate: null,
            ingestionDate,
            sourceName: 'PilotCarLoads Alert Feed',
            sourceType: 'load_alert_board',
            countryHint: 'US',
          });
          allObservations.push(obs);
          if (obs.parse_confidence >= 0.4) b1_parsed++;
          else if (obs.parse_confidence >= 0.15) b1_partial++;
          else b1_unparsed++;
        } catch { b1_unparsed++; }
      }
    }
  }
  console.log(`  Parsed: ${b1_parsed} | Partial: ${b1_partial} | Unparsed: ${b1_unparsed}`);

  // ── Process Batch 2: Structured Listings ─────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  BATCH 2: Structured PilotCarLoads.com Listings (40 blocks)');
  console.log('═══════════════════════════════════════════════════════\n');

  const structuredObs = parseStructuredListings(BATCH2_STRUCTURED, {
    sourceName: 'PilotCarLoads.com',
    sourceType: 'load_alert_board',
    countryHint: 'US',
    ingestionDate,
  });
  for (const obs of structuredObs) {
    allObservations.push(obs);
  }
  console.log(`  Structured listings parsed: ${structuredObs.length}`);

  // ── Combine and Analyze ──────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  COMBINED ANALYSIS');
  console.log('═══════════════════════════════════════════════════════\n');

  const totalObs = allObservations.length;
  console.log(`  Total observations: ${totalObs}`);

  // Entity resolution
  const graph = new IdentityGraph('batch_local_20260319');
  for (const obs of allObservations) {
    graph.processObservation(obs);
  }
  const orgs = graph.getOrganizations();
  const phones = graph.getPhoneRecords();
  const aliases = graph.getAliases();

  // Corridor intelligence
  const corridorEngine = new CorridorIntelligence();
  for (const obs of allObservations) {
    corridorEngine.processObservation(obs);
  }
  const allCorridors = corridorEngine.getCorridors();
  const topCorridors = corridorEngine.getTopCorridors(15);

  const dailyVolume = buildDailyVolume(allObservations);
  const boardVelocity = calculateBoardVelocity(allObservations);
  const pricingSummary = buildPricingSummary(allObservations);

  // Mixes
  const serviceMix: Record<string, number> = {};
  const urgencyMix: Record<string, number> = {};
  const paymentMix: Record<string, number> = {};
  for (const obs of allObservations) {
    serviceMix[obs.service_type] = (serviceMix[obs.service_type] ?? 0) + 1;
    urgencyMix[obs.urgency] = (urgencyMix[obs.urgency] ?? 0) + 1;
    paymentMix[obs.payment_terms] = (paymentMix[obs.payment_terms] ?? 0) + 1;
  }

  // Reputation signals
  const repSignals = allObservations.filter(o => o.reputation_signal).map(o => o.reputation_signal!);

  // Entity scores
  const entityScores = orgs.map(org => ({ org, scores: scoreEntity(org) }));

  // Broker surfaces
  const surfaceBuilder = new BrokerSurfaceBuilder();
  surfaceBuilder.buildSurfaces(orgs, entityScores, allObservations);
  const brokerSummary = surfaceBuilder.getSummary();

  // Top names
  const nameCounts = new Map<string, number>();
  for (const obs of allObservations) {
    if (obs.parsed_name_or_company) {
      nameCounts.set(obs.parsed_name_or_company, (nameCounts.get(obs.parsed_name_or_company) ?? 0) + 1);
    }
  }
  const topNames = Array.from(nameCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  // Claim candidates
  const claimCandidates = entityScores
    .filter(e => e.scores.claim_priority_score >= 0.4)
    .sort((a, b) => b.scores.claim_priority_score - a.scores.claim_priority_score)
    .slice(0, 15);

  // Open vs covered (structured batch)
  const openCount = structuredObs.filter(o => o.volume_signal_weight >= 0.8).length;
  const coveredCount = structuredObs.filter(o => o.volume_signal_weight < 0.8).length;

  // ── Print Report ─────────────────────────────────────────────────
  console.log(`  Unique organizations: ${orgs.length}`);
  console.log(`  Unique phones: ${phones.length}`);
  console.log(`  Unique corridors: ${allCorridors.length}`);
  console.log(`  Alias clusters: ${aliases.length}`);
  console.log(`  Board velocity: ${(boardVelocity * 100).toFixed(0)}%`);
  console.log(`  Price observations: ${pricingSummary.total_price_observations}`);
  console.log(`  Reputation flags: ${repSignals.length}`);

  console.log('\n── Service Type Mix ──');
  Object.entries(serviceMix).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\n── Urgency Mix ──');
  Object.entries(urgencyMix).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\n── Payment Mix ──');
  Object.entries(paymentMix).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\n── Top 20 Repeat Actors ──');
  topNames.forEach(([name, count]) => console.log(`  ${count}x  ${name}`));

  console.log('\n── Top 15 Corridors ──');
  topCorridors.slice(0, 15).forEach(c => console.log(`  ${c.observation_count}x  ${c.corridor_key}  (${c.service_types_seen.join(',')})`));

  console.log('\n── Top Phones ──');
  phones.sort((a, b) => b.observation_count - a.observation_count).slice(0, 15)
    .forEach(p => console.log(`  ${p.observation_count}x  ${p.normalized_phone}  [${p.linked_names.join(', ')}]`));

  console.log('\n── Observations by Day ──');
  for (const [dk, data] of dailyVolume) {
    console.log(`  ${dk}: ${data.total} obs`);
  }

  console.log('\n── Structured Listings: Open vs Covered ──');
  console.log(`  Open: ${openCount} | Covered: ${coveredCount}`);

  console.log('\n── Reputation / Risk Signals ──');
  if (repSignals.length === 0) {
    console.log('  None in alert batch (parsed)');
  }
  for (const sig of repSignals) {
    console.log(`  ⚠️  ${sig.signal_type}: ${sig.target_name ?? 'unknown'} — "${sig.raw_text.substring(0, 80)}..."`);
  }

  console.log('\n── Claim Candidates (priority >= 0.4) ──');
  claimCandidates.forEach(c =>
    console.log(`  ${(c.scores.claim_priority_score * 100).toFixed(0)}%  ${c.org.display_name}  (${c.org.observation_count} obs, phones: ${c.org.phones.join(', ')})`)
  );

  console.log('\n── Broker Surface Summary ──');
  console.log(`  Surfaces created: ${brokerSummary.broker_surfaces_created}`);
  console.log(`  Claim ready: ${brokerSummary.claim_ready_count}`);
  console.log(`  Outreach ready: ${brokerSummary.outreach_ready_count}`);
  console.log(`  Activation ready: ${brokerSummary.activation_ready_count}`);
  console.log(`  Watchlist: ${brokerSummary.watchlist_count}`);

  if (pricingSummary.total_price_observations > 0) {
    console.log('\n── Pricing Intelligence ──');
    console.log(`  Total price observations: ${pricingSummary.total_price_observations}`);
    if (pricingSummary.avg_quoted_amount) console.log(`  Avg quoted: $${pricingSummary.avg_quoted_amount.toFixed(0)}`);
    if (pricingSummary.avg_pay_per_mile) console.log(`  Avg pay/mile: $${pricingSummary.avg_pay_per_mile.toFixed(2)}`);
    pricingSummary.price_by_corridor.forEach(c =>
      console.log(`  ${c.corridor}: $${c.avg_price.toFixed(0)} avg (${c.count} obs)`)
    );
  }

  // ── Output JSON for artifact ─────────────────────────────────────
  const outputPath = process.argv[2] || '';
  if (outputPath) {
    const fs = await import('fs');
    const output = {
      batch_date: '2026-03-19',
      total_observations: totalObs,
      batch1_alert_lines: { parsed: b1_parsed, partial: b1_partial, unparsed: b1_unparsed },
      batch2_structured_listings: { total: structuredObs.length, open: openCount, covered: coveredCount },
      unique_organizations: orgs.length,
      unique_phones: phones.length,
      unique_corridors: allCorridors.length,
      board_velocity: boardVelocity,
      service_mix: serviceMix,
      urgency_mix: urgencyMix,
      payment_mix: paymentMix,
      top_actors: topNames.map(([n, c]) => ({ name: n, count: c })),
      top_corridors: topCorridors.map(c => ({ corridor: c.corridor_key, count: c.observation_count, services: c.service_types_seen })),
      top_phones: phones.sort((a, b) => b.observation_count - a.observation_count).slice(0, 15).map(p => ({
        phone: p.normalized_phone, count: p.observation_count, names: p.linked_names,
      })),
      claim_candidates: claimCandidates.map(c => ({
        name: c.org.display_name, score: c.scores.claim_priority_score, obs: c.org.observation_count, phones: c.org.phones,
      })),
      pricing_summary: pricingSummary,
      reputation_signals: repSignals,
      observations_by_day: Object.fromEntries(dailyVolume),
      broker_surface_summary: brokerSummary,
    };
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n✅ JSON output written to: ${outputPath}`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✅ INGESTION COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
