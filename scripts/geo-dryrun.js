/**
 * HAUL COMMAND — Geo Expansion v2 Dry Run Calculator
 * Standalone JS — no TS compilation needed
 * 
 * Model: 200K+ operators with proportional support entities (brokers)
 * Broker ratio: ~1 broker per 500 operators × 1.5 float = 600 brokers for 200K
 */

// ═══════════════════════════════════════════════════════════════
// KEYWORD COUNTS (from keywords.ts)
// ═══════════════════════════════════════════════════════════════

const KEYWORD_COUNTS = {
  en: 46,    // KEYWORDS_EN
  gb: 50,    // KEYWORDS_GB (includes EN + UK-specific)
  za: 51,    // KEYWORDS_ZA
  in: 52,    // KEYWORDS_IN  
  es: 17,
  pt: 13,
  de: 13,
  fr: 12,
  nl: 10,
  ar: 8,
  it: 8,
  tr: 6,
  pl: 6,
  ja: 5,
  ko: 5,
};

const BROKER_KEYWORD_COUNTS = {
  en: 24,
  es: 8,
  pt: 6,
  de: 6,
  fr: 6,
  ar: 5,
};

// ═══════════════════════════════════════════════════════════════
// COUNTRY DATABASE (from cities-tier-*.ts)
// ═══════════════════════════════════════════════════════════════

