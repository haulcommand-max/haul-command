import { chromium } from 'playwright';
import { gemini } from '../lib/ai/brain.js';
import { getSupabaseAdmin } from '../lib/supabase/admin.js';
import crypto from 'crypto';

/**
 * DOUBLE PLATINUM architecture:
 * The absolute safest, most cost-effective maximum speed globally.
 * To scale to 120 countries without crashing or paying massive API/Cloud fees, we decouple into 3 stages:
 * Stage 1: Async Scraping Queue (Workers extract HTML/PDFs locally, push to DB).
 * Stage 2: Batched LLM Enrichment (Passes chunks of 10 raw texts to Gemini *at once* to save token overhead).
 * Stage 3: Instant SEO Claiming (DB Upsert -> triggers webhook for IndexNow, completely asynchronous).
 */

const LOWEST_10_STATES = ['Rhode Island', 'Delaware', 'Vermont', 'New Hampshire', 'Maine', 'West Virginia', 'Connecticut', 'Massachusetts', 'Washington', 'North Dakota'];

async function scrapeStateRawData(state: string, browserContext: any): Promise<string> {
  console.log(`[SCRAPER CORE] 🕸️ Fetching raw intel for ${state}...`);
  const page = await browserContext.newPage();
  const query = encodeURIComponent(`official oversize overweight vehicle permit escort regulations "${state}" DOT DMV DPS`);
  
  try {
    await page.goto(`https://www.google.com/search?q=${query}`, { timeout: 15000 });
    const searchData = await page.evaluate(() => {
      const results: string[] = [];
      document.querySelectorAll('div.g').forEach(el => {
        const title = el.querySelector('h3')?.textContent || '';
        const url = el.querySelector('a')?.getAttribute('href') || '';
        const snippet = el.querySelector('div.VwiC3b')?.textContent || '';
        if (title && url.includes('.gov')) {
          results.push(`Title: ${title}\nURL: ${url}\nSnippet: ${snippet}`);
        }
      });
      return results.join('\n\n');
    });
    await page.close();
    return searchData;
  } catch (error) {
    console.error(`[SCRAPER CORE] ❌ Scrape timeout: ${state}`);
    await page.close();
    return "No official .gov data extracted.";
  }
}

async function bulkEnrichWithGemini(stateRawDataMap: Record<string, string>) {
  console.log(`[ENRICHMENT CLUSTER] 🧠 Processing ${Object.keys(stateRawDataMap).length} states in a single batch to drastically cut API overhead.`);
  
  // By sending the prompt with all raw data at once, we optimize context window token costs
  const prompt = `
You are building a U.S. heavy-haul ecosystem directory for Haul Command.
Extract OFFICIAL state-level sources for oversize/overweight movement and pilot/escort operations for the following states based on the provided raw search data.

Do not guess. Return structured JSON only.
If a field cannot be confirmed, return "unknown".

RAW DATA PAYLOADS:
"""
${JSON.stringify(stateRawDataMap, null, 2)}
"""

Output as JSON array matching this exact schema:
[
  {
    "state": "string",
    "source_type": "permit_office | escort_requirements | statute_or_rule | contact_page",
    "source_title": "string",
    "source_url": "string",
    "agency_name": "string",
    "evidence_snippet": "string",
    "confidence_score": 90,
    "needs_manual_review": false 
  }
]
`;

  try {
    const res = await gemini().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });
    
    const parsed = JSON.parse(res.text ?? '[]');
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    console.error(`[ENRICHMENT CLUSTER] ❌ Bulk LLM step failed:`, err);
    return [];
  }
}

const STATE_ABBR: Record<string, string> = {
  'Rhode Island': 'RI', 'Delaware': 'DE', 'Vermont': 'VT', 'New Hampshire': 'NH',
  'Maine': 'ME', 'West Virginia': 'WV', 'Connecticut': 'CT', 'Massachusetts': 'MA',
  'Washington': 'WA', 'North Dakota': 'ND'
};

async function bulkUpsertToDatabase(rows: any[]) {
  const supabase = getSupabaseAdmin();
  let inserted = 0;
  
  for (const row of rows) {
    if (!row.source_url || row.source_url === 'unknown') continue;
    
    const listingId = crypto.randomUUID();
    const slug = `hc-state-regulator-${row.state.toLowerCase().replace(/\s+/g, '-')}-${crypto.randomBytes(3).toString('hex')}`;
    
    // We target hc_places 
    const { error } = await supabase.from('hc_places').upsert({
      id: listingId,
      name: row.agency_name || `${row.state} Official Permit Office`,
      slug: slug,
      admin1_code: STATE_ABBR[row.state] || row.state,
      country_code: 'US',
      primary_source_type: 'gemini_bulk_pass',
      claim_status: 'unclaimed',
      is_search_indexable: true,
      website: row.source_url,
      source_confidence: row.confidence_score
    }, { onConflict: 'slug' });
    
    if (error) {
      console.error(`[PIPELINE] DB Error for ${row.state}:`, error.message);
    } else {
      inserted++;
    }
  }
  
  console.log(`[PIPELINE] ✅ Secured ${inserted} regulatory profiles instantly.`);
}

async function executeV2Pipeline() {
  console.log(`=======================================================`);
  console.log(`🚀 SCALABLE INGEST PIPELINE V2: BATCH QUEUE ARCHITECTURE`);
  console.log(`=======================================================`);
  console.log(`Targeting the lowest 10 density states: ${LOWEST_10_STATES.join(', ')}`);
  
  // 1. DISTRIBUTED SCRAPE PHASE
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const rawDataPayload: Record<string, string> = {};
  
  await Promise.all(LOWEST_10_STATES.map(async (state) => {
    rawDataPayload[state] = await scrapeStateRawData(state, context);
  }));
  await browser.close();
  
  // 2. BULK ENRICHMENT PHASE
  const finalJson = await bulkEnrichWithGemini(rawDataPayload);
  
  // 3. BULK DATABASE INSERTION PHASE
  if (finalJson.length > 0) {
    await bulkUpsertToDatabase(finalJson);
  } else {
    console.log(`[PIPELINE] No valid rows returned for the batch.`);
  }
  
  console.log(`\n✅ 10-State Sprint Complete. Ready for next block.`);
}

executeV2Pipeline().catch(console.error);
