/**
 * WLS Regulation Crawler — WideLoadShipping.com → Haul Command Ingestion
 * 
 * Extracts structured regulation data from all 50 US state pages + Canadian provinces:
 *   - Max dimensions (length, width, height, weight)
 *   - Permit costs per type
 *   - Travel time restrictions
 *   - Signage/marking requirements
 *   - Superload thresholds
 *   - Escort/pilot car requirements per state
 * 
 * Also extracts pilot car certification data from the certifications page.
 * 
 * Usage:
 *   node scripts/wls_regulation_crawler.mjs                   # All 50 states
 *   node scripts/wls_regulation_crawler.mjs --state texas     # Single state
 *   node scripts/wls_regulation_crawler.mjs --certs           # Certification data only
 *   node scripts/wls_regulation_crawler.mjs --dry-run         # Don't write to Supabase
 * 
 * Output: Structured JSON + Supabase upsert to hc_jurisdiction_regulations
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// ─── Configuration ────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');
const CERTS_ONLY = process.argv.includes('--certs');
const SINGLE_STATE = process.argv.includes('--state')
  ? process.argv[process.argv.indexOf('--state') + 1]
  : null;

const RATE_LIMIT_MS = 1500; // 1.5 seconds between requests — respectful
const MAX_RETRIES = 3;

const BASE = 'https://wideloadshipping.com';

// ─── All 50 US states with WLS URL slugs ──────────────────────────
const US_STATES = [
  { code: 'AL', name: 'Alabama', slug: 'alabama-state-shipping-regulations' },
  { code: 'AK', name: 'Alaska', slug: 'alaska-shipping-regulations' },
  { code: 'AZ', name: 'Arizona', slug: 'arizona-state-shipping-regulations' },
  { code: 'AR', name: 'Arkansas', slug: 'arkansas-state-shipping-regulations' },
  { code: 'CA', name: 'California', slug: 'california-state-shipping-regulations' },
  { code: 'CO', name: 'Colorado', slug: 'colorado-state-shipping-regulations' },
  { code: 'CT', name: 'Connecticut', slug: 'connecticut-state-shipping-regulations' },
  { code: 'DE', name: 'Delaware', slug: 'delaware-state-shipping-regulations' },
  { code: 'FL', name: 'Florida', slug: 'florida-state-shipping-regulations' },
  { code: 'GA', name: 'Georgia', slug: 'georgia-state-shipping-regulations' },
  { code: 'HI', name: 'Hawaii', slug: 'hawaii-state-shipping-regulations' },
  { code: 'ID', name: 'Idaho', slug: 'idaho-state-shipping-regulations' },
  { code: 'IL', name: 'Illinois', slug: 'illinois-state-shipping-regulations' },
  { code: 'IN', name: 'Indiana', slug: 'indiana-state-shipping-regulations' },
  { code: 'IA', name: 'Iowa', slug: 'iowa-state-shipping-regulations' },
  { code: 'KS', name: 'Kansas', slug: 'kansas-state-shipping-regulations' },
  { code: 'KY', name: 'Kentucky', slug: 'kentucky-state-shipping-regulations' },
  { code: 'LA', name: 'Louisiana', slug: 'louisiana-state-shipping-regulations' },
  { code: 'ME', name: 'Maine', slug: 'maine-state-shipping-regulations' },
  { code: 'MD', name: 'Maryland', slug: 'maryland-state-shipping-regulations' },
  { code: 'MA', name: 'Massachusetts', slug: 'massachusetts-state-shipping-regulations' },
  { code: 'MI', name: 'Michigan', slug: 'michigan-state-shipping-regulations' },
  { code: 'MN', name: 'Minnesota', slug: 'minnesota-state-shipping-regulations' },
  { code: 'MS', name: 'Mississippi', slug: 'mississippi-state-shipping-regulations' },
  { code: 'MO', name: 'Missouri', slug: 'missouri-state-shipping-regulations' },
  { code: 'MT', name: 'Montana', slug: 'montana-state-shipping-regulations' },
  { code: 'NE', name: 'Nebraska', slug: 'nebraska-state-shipping-regulations' },
  { code: 'NV', name: 'Nevada', slug: 'nevada-state-shipping-regulations' },
  { code: 'NH', name: 'New Hampshire', slug: 'new-hampshire-state-shipping-regulations' },
  { code: 'NJ', name: 'New Jersey', slug: 'new-jersey-state-shipping-regulations' },
  { code: 'NM', name: 'New Mexico', slug: 'new-mexico-state-shipping-regulations' },
  { code: 'NY', name: 'New York', slug: 'new-york-state-shipping-regulations' },
  { code: 'NC', name: 'North Carolina', slug: 'north-carolina-state-shipping-regulations' },
  { code: 'ND', name: 'North Dakota', slug: 'north-dakota-state-shipping-regulations' },
  { code: 'OH', name: 'Ohio', slug: 'ohio-state-shipping-regulations' },
  { code: 'OK', name: 'Oklahoma', slug: 'oklahoma-state-shipping-regulations' },
  { code: 'OR', name: 'Oregon', slug: 'oregon-state-shipping-regulations' },
  { code: 'PA', name: 'Pennsylvania', slug: 'pennsylvania-state-shipping-regulations' },
  { code: 'RI', name: 'Rhode Island', slug: 'rhode-island-state-shipping-regulations' },
  { code: 'SC', name: 'South Carolina', slug: 'south-carolina-state-shipping-regulations' },
  { code: 'SD', name: 'South Dakota', slug: 'south-dakota-state-shipping-regulations' },
  { code: 'TN', name: 'Tennessee', slug: 'tennessee-state-shipping-regulations' },
  { code: 'TX', name: 'Texas', slug: 'texas-state-shipping-regulations' },
  { code: 'UT', name: 'Utah', slug: 'utah-state-shipping-regulations' },
  { code: 'VT', name: 'Vermont', slug: 'vermont-state-shipping-regulations' },
  { code: 'VA', name: 'Virginia', slug: 'virginia-state-shipping-regulations' },
  { code: 'WA', name: 'Washington', slug: 'washington-state-shipping-regulations' },
  { code: 'WV', name: 'West Virginia', slug: 'west-virginia-state-shipping-regulations' },
  { code: 'WI', name: 'Wisconsin', slug: 'wisconsin-state-shipping-regulations' },
  { code: 'WY', name: 'Wyoming', slug: 'wyoming-state-shipping-regulations' },
];

// Canadian provinces with WLS pages
const CA_PROVINCES = [
  { code: 'AB', name: 'Alberta', slug: 'alberta-shipping-regulations' },
  { code: 'BC', name: 'British Columbia', slug: 'british-columbia-shipping-regulations' },
  { code: 'ON', name: 'Ontario', slug: 'ontario-shipping-regulations' },
  { code: 'SK', name: 'Saskatchewan', slug: 'saskatchewan-shipping-regulations' },
  { code: 'YT', name: 'Yukon', slug: 'yukon-shipping-regulations' },
];

// ─── Fetch with retry ──────────────────────────────────────────────
async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'HaulCommand-AuditBot/1.0 (+https://haulcommand.com)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      if (!res.ok) {
        console.warn(`  ⚠ HTTP ${res.status} for ${url} (attempt ${i + 1})`);
        if (res.status === 404) return null;
        continue;
      }
      return await res.text();
    } catch (err) {
      console.warn(`  ⚠ Fetch error for ${url} (attempt ${i + 1}): ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 2000 * (i + 1)));
  }
  return null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Parse dimension values ────────────────────────────────────────
function parseFeet(text) {
  if (!text) return null;
  // "8' 6 feet" or "8'6 feet" → 8 feet 6 inches = 8.5 feet
  const ftInFeetMatch = text.match(/(\d+)['''\u2019]\s*(\d+)\s*(?:feet|foot|ft)/i);
  if (ftInFeetMatch) return parseFloat(ftInFeetMatch[1]) + parseFloat(ftInFeetMatch[2]) / 12;
  
  // "8'6" or "8'6\"" → 8 feet 6 inches
  const ftInMatch = text.match(/(\d+)['''\u2019](\d+)/);
  if (ftInMatch) return parseFloat(ftInMatch[1]) + parseFloat(ftInMatch[2]) / 12;
  
  // "65 feet" or "14 feet" or "13.5 feet"
  const ftMatch = text.match(/([\d,.]+)\s*(?:feet|foot|ft)/i);
  if (ftMatch) return parseFloat(ftMatch[1].replace(',', ''));
  
  // "102 inches" → convert to feet
  const inchMatch = text.match(/([\d,.]+)\s*(?:inches|inch|in|″|")/i);
  if (inchMatch) return parseFloat(inchMatch[1].replace(',', '')) / 12;
  
  const numMatch = text.match(/([\d,.]+)/);
  if (numMatch) return parseFloat(numMatch[1].replace(',', ''));
  return null;
}

function parsePounds(text) {
  if (!text) return null;
  const match = text.match(/([\d,]+)\s*(?:pounds|lbs?|GVW)/i);
  if (match) return parseInt(match[1].replace(/,/g, ''));
  const numMatch = text.match(/([\d,]+)/);
  if (numMatch) return parseInt(numMatch[1].replace(/,/g, ''));
  return null;
}

function parseDollars(text) {
  if (!text) return null;
  const match = text.match(/\$?([\d,]+(?:\.\d{2})?)/);
  if (match) return parseFloat(match[1].replace(/,/g, ''));
  return null;
}

// ─── Parse a state regulation page ─────────────────────────────────
function parseRegulationPage(html, stateInfo, countryCode) {
  const result = {
    country_code: countryCode,
    admin1_code: stateInfo.code,
    admin1_name: stateInfo.name,
    max_length_ft: null,
    max_width_ft: null,
    max_height_ft: null,
    max_weight_lbs: null,
    max_overhang_rear_ft: null,
    max_overhang_front_ft: null,
    superload_threshold_lbs: null,
    superload_threshold_width_ft: null,
    superload_threshold_height_ft: null,
    superload_threshold_length_ft: null,
    permit_costs: [],
    travel_restrictions: [],
    signage_requirements: {},
    escort_requirements: {},
    raw_text: '',
    source: 'wls',
    source_url: `${BASE}/${stateInfo.slug}/`,
    confidence_score: 0.7,
    last_verified_at: new Date().toISOString(),
  };

  // Strip script/style tags FIRST, then all remaining tags
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
  
  // Isolate content body: remove everything before the first <h2> (skips nav)
  const bodyStart = cleaned.search(/<h2[^>]*>/i);
  const bodyHtml = bodyStart > -1 ? cleaned.substring(bodyStart) : cleaned;
  
  const text = bodyHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")   // right single quote → apostrophe
    .replace(/&#8216;/g, "'")   // left single quote → apostrophe 
    .replace(/&#8242;/g, "'")   // prime → apostrophe
    .replace(/&#8243;/g, '"')   // double prime → quote
    .replace(/&#8220;/g, '"')   // left double quote
    .replace(/&#8221;/g, '"')   // right double quote
    .replace(/\u2019/g, "'")    // unicode right single quote
    .replace(/\u2018/g, "'")    // unicode left single quote
    .replace(/\u2032/g, "'")    // unicode prime
    .replace(/\u2033/g, '"')    // unicode double prime
    .replace(/&#8243;/g, '"')
    .replace(/&#8242;/g, "'")
    .replace(/&#x2032;/g, "'")
    .replace(/&#x2019;/g, "'")
    .replace(/&#x2018;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
  result.raw_text = text.substring(0, 5000); // first 5k chars of clean content

  // ── Max dimensions ──
  // Patterns: "Length: 65 feet" / "- Length: 65 feet" / "Width: 8'6 feet" / "Height: 14 feet"
  // Also handles "8'6" style notation and "80,000 pounds gross vehicle weight (GVW)"
  const lengthMatch = text.match(/(?:[-–•]\s*)?Length[:\s]+([\d',.\s]+(?:feet|foot|ft))/i);
  if (lengthMatch) result.max_length_ft = parseFeet(lengthMatch[1]);

  const widthMatch = text.match(/(?:[-–•]\s*)?Width[:\s]+([\d',.\s"]+(?:feet|foot|ft|inches|"|\u2033))/i);
  if (widthMatch) {
    result.max_width_ft = parseFeet(widthMatch[1]);
  }
  // Fallback: "8'6" pattern without a unit word after it (common in WLS)
  if (!result.max_width_ft) {
    const widthAlt = text.match(/Width[:\s]+(\d+)['''](\d+)/i);
    if (widthAlt) result.max_width_ft = parseFloat(widthAlt[1]) + parseFloat(widthAlt[2]) / 12;
  }

  const heightMatch = text.match(/(?:[-–•]\s*)?Height[:\s]+([\d',.\s]+(?:feet|foot|ft))/i);
  if (heightMatch) result.max_height_ft = parseFeet(heightMatch[1]);

  const weightMatch = text.match(/(?:[-–•]\s*)?Weight[:\s]+([\d,]+\s*(?:pounds|lbs?)(?:\s*(?:gross\s*vehicle\s*weight|GVW))?)/i);
  if (weightMatch) result.max_weight_lbs = parsePounds(weightMatch[1]);
  // Fallback: "80,000 pounds gross vehicle weight (GVW)"
  if (!result.max_weight_lbs) {
    const gvwMatch = text.match(/([\d,]+)\s*pounds\s*(?:gross\s*vehicle\s*weight|GVW)/i);
    if (gvwMatch) result.max_weight_lbs = parsePounds(gvwMatch[1]);
  }

  // Overhang
  const overhangRear = text.match(/(\d+)\s*(?:feet|foot|ft)\s*(?:in\s*the\s*)?rear/i);
  if (overhangRear) result.max_overhang_rear_ft = parseFloat(overhangRear[1]);
  
  const overhangFront = text.match(/(\d+)\s*(?:feet|foot|ft)\s*(?:in\s*the\s*)?front/i);
  if (overhangFront) result.max_overhang_front_ft = parseFloat(overhangFront[1]);

  // ── Superload thresholds (max WITH permit) ──
  const superLengthMatch = text.match(/Max(?:imum)?\s*Length\s*With\s*Permit[:\s]+([\d',.\s]+(?:feet|foot|ft))/i);
  if (superLengthMatch) result.superload_threshold_length_ft = parseFeet(superLengthMatch[1]);

  const superWidthMatch = text.match(/Max(?:imum)?\s*Width\s*With\s*Permit[:\s]+([\d',.\s]+(?:feet|foot|ft))/i);
  if (superWidthMatch) result.superload_threshold_width_ft = parseFeet(superWidthMatch[1]);

  const superHeightMatch = text.match(/Max(?:imum)?\s*Height\s*With\s*Permit[:\s]+([\d',.\s]+(?:feet|foot|ft))/i);
  if (superHeightMatch) result.superload_threshold_height_ft = parseFeet(superHeightMatch[1]);

  // ── Permit costs ──
  // Pattern: "Oversize single trip permit: $61.61"
  const costRegex = /([A-Za-z\s-]+(?:permit|certificate|fee))[:\s]*\$?([\d,]+(?:\.\d{2})?)/gi;
  let costMatch;
  while ((costMatch = costRegex.exec(text)) !== null) {
    const permitType = costMatch[1].trim().toLowerCase();
    const cost = parseDollars(costMatch[2]);
    if (cost && cost > 0 && cost < 50000) {
      result.permit_costs.push({
        permit_type: permitType,
        base_cost_usd: cost,
      });
    }
  }

  // ── Travel time restrictions ──
  if (/daylight/i.test(text)) {
    const daylightBlock = text.match(/(?:daylight|travel\s*time)[^.]*\./i);
    result.travel_restrictions.push({
      restriction_type: 'daylight_only',
      description: daylightBlock ? daylightBlock[0].trim().substring(0, 500) : 'Daylight travel restrictions apply',
    });
  }
  if (/holiday/i.test(text) && /may\s*(?:not|NOT)|cannot|prohibited/i.test(text)) {
    result.travel_restrictions.push({
      restriction_type: 'holiday_blackout',
      description: 'Holiday travel restrictions apply for oversize loads',
    });
  }
  if (/weekend/i.test(text)) {
    const weekendAllowed = /weekend\s*travel\s*(?:is\s*)?permitted/i.test(text);
    result.travel_restrictions.push({
      restriction_type: 'weekend',
      description: weekendAllowed ? 'Weekend travel permitted' : 'Weekend travel may be restricted',
    });
  }
  if (/curfew/i.test(text)) {
    result.travel_restrictions.push({
      restriction_type: 'curfew',
      description: 'Traffic curfew zones apply — see permit for details',
    });
  }

  // ── Signage requirements ──
  if (/oversize\s*load|wide\s*load/i.test(text) && /sign/i.test(text)) {
    const signWidth = text.match(/signs?\s*must\s*be[^.]*?(\d+)\s*(?:feet|ft).+?wide/i);
    const signLetters = text.match(/letters?\s*(?:a\s*)?minimum\s*(?:of\s*)?(\d+)\s*(?:inches|in)/i);
    result.signage_requirements = {
      sign_text: /Wide\s*Load/i.test(text) && /Oversize\s*Load/i.test(text) ? 'OVERSIZE LOAD / WIDE LOAD' : 'OVERSIZE LOAD',
      sign_min_width_ft: signWidth ? parseInt(signWidth[1]) : null,
      letter_height_inches: signLetters ? parseInt(signLetters[1]) : null,
      headlights_required: /headlights?\s*(?:turned\s*)?on/i.test(text),
      strobe_required: /strobe/i.test(text),
    };
  }

  // ── Escort/pilot car requirements ──
  if (/pilot\s*car|escort\s*vehicle/i.test(text)) {
    const twoEscorts = text.match(/(?:two|2)\s*(?:pilot\s*cars?|escort\s*vehicles?)/i);
    result.escort_requirements = {
      mentioned: true,
      two_escorts_condition: twoEscorts ? 'Two escorts required for certain oversize conditions' : null,
    };
  }

  return result;
}

// ─── Parse certification page (all states in one page) ─────────────
function parseCertificationPage(html) {
  const certifications = [];
  
  // Split by H3 headers (### StateNameHere)
  const stateBlocks = html.split(/<h3[^>]*>/i);
  
  for (const block of stateBlocks) {
    // Get state name from the header
    const nameMatch = block.match(/^([^<]+)</);
    if (!nameMatch) continue;
    const stateName = nameMatch[1].trim();
    
    // Skip non-state headers
    if (!/^[A-Z]/.test(stateName) || stateName.length > 25) continue;
    
    // Map to state code
    const stateInfo = US_STATES.find(s => 
      s.name.toLowerCase() === stateName.toLowerCase()
    );
    if (!stateInfo) continue;
    
    const text = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    
    const cert = {
      state_code: stateInfo.code,
      state_name: stateInfo.name,
      requires_certification: true,
      min_age: null,
      training_hours: null,
      insurance_min_usd: null,
      renewal_period_years: null,
      reciprocity_states: [],
      training_urls: [],
      application_urls: [],
      notes: text.substring(0, 2000),
    };

    // Age requirement
    const ageMatch = text.match(/(?:must\s*be\s*(?:at\s*least\s*)?|minimum\s*)(\d+)\s*years/i);
    if (ageMatch) cert.min_age = parseInt(ageMatch[1]);

    // Training hours
    const hoursMatch = text.match(/(\d+)-hour\s*(?:course|class|program|training)/i);
    if (hoursMatch) cert.training_hours = parseInt(hoursMatch[1]);

    // Insurance minimums
    const insuranceMatch = text.match(/\$?([\d,]+(?:,\d{3})*)\s*(?:in\s*)?(?:commercial\s*)?(?:liability|insurance|coverage)/i);
    if (insuranceMatch) cert.insurance_min_usd = parseInt(insuranceMatch[1].replace(/,/g, ''));

    // Renewal period
    const renewalMatch = text.match(/every\s*(\d+)\s*years/i);
    if (renewalMatch) cert.renewal_period_years = parseInt(renewalMatch[1]);
    const expiresMatch = text.match(/expires?\s*(?:after\s*)?(\d+)\s*years/i);
    if (expiresMatch) cert.renewal_period_years = parseInt(expiresMatch[1]);

    // Reciprocity states — look for state names after "from" or "recognizes"
    const recipRegex = /(?:from|recognizes?|accepts?\s*certifications?\s*from|reciproc(?:ity|al)\s*(?:states?|compact\s*and\s*agreement\s*states?))[,:\s]+(?:including\s+)?((?:(?:Arizona|Colorado|Florida|Georgia|Kansas|Minnesota|New York|North Carolina|Oklahoma|Pennsylvania|Utah|Virginia|Washington|Wisconsin|SC&RA|Specialized Carriers)[\s,and]+)+)/gi;
    let recipMatch;
    while ((recipMatch = recipRegex.exec(text)) !== null) {
      const stateNames = recipMatch[1];
      const allStateNames = stateNames.match(/(?:Arizona|Colorado|Florida|Georgia|Kansas|Minnesota|New York|North Carolina|Oklahoma|Pennsylvania|Utah|Virginia|Washington|Wisconsin)/gi);
      if (allStateNames) {
        for (const name of allStateNames) {
          const found = US_STATES.find(s => s.name.toLowerCase() === name.trim().toLowerCase());
          if (found && !cert.reciprocity_states.includes(found.code)) {
            cert.reciprocity_states.push(found.code);
          }
        }
      }
    }

    // Training URLs
    const urlRegex = /href="([^"]+)"/gi;
    let urlMatch;
    const blockHtml = block.substring(0, 5000);
    while ((urlMatch = urlRegex.exec(blockHtml)) !== null) {
      const url = urlMatch[1];
      if (url.includes('course') || url.includes('training') || url.includes('teex') || url.includes('nsc.org') || url.includes('rsanetwork') || url.includes('uspilotcar')) {
        cert.training_urls.push(url);
      }
      if (url.includes('application') || url.includes('dmv') || url.includes('penndot') || url.includes('.pdf')) {
        cert.application_urls.push(url);
      }
    }

    certifications.push(cert);
  }
  
  return certifications;
}

// ─── Main execution ────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  WLS Regulation Crawler → Haul Command Ingestion');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Mode: ${DRY_RUN ? '🧪 DRY RUN' : '🔴 LIVE'}`);
  console.log(`  Target: ${CERTS_ONLY ? 'Certifications only' : SINGLE_STATE ? `State: ${SINGLE_STATE}` : 'All 50 US states + 5 Canadian provinces'}`);
  console.log('');

  // ── Phase 1: Crawl state regulation pages ──
  if (!CERTS_ONLY) {
    const states = SINGLE_STATE
      ? US_STATES.filter(s => s.slug.includes(SINGLE_STATE.toLowerCase()) || s.name.toLowerCase() === SINGLE_STATE.toLowerCase())
      : US_STATES;
    
    const provinces = SINGLE_STATE ? [] : CA_PROVINCES;
    
    console.log(`\n📋 PHASE 1: Crawling ${states.length} US state pages + ${provinces.length} Canadian province pages\n`);
    
    const allResults = [];
    let successCount = 0;
    let failCount = 0;

    // US States
    for (let i = 0; i < states.length; i++) {
      const state = states[i];
      const url = `${BASE}/${state.slug}/`;
      process.stdout.write(`  [${i + 1}/${states.length + provinces.length}] ${state.name}...`);
      
      const html = await fetchWithRetry(url);
      if (!html) {
        console.log(' ❌ FAILED');
        failCount++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      const data = parseRegulationPage(html, state, 'US');
      allResults.push(data);
      
      const dims = [];
      if (data.max_length_ft) dims.push(`L:${data.max_length_ft}'`);
      if (data.max_width_ft) dims.push(`W:${data.max_width_ft}'`);
      if (data.max_height_ft) dims.push(`H:${data.max_height_ft}'`);
      if (data.max_weight_lbs) dims.push(`Wt:${(data.max_weight_lbs/1000).toFixed(0)}k`);
      const permits = data.permit_costs.length;
      const travel = data.travel_restrictions.length;
      
      console.log(` ✅ ${dims.join(' ')} | ${permits} permit costs | ${travel} travel rules`);
      successCount++;
      await sleep(RATE_LIMIT_MS);
    }

    // Canadian Provinces
    for (let i = 0; i < provinces.length; i++) {
      const prov = provinces[i];
      const url = `${BASE}/${prov.slug}/`;
      process.stdout.write(`  [${states.length + i + 1}/${states.length + provinces.length}] ${prov.name} (CA)...`);
      
      const html = await fetchWithRetry(url);
      if (!html) {
        console.log(' ❌ FAILED');
        failCount++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      const data = parseRegulationPage(html, prov, 'CA');
      allResults.push(data);
      console.log(` ✅`);
      successCount++;
      await sleep(RATE_LIMIT_MS);
    }

    console.log(`\n  ✅ ${successCount} succeeded, ❌ ${failCount} failed\n`);

    // Write results to JSON
    const outPath = path.resolve(__dirname, '..', 'data', 'wls_regulations.json');
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2));
    console.log(`  📁 Saved ${allResults.length} regulation records to ${outPath}\n`);

    // Print summary table
    console.log('┌──────┬──────────────────┬────────┬────────┬────────┬──────────┬─────────┬─────────┐');
    console.log('│ Code │ State            │ Length │ Width  │ Height │ Weight   │ Permits │ Travel  │');
    console.log('├──────┼──────────────────┼────────┼────────┼────────┼──────────┼─────────┼─────────┤');
    for (const r of allResults) {
      const code = r.admin1_code.padEnd(4);
      const name = r.admin1_name.substring(0, 16).padEnd(16);
      const l = r.max_length_ft ? `${r.max_length_ft}'`.padStart(6) : '   N/A';
      const w = r.max_width_ft ? `${r.max_width_ft.toFixed(1)}'`.padStart(6) : '   N/A';
      const h = r.max_height_ft ? `${r.max_height_ft}'`.padStart(6) : '   N/A';
      const wt = r.max_weight_lbs ? `${(r.max_weight_lbs/1000).toFixed(0)}k`.padStart(8) : '     N/A';
      const p = `${r.permit_costs.length}`.padStart(7);
      const t = `${r.travel_restrictions.length}`.padStart(7);
      console.log(`│ ${code} │ ${name} │ ${l} │ ${w} │ ${h} │ ${wt} │ ${p} │ ${t} │`);
    }
    console.log('└──────┴──────────────────┴────────┴────────┴────────┴──────────┴─────────┴─────────┘');

    // Stats
    const withLength = allResults.filter(r => r.max_length_ft).length;
    const withWidth = allResults.filter(r => r.max_width_ft).length;
    const withHeight = allResults.filter(r => r.max_height_ft).length;
    const withWeight = allResults.filter(r => r.max_weight_lbs).length;
    const withPermits = allResults.filter(r => r.permit_costs.length > 0).length;
    console.log(`\n  📊 Extraction rates:`);
    console.log(`     Length: ${withLength}/${allResults.length} (${(withLength/allResults.length*100).toFixed(0)}%)`);
    console.log(`     Width:  ${withWidth}/${allResults.length} (${(withWidth/allResults.length*100).toFixed(0)}%)`);
    console.log(`     Height: ${withHeight}/${allResults.length} (${(withHeight/allResults.length*100).toFixed(0)}%)`);
    console.log(`     Weight: ${withWeight}/${allResults.length} (${(withWeight/allResults.length*100).toFixed(0)}%)`);
    console.log(`     Permits: ${withPermits}/${allResults.length} (${(withPermits/allResults.length*100).toFixed(0)}%)`);
  }

  // ── Phase 2: Crawl certification page ──
  console.log('\n\n📋 PHASE 2: Extracting pilot car certification data\n');
  
  const certUrl = `${BASE}/state-certifications-pilot-cars-escort-vehicles/`;
  process.stdout.write(`  Fetching certification page...`);
  const certHtml = await fetchWithRetry(certUrl);
  
  if (!certHtml) {
    console.log(' ❌ FAILED');
  } else {
    const certifications = parseCertificationPage(certHtml);
    console.log(` ✅ ${certifications.length} states extracted\n`);

    // Print certification summary
    for (const cert of certifications) {
      console.log(`  🏛️ ${cert.state_name} (${cert.state_code})`);
      console.log(`     Age: ${cert.min_age || 'N/A'} | Training: ${cert.training_hours || 'N/A'}hrs | Insurance: ${cert.insurance_min_usd ? '$' + cert.insurance_min_usd.toLocaleString() : 'N/A'}`);
      console.log(`     Renewal: ${cert.renewal_period_years ? cert.renewal_period_years + ' years' : 'N/A'}`);
      console.log(`     Reciprocity: ${cert.reciprocity_states.length > 0 ? cert.reciprocity_states.join(', ') : 'None / N/A'}`);
      if (cert.training_urls.length) console.log(`     Training: ${cert.training_urls.join(', ')}`);
      console.log('');
    }

    // Save certifications
    const certOutPath = path.resolve(__dirname, '..', 'data', 'wls_certifications.json');
    const certOutDir = path.dirname(certOutPath);
    if (!fs.existsSync(certOutDir)) fs.mkdirSync(certOutDir, { recursive: true });
    fs.writeFileSync(certOutPath, JSON.stringify(certifications, null, 2));
    console.log(`  📁 Saved ${certifications.length} certification records to ${certOutPath}\n`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  WLS Regulation Crawler — COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