const COUNTRIES = [
  // TIER A — Gold (10)
  { code: 'US', tier: 'A', cities: 222, corridors: 31, borders: 10, lang: 'en', name: 'United States' },
  { code: 'CA', tier: 'A', cities: 46, corridors: 8, borders: 5, lang: 'en', name: 'Canada' },
  { code: 'AU', tier: 'A', cities: 34, corridors: 9, borders: 0, lang: 'en', name: 'Australia' },
  { code: 'GB', tier: 'A', cities: 30, corridors: 9, borders: 0, lang: 'gb', name: 'United Kingdom' },
  { code: 'NZ', tier: 'A', cities: 16, corridors: 3, borders: 0, lang: 'en', name: 'New Zealand' },
  { code: 'ZA', tier: 'A', cities: 20, corridors: 7, borders: 5, lang: 'za', name: 'South Africa' },
  { code: 'DE', tier: 'A', cities: 24, corridors: 7, borders: 5, lang: 'de', name: 'Germany' },
  { code: 'NL', tier: 'A', cities: 13, corridors: 6, borders: 3, lang: 'nl', name: 'Netherlands' },
  { code: 'AE', tier: 'A', cities: 11, corridors: 4, borders: 3, lang: 'en', name: 'UAE' },
  { code: 'BR', tier: 'A', cities: 30, corridors: 6, borders: 4, lang: 'pt', name: 'Brazil' },
  // TIER B — Blue (18)
  { code: 'IE', tier: 'B', cities: 10, corridors: 4, borders: 2, lang: 'en', name: 'Ireland' },
  { code: 'SE', tier: 'B', cities: 12, corridors: 4, borders: 2, lang: 'en', name: 'Sweden' },
  { code: 'NO', tier: 'B', cities: 12, corridors: 4, borders: 2, lang: 'en', name: 'Norway' },
  { code: 'DK', tier: 'B', cities: 11, corridors: 4, borders: 2, lang: 'en', name: 'Denmark' },
  { code: 'FI', tier: 'B', cities: 12, corridors: 3, borders: 3, lang: 'en', name: 'Finland' },
  { code: 'BE', tier: 'B', cities: 12, corridors: 5, borders: 2, lang: 'nl', name: 'Belgium' },
  { code: 'AT', tier: 'B', cities: 10, corridors: 4, borders: 3, lang: 'de', name: 'Austria' },
  { code: 'CH', tier: 'B', cities: 10, corridors: 4, borders: 3, lang: 'de', name: 'Switzerland' },
  { code: 'ES', tier: 'B', cities: 19, corridors: 5, borders: 3, lang: 'es', name: 'Spain' },
  { code: 'FR', tier: 'B', cities: 21, corridors: 6, borders: 4, lang: 'fr', name: 'France' },
  { code: 'IT', tier: 'B', cities: 19, corridors: 5, borders: 4, lang: 'it', name: 'Italy' },
  { code: 'PT', tier: 'B', cities: 11, corridors: 4, borders: 3, lang: 'pt', name: 'Portugal' },
  { code: 'SA', tier: 'B', cities: 14, corridors: 4, borders: 2, lang: 'en', name: 'Saudi Arabia' },
  { code: 'QA', tier: 'B', cities: 8, corridors: 3, borders: 1, lang: 'en', name: 'Qatar' },
  { code: 'MX', tier: 'B', cities: 21, corridors: 4, borders: 6, lang: 'es', name: 'Mexico' },
  { code: 'IN', tier: 'B', cities: 27, corridors: 6, borders: 3, lang: 'in', name: 'India' },
  { code: 'ID', tier: 'B', cities: 14, corridors: 3, borders: 0, lang: 'en', name: 'Indonesia' },
  { code: 'TH', tier: 'B', cities: 12, corridors: 3, borders: 4, lang: 'en', name: 'Thailand' },
  // TIER C — Silver (26)
  { code: 'PL', tier: 'C', cities: 12, corridors: 4, borders: 3, lang: 'pl', name: 'Poland' },
  { code: 'CZ', tier: 'C', cities: 8, corridors: 3, borders: 2, lang: 'en', name: 'Czech Republic' },
  { code: 'SK', tier: 'C', cities: 7, corridors: 2, borders: 2, lang: 'en', name: 'Slovakia' },
  { code: 'HU', tier: 'C', cities: 9, corridors: 4, borders: 3, lang: 'en', name: 'Hungary' },
  { code: 'SI', tier: 'C', cities: 6, corridors: 3, borders: 2, lang: 'en', name: 'Slovenia' },
  { code: 'EE', tier: 'C', cities: 6, corridors: 2, borders: 2, lang: 'en', name: 'Estonia' },
  { code: 'LV', tier: 'C', cities: 6, corridors: 3, borders: 2, lang: 'en', name: 'Latvia' },
  { code: 'LT', tier: 'C', cities: 6, corridors: 3, borders: 2, lang: 'en', name: 'Lithuania' },
  { code: 'HR', tier: 'C', cities: 7, corridors: 3, borders: 2, lang: 'en', name: 'Croatia' },
  { code: 'RO', tier: 'C', cities: 10, corridors: 4, borders: 3, lang: 'en', name: 'Romania' },
  { code: 'BG', tier: 'C', cities: 7, corridors: 3, borders: 3, lang: 'en', name: 'Bulgaria' },
  { code: 'GR', tier: 'C', cities: 8, corridors: 3, borders: 3, lang: 'en', name: 'Greece' },
  { code: 'TR', tier: 'C', cities: 15, corridors: 5, borders: 4, lang: 'tr', name: 'Turkey' },
  { code: 'KW', tier: 'C', cities: 5, corridors: 1, borders: 1, lang: 'en', name: 'Kuwait' },
  { code: 'OM', tier: 'C', cities: 6, corridors: 3, borders: 2, lang: 'en', name: 'Oman' },
  { code: 'BH', tier: 'C', cities: 7, corridors: 1, borders: 1, lang: 'en', name: 'Bahrain' },
  { code: 'SG', tier: 'C', cities: 6, corridors: 2, borders: 2, lang: 'en', name: 'Singapore' },
  { code: 'MY', tier: 'C', cities: 11, corridors: 3, borders: 2, lang: 'en', name: 'Malaysia' },
  { code: 'JP', tier: 'C', cities: 15, corridors: 4, borders: 0, lang: 'ja', name: 'Japan' },
  { code: 'KR', tier: 'C', cities: 12, corridors: 3, borders: 0, lang: 'ko', name: 'South Korea' },
  { code: 'CL', tier: 'C', cities: 12, corridors: 3, borders: 2, lang: 'es', name: 'Chile' },
  { code: 'AR', tier: 'C', cities: 14, corridors: 5, borders: 3, lang: 'es', name: 'Argentina' },
  { code: 'CO', tier: 'C', cities: 11, corridors: 3, borders: 2, lang: 'es', name: 'Colombia' },
  { code: 'PE', tier: 'C', cities: 12, corridors: 4, borders: 3, lang: 'es', name: 'Peru' },
  { code: 'VN', tier: 'C', cities: 11, corridors: 3, borders: 3, lang: 'en', name: 'Vietnam' },
  { code: 'PH', tier: 'C', cities: 11, corridors: 3, borders: 0, lang: 'en', name: 'Philippines' },
  // TIER D — Slate (3)
  { code: 'UY', tier: 'D', cities: 8, corridors: 3, borders: 3, lang: 'es', name: 'Uruguay' },
  { code: 'PA', tier: 'D', cities: 7, corridors: 3, borders: 2, lang: 'es', name: 'Panama' },
  { code: 'CR', tier: 'D', cities: 8, corridors: 3, borders: 3, lang: 'es', name: 'Costa Rica' },
];

