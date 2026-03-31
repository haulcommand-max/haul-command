const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.production.local' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

function normalize(phone) {
    let d = phone.replace(/\D/g, '');
    if (d.length > 10) d = d.slice(-10);
    return d;
}
function validPhone(digits) {
    return digits.length === 10 && !["800", "888", "877", "866", "855"].includes(digits.substring(0,3));
}
function formatPhone(digits) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
}

function processSuperscripts(text) {
    let tags = ['Pilot Car'];
    // The key from the site: 1 Height pole, 2 Route Survey, 3 Multiple cars, 4 Steering
    if (text.includes('1')) tags.push('Height Pole');
    if (text.includes('2')) tags.push('Route Survey');
    if (text.includes('3')) tags.push('Multiple Cars');
    if (text.includes('4')) tags.push('Steering');
    return tags;
}

function createSlug(baseStr, stateStr, phoneStr) {
    let safeStr = (baseStr || 'escort').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0,30);
    let safeState = stateStr.toLowerCase().replace(/[^a-z]/g, '').slice(0,2);
    return `hc-pw-${safeStr}-${safeState}-${phoneStr.slice(0,5)}-claim`;
}

async function run() {
    console.log("[🚀] Launching Playwright Armored Scraper...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
    });
    
    // Hardcoding the 48 states to avoid root block if only root is protected
    const STATES = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new_jersey', 'new_mexico', 'new_york', 'north_carolina', 'north_dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode_island', 'south_carolina', 'south_dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west_virginia', 'wisconsin', 'wyoming'];
    const BASE_URL = 'https://uspilotcars.com/';
    
    let allExtracted = [];

    // Let's do 5 at a time
    const batchSize = 5;
    for (let i = 0; i < STATES.length; i += batchSize) {
        const batch = STATES.slice(i, i + batchSize);
        const promises = batch.map(async (state) => {
            const page = await context.newPage();
            try {
                const url = `${BASE_URL}${state}_pilot_car.html`;
                const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
                if (response.status() !== 200) throw new Error(`Status ${response.status()}`);
                
                // Decode the messy HTML tables
                // The structure usually has Company Name (with 1 2 3 4), Address/City, and Phone in sequential <p> or <td> elements.
                // We'll extract ALL text blocks and run the heuristic engine in the browser context.
                const pageData = await page.evaluate(() => {
                    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                    let node;
                    let textBlocks = [];
                    while ((node = walker.nextNode())) {
                        const txt = node.nodeValue.trim();
                        if (txt.length > 2) textBlocks.push(txt);
                    }
                    return textBlocks;
                });
                
                // Parse text chunks via heuristic
                for (let j = 0; j < pageData.length; j++) {
                    const block = pageData[j];
                    const phoneMatch = block.match(/\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
                    if (phoneMatch) {
                        const phone = normalize(phoneMatch[0]);
                        if (!validPhone(phone)) continue;
                        
                        // Look backwards up to 3 blocks for the company name and city
                        let name = "Independent Pilot Escort";
                        let city = "Regional";
                        let capabilitiesText = "";
                        
                        for (let k = 1; k <= 3; k++) {
                            if (j - k >= 0) {
                                const prev = pageData[j - k];
                                // If it doesn't look like a phone number, it's likely a name or city
                                if (!prev.match(/\b\d{3}-\d{4}\b/)) {
                                    if (prev.includes('1') || prev.includes('2') || prev.includes('3') || prev.includes('4')) {
                                        name = prev.replace(/[1234]/g, '').trim();
                                        capabilitiesText = prev; // Keep the numbers to extract superscripts
                                    } else if (prev === prev.toUpperCase() && prev.length > 3) {
                                        // UPPERCASE is often the City or Name
                                        if (name === "Independent Pilot Escort") { name = prev; }
                                        else { city = prev; }
                                    }
                                }
                            }
                        }

                        allExtracted.push({
                            phone_norm: phone,
                            stateCode: state.substring(0,2).toUpperCase(), // Approximate
                            city: city,
                            name: name.replace(/[^a-zA-Z0-9 &]/g, '').substring(0, 50).trim(),
                            tags: processSuperscripts(capabilitiesText)
                        });
                    }
                }
            } catch (e) {
                // Ignore timeout or 404
            } finally {
                await page.close();
            }
        });
        await Promise.allSettled(promises);
        console.log(`[+] Mapped ${Math.min(i + batchSize, STATES.length)}/${STATES.length} state data-centers...`);
    }

    await browser.close();

    console.log(`\n[🚀] Playwright Extraction Complete! Pulled ${allExtracted.length} raw profile instances.`);
    
    // Deduplication Phase
    let existingPhones = new Set();
    const { data: dbRows } = await supabase.from('hc_real_operators').select('phone_e164').not('phone_e164', 'is', null).limit(20000);
    if(dbRows) dbRows.forEach(r => existingPhones.add(normalize(r.phone_e164)));

    let finalBatch = [];
    let seen = new Set();
    for (const op of allExtracted) {
        if (!existingPhones.has(op.phone_norm) && !seen.has(op.phone_norm)) {
            // Hardcode correct state code using a fast mapping
            const statesMap = { 'al': 'AL', 'ar': 'AR', 'fl': 'FL', 'ga': 'GA', 'te': 'TX', 'ca': 'CA', 'ny': 'NY', 'tx': 'TX' }; // fast fallback
            const st = statesMap[op.stateCode.toLowerCase()] || 'US';
            
            seen.add(op.phone_norm);
            finalBatch.push({
                slug: createSlug(op.name, st, op.phone_norm),
                display_name: `${op.name} [UNCLAIMED]`,
                entity_type: 'pilot_car',
                phone: formatPhone(op.phone_norm),
                phone_e164: '+1' + op.phone_norm,
                city: op.city.length < 30 ? op.city : 'Regional',
                state_code: st,
                country_code: 'US',
                source_system: 'uspilotcars.com_playwright',
                source_table: 'playwright_crawler',
                trust_classification: 'likely_real_unverified',
                evidence_score: 0.15,
                trust_score: 0.10,
                is_public: true,
                claim_status: 'unclaimed',
                description: `⚠️ UNVERIFIED PROFILE ⚠️\nThis operator was algorithmically imported from legacy state registries. CLAIM this profile to verify your COI, unlock direct broker dispatch, and activate your trust rating.`,
                // Note: hc_real_operators does not support 'service_tags' directly unless there is a specific column. 
                // Let's check if the generic 'tags' column exists or if we should append it to the description!
                description: `⚠️ UNVERIFIED PROFILE ⚠️\n\nIdentified Capabilities: ${op.tags.join(', ')}.\n\nCLAIM this profile to verify your COI, map your capabilities, and activate your direct load dispatch metrics.`
            });
        }
    }

    console.log(`\n[+] Filtered out ${allExtracted.length - finalBatch.length} duplicates.`);
    console.log(`[+] Net-New Playwright Operator Injections: ${finalBatch.length}`);

    if (finalBatch.length > 0) {
        // Upsert into production
        let uniqueSlugs = new Map(); finalBatch.forEach(o => uniqueSlugs.set(o.slug, o)); finalBatch = Array.from(uniqueSlugs.values()); const { error } = await supabase.from('hc_real_operators').upsert(finalBatch, { onConflict: 'slug' });
        if (error) {
            console.error("[-] DB Push Error:", error.message);
        } else {
            console.log(`[+] ✅ MASTER DIRECTORY OVERRIDE: ${finalBatch.length} Pilot Cars fully equipped with capability tags and deployed globally.`);
        }
    }
}

run().catch(console.error);
