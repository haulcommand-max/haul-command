const { chromium } = require('playwright');
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.production.local' });

// We use connection pooling (6543) for massive Playwright dumps
const connectionString = "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

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
    console.log("[🚀] Launching Playwright Armored Scraper pointing to hc_global_operators...");
    
    const dbClient = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await dbClient.connect();
    console.log("[+] Connected to Global DB.");

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
    });
    
    // Test batch: Run the first 10 states for mass-speed validation. Can expand to all 48.
    const STATES = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia'];
    const BASE_URL = 'https://uspilotcars.com/';
    
    let allExtracted = [];

    // 5 browsers in parallel
    const batchSize = 5;
    for (let i = 0; i < STATES.length; i += batchSize) {
        const batch = STATES.slice(i, i + batchSize);
        const promises = batch.map(async (state) => {
            const page = await context.newPage();
            try {
                const url = `${BASE_URL}${state}_pilot_car.html`;
                const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
                if (response.status() !== 200) throw new Error(`Status ${response.status()}`);
                
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
                
                for (let j = 0; j < pageData.length; j++) {
                    const block = pageData[j];
                    const phoneMatch = block.match(/\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
                    if (phoneMatch) {
                        const phone = normalize(phoneMatch[0]);
                        if (!validPhone(phone)) continue;
                        
                        let name = "Independent Pilot Escort";
                        let city = state.substring(0, 1).toUpperCase() + state.substring(1);
                        let capabilitiesText = "";
                        
                        for (let k = 1; k <= 3; k++) {
                            if (j - k >= 0) {
                                const prev = pageData[j - k];
                                if (!prev.match(/\b\d{3}-\d{4}\b/)) {
                                    if (prev.includes('1') || prev.includes('2') || prev.includes('3') || prev.includes('4')) {
                                        name = prev.replace(/[1234]/g, '').trim();
                                        capabilitiesText = prev;
                                    } else if (prev === prev.toUpperCase() && prev.length > 3) {
                                        if (name === "Independent Pilot Escort") { name = prev; }
                                        else { city = prev; }
                                    }
                                }
                            }
                        }

                        allExtracted.push({
                            phone_norm: formatPhone(phone),
                            city: city,
                            name: name.replace(/[^a-zA-Z0-9 &]/g, '').substring(0, 50).trim(),
                            tags: processSuperscripts(capabilitiesText).join(', ')
                        });
                    }
                }
            } catch (e) {
                // Ignore missing state files (timeout / 404)
            } finally {
                await page.close();
            }
        });
        await Promise.allSettled(promises);
        console.log(`[+] Scanned ${Math.min(i + batchSize, STATES.length)}/${STATES.length} state registries...`);
    }

    await browser.close();
    console.log(`\n[🚀] Playwright Extraction Complete! Pulled ${allExtracted.length} contacts.`);
    
    // Deduplication Phase against hc_global_operators
    console.log("[+] Deduplicating against hc_global_operators master OS table...");
    const { rows } = await dbClient.query('SELECT phone_normalized FROM hc_global_operators WHERE phone_normalized IS NOT NULL');
    let existingPhones = new Set();
    rows.forEach(r => existingPhones.add(r.phone_normalized));

    let finalBatch = [];
    let seen = new Set();
    
    for (const op of allExtracted) {
        if (!existingPhones.has(op.phone_norm) && !seen.has(op.phone_norm)) {
            seen.add(op.phone_norm);
            finalBatch.push(op);
        }
    }

    console.log(`\n[+] Filtered out ${allExtracted.length - finalBatch.length} duplicates.`);
    console.log(`[+] Net-New Playwright Injectable Records: ${finalBatch.length}`);

    if (finalBatch.length > 0) {
        let successCount = 0;
        for (const record of finalBatch) {
            const slug = createSlug(record.name, record.city, record.phone_norm);
            const query = `
                INSERT INTO hc_global_operators (
                  name, phone_normalized, city, 
                  primary_trust_source, ecosystem_position, is_claimed, is_verified, slug,
                  top_comment_snippet
                )
                VALUES ($1, $2, $3, $4, $5, false, false, $6, $7)
                ON CONFLICT DO NOTHING
            `;
            const values = [
                record.name,
                record.phone_norm,
                record.city,
                'USPilotCars.com',
                'Pilot Car',
                slug,
                `Identified Capabilities: ${record.tags}`
            ];

            try {
                const res = await dbClient.query(query, values);
                if (res.rowCount && res.rowCount > 0) successCount++;
            } catch (insertErr) {
                // Ignore explicit duplication failures on index
            }
        }
        console.log(`[+] ✅ CROWN JEWEL DIRECTORY EXTENDED: ${successCount} Pilot Cars systematically injected via headless automated Chromium pipeline.`);
    }

    await dbClient.end();
}

run().catch(console.error);