// ═══════════════════════════════════════════════════════════════
// QUERY CALCULATION
// ═══════════════════════════════════════════════════════════════

// Yield rates by tier
const YIELD = {
  A: { resultsPerQuery: 10, dedupeRate: 0.30 },
  B: { resultsPerQuery: 8,  dedupeRate: 0.35 },
  C: { resultsPerQuery: 6,  dedupeRate: 0.40 },
  D: { resultsPerQuery: 5,  dedupeRate: 0.45 },
};

const COST_PER_QUERY = 0.017;

// Broker support ratio: 1 broker per 400 operators × 1.5 float
const BROKER_RATIO = 1 / 400;
const BROKER_FLOAT = 1.5;

function getKeywordCount(lang) {
  return KEYWORD_COUNTS[lang] || KEYWORD_COUNTS['en'];
}

function getBrokerKeywordCount(lang) {
  // Map language to broker keyword language
  const brokerLang = ['en','es','pt','de','fr','ar'].includes(lang) ? lang : 'en';
  return BROKER_KEYWORD_COUNTS[brokerLang] || BROKER_KEYWORD_COUNTS['en'];
}

function calculate() {
  const results = [];
  let totalOperatorQueries = 0;
  let totalBrokerQueries = 0;
  let totalEstOperators = 0;
  let totalEstBrokers = 0;
  let totalCost = 0;

  const tierSummary = { A: { q: 0, op: 0, br: 0, cost: 0, countries: 0 }, B: { q: 0, op: 0, br: 0, cost: 0, countries: 0 }, C: { q: 0, op: 0, br: 0, cost: 0, countries: 0 }, D: { q: 0, op: 0, br: 0, cost: 0, countries: 0 } };

  for (const c of COUNTRIES) {
    const kwCount = getKeywordCount(c.lang);
    const brokerKwCount = getBrokerKeywordCount(c.lang);
    const y = YIELD[c.tier];
    const netYield = y.resultsPerQuery * (1 - y.dedupeRate);

    // Operator queries: cities × ALL keywords + corridors × 10 kw + borders × 5 kw
    const opCityQ = c.cities * kwCount;
    const opCorridorQ = c.corridors * Math.min(10, kwCount);
    const opBorderQ = c.borders * Math.min(5, kwCount);
    const operatorQueries = opCityQ + opCorridorQ + opBorderQ;

    // Broker queries: cities × broker keywords + corridors × 5 broker kw
    const brCityQ = c.cities * brokerKwCount;
    const brCorridorQ = c.corridors * Math.min(5, brokerKwCount);
    const brokerQueries = brCityQ + brCorridorQ;

    const totalQ = operatorQueries + brokerQueries;
    const estOps = Math.round(operatorQueries * netYield);
    const estBrokers = Math.round(brokerQueries * netYield);
    const cost = Math.round(totalQ * COST_PER_QUERY * 100) / 100;

    // How many brokers do we actually NEED for this operator count?
    const brokersNeeded = Math.ceil(estOps * BROKER_RATIO * BROKER_FLOAT);

    results.push({ ...c, operatorQueries, brokerQueries, totalQ, estOps, estBrokers, brokersNeeded, cost });

    totalOperatorQueries += operatorQueries;
    totalBrokerQueries += brokerQueries;
    totalEstOperators += estOps;
    totalEstBrokers += estBrokers;
    totalCost += cost;

    tierSummary[c.tier].q += totalQ;
    tierSummary[c.tier].op += estOps;
    tierSummary[c.tier].br += estBrokers;
    tierSummary[c.tier].cost += cost;
    tierSummary[c.tier].countries++;
  }

  // ═══════════════════════════════════════════════════════════
  // PRINT REPORT
  // ═══════════════════════════════════════════════════════════

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  HAUL COMMAND — GEO EXPANSION v2 DRY RUN');
  console.log('  Target: 200K+ operators + proportional brokers (57 countries)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('📊 GLOBAL TOTALS:');
  console.log(`   Countries:           57`);
  console.log(`   Total queries:       ${(totalOperatorQueries + totalBrokerQueries).toLocaleString()}`);
  console.log(`     ├─ Operator queries: ${totalOperatorQueries.toLocaleString()}`);
  console.log(`     └─ Broker queries:   ${totalBrokerQueries.toLocaleString()}`);
  console.log(`   Est. operators:      ${totalEstOperators.toLocaleString()}`);
  console.log(`   Est. brokers:        ${totalEstBrokers.toLocaleString()}`);
  console.log(`   Est. total entities: ${(totalEstOperators + totalEstBrokers).toLocaleString()}`);
  console.log(`   Brokers needed:      ${Math.ceil(totalEstOperators * BROKER_RATIO * BROKER_FLOAT).toLocaleString()} (1:400 ratio × 1.5 float)`);
  console.log(`   Est. API cost:       $${totalCost.toFixed(2)}`);
  console.log('');

  console.log('📈 BY TIER:');
  const tierNames = { A: 'Gold', B: 'Blue', C: 'Silver', D: 'Slate' };
  for (const [tier, data] of Object.entries(tierSummary)) {
    console.log(`   Tier ${tier} (${tierNames[tier]}, ${data.countries} countries): ${data.op.toLocaleString()} operators + ${data.br.toLocaleString()} brokers — $${data.cost.toFixed(2)}`);
  }
  console.log('');

  console.log('🌍 ALL 57 COUNTRIES (sorted by operator yield):');
  console.log('   ┌────────┬──────┬──────────┬────────────┬────────────┬──────────┐');
  console.log('   │ Code   │ Tier │ Cities   │ Op Queries │ Est. Ops   │ Cost     │');
  console.log('   ├────────┼──────┼──────────┼────────────┼────────────┼──────────┤');
  
  results.sort((a, b) => b.estOps - a.estOps);
  for (const r of results) {
    const code = r.code.padEnd(6);
    const tier = r.tier;
    const cities = String(r.cities).padStart(6);
    const opQ = r.operatorQueries.toLocaleString().padStart(10);
    const ops = r.estOps.toLocaleString().padStart(10);
    const cost = ('$' + r.cost.toFixed(2)).padStart(8);
    console.log(`   │ ${code} │  ${tier}   │ ${cities}   │ ${opQ} │ ${ops} │ ${cost} │`);
  }
  console.log('   └────────┴──────┴──────────┴────────────┴────────────┴──────────┘');
  console.log('');

  // 10x opportunities
  console.log('🚀 10X DENSITY OPPORTUNITIES:');
  console.log('   ┌─ US: Add state-level queries ("Texas oversize load escort") = +50 × 46 = +2,300 queries');
  console.log('   ├─ US: Add county-level for top energy states (TX, ND, PA, WY, OK) = +500 queries');  
  console.log('   ├─ US: Add "near me" + zip code combinations for top 100 metros = +4,600 queries');
  console.log('   ├─ ALL: Add Google Maps "type:business" queries = 2× operator yield');
  console.log('   ├─ ALL: Add Bing Places + Apple Maps cross-search = 1.5× coverage');
  console.log('   ├─ ALL: Add LinkedIn company search for fleet operators = +30K entities');
  console.log('   ├─ ALL: Add industry directory scraping (BigRentz, HeavyHaulNet) = +15K entities');
  console.log('   └─ ALL: Add DOT/FMCSA database cross-reference (US) = +40K verified carriers');
  console.log('');

  // ═══════════════════════════════════════════════════════════
  // ALL 8 POSITIONS — PROPORTIONAL SUPPORT MODEL
  // ═══════════════════════════════════════════════════════════

  const POSITIONS = [
    { code: 'pevo_lead_chase', name: 'Pilot Car / Escort (Lead & Chase)', ratio: 1, target: 200000, kwCount: 46, float: 1.0 },
    { code: 'flagger', name: 'Flagger / Traffic Control', ratio: 0.125, target: 37500, kwCount: 13, float: 1.5 },
    { code: 'height_pole', name: 'Height Pole & Specialized Escort', ratio: 0.10, target: 30000, kwCount: 11, float: 1.5 },
    { code: 'witpac', name: 'WITPAC / Interstate Pilot Car', ratio: 0.05, target: 15000, kwCount: 8, float: 1.5 },
    { code: 'bucket_truck', name: 'Bucket Truck (Utility/Line Lift)', ratio: 0.04, target: 12000, kwCount: 10, float: 1.5 },
    { code: 'route_survey', name: 'Route Survey (Engineering)', ratio: 0.02, target: 6000, kwCount: 10, float: 1.5 },
    { code: 'tcs', name: 'Traffic Control Supervisor (TCS)', ratio: 0.02, target: 6000, kwCount: 12, float: 1.5 },
    { code: 'permit_filer', name: 'Permit Service / Expediter', ratio: 0.025, target: 5000, kwCount: 8, float: 1.5 },
    { code: 'police_escort', name: 'Police Escort (State + Local)', ratio: 0.01, target: 6000, kwCount: 10, float: 1.5 },
    { code: 'drone_survey', name: 'Drone Aerial Surveying', ratio: 0.01, target: 2000, kwCount: 8, float: 1.5 },
    { code: 'steerman', name: 'Steerman / Rear Escort', ratio: 0.005, target: 1500, kwCount: 11, float: 1.5 },
    { code: 'broker', name: 'Freight Broker / Dispatcher', ratio: 0.0025, target: 750, kwCount: 24, float: 1.5 },
    { code: 'av_support', name: 'Autonomous Freight Escort', ratio: 0.0016, target: 333, kwCount: 6, float: 1.5 },
  ];

  // Support positions query Tier A + Tier B countries only (28 countries)
  const supportCountries = COUNTRIES.filter(c => c.tier === 'A' || c.tier === 'B');
  const supportCityCount = supportCountries.reduce((s, c) => s + c.cities, 0);

  console.log('🎯 ALL 13 POSITIONS — PROPORTIONAL SUPPORT MODEL:');
  console.log('   (Support positions query Tier A+B countries only = 28 countries, ' + supportCityCount + ' cities)');
  console.log('   Sources: Rate Guides + DB Schema + ESC.org Certification Catalog');
  console.log('');
  console.log('   ┌─────────────────────────────────────────┬────────┬─────────┬──────────┬──────────┬──────────┐');
  console.log('   │ Position                                │ Ratio  │ Target  │ Queries  │ Est.Yield│ Cost     │');
  console.log('   ├─────────────────────────────────────────┼────────┼─────────┼──────────┼──────────┼──────────┤');

  let grandTotalQueries = totalOperatorQueries; // drivers already counted
  let grandTotalEntities = totalEstOperators;
  let grandTotalCost = totalCost;

  // Drivers row (already computed)
  const driverRow = POSITIONS[0];
  console.log(`   │ ${'★ ' + driverRow.name.padEnd(37)} │ ${String('1:1').padStart(6)} │ ${driverRow.target.toLocaleString().padStart(7)} │ ${totalOperatorQueries.toLocaleString().padStart(8)} │ ${totalEstOperators.toLocaleString().padStart(8)} │ ${'$' + (totalOperatorQueries * COST_PER_QUERY).toFixed(2).padStart(7)} │`);

  // Support positions
  for (const pos of POSITIONS.slice(1)) {
    const posQueries = supportCityCount * pos.kwCount;
    const avgYield = 7 * 0.67; // avg of Tier A+B yield
    const estEntities = Math.round(posQueries * avgYield);
    const posCost = Math.round(posQueries * COST_PER_QUERY * 100) / 100;
    const ratioStr = pos.ratio >= 0.01 ? `1:${Math.round(1/pos.ratio)}` : `1:${Math.round(1/pos.ratio)}`;

    grandTotalQueries += posQueries;
    grandTotalEntities += estEntities;
    grandTotalCost += posCost;

    console.log(`   │ ${'  ' + pos.name.padEnd(37)} │ ${ratioStr.padStart(6)} │ ${pos.target.toLocaleString().padStart(7)} │ ${posQueries.toLocaleString().padStart(8)} │ ${estEntities.toLocaleString().padStart(8)} │ ${'$' + posCost.toFixed(2).padStart(7)} │`);
  }

  console.log('   ├─────────────────────────────────────────┼────────┼─────────┼──────────┼──────────┼──────────┤');
  console.log(`   │ ${'GRAND TOTAL (all 13 positions)'.padEnd(39)} │ ${''.padStart(6)} │ ${'323.1K'.padStart(7)} │ ${grandTotalQueries.toLocaleString().padStart(8)} │ ${grandTotalEntities.toLocaleString().padStart(8)} │ ${'$' + grandTotalCost.toFixed(2).padStart(7)} │`);
  console.log('   └─────────────────────────────────────────┴────────┴─────────┴──────────┴──────────┴──────────┘');
  console.log('');

  // Texas density boost
  console.log('🔥 TEXAS & COMPETITIVE MARKET DENSITY:');
  const us = results.find(r => r.code === 'US');
  console.log(`   US: ${us.cities} cities × ${getKeywordCount('en')} keywords = ${us.operatorQueries.toLocaleString()} driver queries`);
  console.log(`   TX alone: 23 cities × 46 kw = 1,058 queries → ~7,406 operators (highest density state)`);
  console.log(`   + County-level TX: Permian Basin (15 counties) × 46 kw = +690 queries → +4,830 ops`);
  console.log(`   + Wind corridor OK/TX/IA: 30 cities × 46 kw = +1,380 queries → +9,660 ops`);
  console.log('');
}

calculate();

