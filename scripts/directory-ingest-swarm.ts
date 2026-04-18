import { chromium } from 'playwright';
import { gemini } from '../lib/ai/brain.js';
import { getSupabaseAdmin } from '../lib/supabase/admin.js';
import crypto from 'crypto';
import fetch from 'node-fetch';

const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

/**
 * 1. HEADLESS SCRAPING SWARM (Playwright + Fly.io compatible)
 * Extracts raw text and URLs from Google or target domains.
 */
async function scrapeStateRawData(state: string, browserContext: any): Promise<string> {
  console.log(`[SCRAPER] 🕸️ Extracting DOT/Permit data for ${state}...`);
  const page = await browserContext.newPage();
  const query = encodeURIComponent(`official oversize overweight vehicle permit escort regulations "${state}" DOT DMV DPS`);
  
  try {
    await page.goto(`https://www.google.com/search?q=${query}`, { timeout: 15000 });
    
    // We scrape the top organic result snippets and URLs to feed to the LLM
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
    console.error(`[SCRAPER] ❌ Failed scraping ${state}:`, error);
    await page.close();
    return "No official .gov data extracted.";
  }
}

/**
 * 2. DATA ENRICHMENT (Gemini AI)
 * Uses the saved Version 1 YAML Template prompt to structure the data into JSON.
 */
async function enrichDataWithGemini(state: string, rawData: string) {
  console.log(`[ENRICHMENT] 🧠 Feeding ${state} data to Gemini...`);
  
  const prompt = `
You are building a U.S. heavy-haul ecosystem directory for Haul Command.
Your task is to collect OFFICIAL state-level sources for oversize/overweight movement and pilot/escort operations for: ${state}

Priority sources only:
1. Official state DOT / DMV / DPS / highway patrol / commerce / permit office domains
2. Official state permitting portals
3. Official state PDFs, manuals, route maps

Do not guess. Return structured JSON only.
If a field cannot be confirmed, return "unknown".

Data extracted from search:
"""
${rawData}
"""

Output as JSON array matching this exact schema:
[
  {
    "state": "${state}",
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
    console.error(`[ENRICHMENT] ❌ Gemini failed for ${state}:`, err);
    return [];
  }
}

/**
 * 3. DATABASE INSERT & CLAIM CREATION (Supabase)
 * Stores the enriched rows and generates claim states for SEO compliance.
 */
async function saveToDatabaseAndSEO(state: string, rows: any[]) {
  const supabase = getSupabaseAdmin();
  let inserted = 0;
  
  for (const row of rows) {
    if (!row.source_url || row.source_url === 'unknown') continue;
    
    // We use directory_listings or a new regulatory_nodes table.
    // For this prototype, we'll map into directory_listings 
    // to maintain the SEO profile and claim functionality.
    const listingId = crypto.randomUUID();
    const slug = `hc-state-regulator-${state.toLowerCase().replace(/\s+/g, '-')}-${crypto.randomBytes(3).toString('hex')}`;
    
    // Upsert into Supabase
    const { error } = await supabase.from('directory_listings').upsert({
      id: listingId,
      entity_type: 'permit_office',
      name: row.agency_name || `${state} Official Permit Office`,
      slug: slug,
      region_code: state,
      country_code: 'US',
      source: 'gemini_official_pass',
      claim_status: 'unclaimed',
      is_visible: true,
      metadata: {
        source_title: row.source_title,
        source_url: row.source_url,
        evidence_snippet: row.evidence_snippet,
        confidence_score: row.confidence_score,
        seo_schema: {
          "@context": "https://schema.org",
          "@type": "GovernmentOrganization",
          "name": row.agency_name || `${state} Official Permit Office`,
          "url": row.source_url
        }
      }
    }, { onConflict: 'slug' });
    
    if (error) {
      console.error(`[DATABASE] ❌ Error saving ${row.source_url}:`, error.message);
    } else {
      inserted++;
      // Ping IndexNow for instant SEO discovery
      await pingIndexNow(`https://www.haulcommand.com/directory/${slug}`);
    }
  }
  
  console.log(`[DATABASE] 💾 ${state}: Saved ${inserted} regulatory profiles & generated Claims.`);
}

/**
 * 4. INSTANT INDEXING (SEO POLICY)
 */
async function pingIndexNow(url: string) {
  try {
    const INDEXNOW_KEY = process.env.INDEXNOW_API_KEY;
    if (!INDEXNOW_KEY) return;
    
    const payload = {
      host: "www.haulcommand.com",
      key: INDEXNOW_KEY,
      keyLocation: `https://www.haulcommand.com/${INDEXNOW_KEY}.txt`,
      urlList: [url]
    };
    
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // Silent fail for indexing
  }
}

/**
 * ORCHESTRATOR
 * Runs the swarm in chunks for all 50 states.
 */
async function runSwarm() {
  console.log(`=======================================================`);
  console.log(`🚀 HAUL COMMAND SWARM: 50-STATE INGESTION (VERSION 1)`);
  console.log(`=======================================================`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // Set Concurrency level (10 at a time for maximum throughput without killing LLM limits)
  const CONCURRENCY = 10; 
  
  for (let i = 0; i < STATES.length; i += CONCURRENCY) {
    const batch = STATES.slice(i, i + CONCURRENCY);
    console.log(`\n📦 Processing Batch: ${batch.join(', ')}`);
    
    await Promise.all(batch.map(async (state) => {
      // Step 1: Scrape
      const rawHtmlData = await scrapeStateRawData(state, context);
      
      // Step 2: Enrich
      const enrichedJSON = await enrichDataWithGemini(state, rawHtmlData);
      
      // Step 3 & 4: Insert, Claim, SEO Ping
      if (enrichedJSON.length > 0) {
        await saveToDatabaseAndSEO(state, enrichedJSON);
      }
    }));
  }
  
  await browser.close();
  console.log(`\n✅ 50-State Execution Complete.`);
}

runSwarm().catch(console.error);
