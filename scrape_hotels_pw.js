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

function createSlug(baseStr, stateStr, phoneStr) {
    let safeStr = (baseStr || 'hotel').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0,30);
    let safeState = stateStr.toLowerCase().replace(/[^a-z]/g, '').slice(0,2);
    return `hc-hotel-${safeStr}-${safeState}-${phoneStr.slice(0,5)}-claim`;
}

async function run() {
    console.log("[🚀] Launching Playwright Armored Scraper for Pilot Car Hotels...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    });
    
    let allExtracted = [];

    const page = await context.newPage();
    try {
        const url = `https://uspilotcars.com/find_a_hotel.html`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Decode the messy HTML tables same as earlier
        const pageData = await page.evaluate(() => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            let node;
            let textBlocks = [];
            while ((node = walker.nextNode())) {
                const txt = node.nodeValue.trim();
                // We keep slightly shorter blocks because hotels might just be "ATREA INN"
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
                
                let name = "Pilot Car Friendly Hotel";
                let city = "Regional";
                let stateCode = "US"; // Default fallback
                let tags = ['Lodging', 'Oversize Load Parking'];
                
                for (let k = 1; k <= 4; k++) {
                    if (j - k >= 0) {
                        const prev = pageData[j - k];
                        if (!prev.match(/\b\d{3}-\d{4}\b/)) {
                            // Often the city/state name is caps "AMARILLO, TX" or similar
                            if (prev.includes('INN') || prev.includes('MOTEL') || prev.includes('HOTEL') || prev.includes('SUITES') || prev.includes('WYNDHAM') || prev.includes('LODGE')) {
                                name = prev;
                            } else if (prev === prev.toUpperCase() && prev.length > 3) {
                                if (name === "Pilot Car Friendly Hotel") name = prev;
                                else city = prev;
                            }
                            // Detect amenities
                            if (prev.toLowerCase().includes('parking')) tags.push('Truck Parking');
                            if (prev.toLowerCase().includes('breakfast')) tags.push('Free Breakfast');
                            if (prev.toLowerCase().includes('pet')) tags.push('Pet Friendly');
                            if (prev.toLowerCase().includes('laundry')) tags.push('Guest Laundry');
                            if (prev.toLowerCase().includes('rate')) tags.push('Pilot Car Rates');
                        }
                    }
                }

                // If City looks like "AMARILLO, TX", try to split state
                if (city.includes(',')) {
                    stateCode = city.split(',')[1].trim().substring(0,2).toUpperCase();
                    city = city.split(',')[0].trim();
                } else if (name.includes(',')) {
                    // Sometimes name has it
                    stateCode = name.split(',')[1].trim().substring(0,2).toUpperCase();
                }

                const finalState = stateCode.match(/^[A-Z]{2}$/) ? stateCode : 'US';

                allExtracted.push({
                    phone_norm: phone,
                    stateCode: finalState,
                    city: city,
                    name: name.replace(/[^a-zA-Z0-9 &'.-]/g, '').substring(0, 50).trim(),
                    tags: Array.from(new Set(tags))
                });
            }
        }
    } catch (e) {
        console.error("Scrape Error:", e.message);
    } finally {
        await page.close();
    }
    await browser.close();

    console.log(`\n[🚀] Hotel Extraction Complete! Pulled ${allExtracted.length} potential lodging spots.`);
    
    // Deduplication Phase against hc_real_operators
    let existingPhones = new Set();
    const { data: dbRows } = await supabase.from('hc_real_operators').select('phone_e164').not('phone_e164', 'is', null).limit(20000);
    if(dbRows) dbRows.forEach(r => existingPhones.add(normalize(r.phone_e164)));

    let finalBatch = [];
    let seen = new Set();
    for (const op of allExtracted) {
        if (!existingPhones.has(op.phone_norm) && !seen.has(op.phone_norm)) {            
            seen.add(op.phone_norm);
            finalBatch.push({
                slug: createSlug(op.name, op.stateCode, op.phone_norm),
                display_name: `${op.name} [UNVERIFIED LODGING]`,
                entity_type: 'hotel',
                phone: formatPhone(op.phone_norm),
                phone_e164: '+1' + op.phone_norm,
                city: op.city.length < 30 ? op.city : 'Regional',
                state_code: op.stateCode,
                country_code: 'US',
                source_system: 'uspilotcars.com_hotel_directory',
                source_table: 'playwright_crawler',
                trust_classification: 'likely_real_unverified',
                evidence_score: 0.15,
                trust_score: 0.10,
                is_public: true,
                claim_status: 'unclaimed',
                description: `⚠️ UNVERIFIED LODGING ⚠️\n\nIdentified Amenities: ${op.tags.join(', ')}.\n\nCLAIM this profile to verify your heavy-haul and pilot car parking capabilities, update your commercial rates, and funnel drivers directly to your front desk.`
            });
        }
    }

    console.log(`[+] Filtered out ${allExtracted.length - finalBatch.length} duplicates.`);
    console.log(`[+] Net-New Playwright Hotel Injections: ${finalBatch.length}`);

    if (finalBatch.length > 0) {
        const { error } = await supabase.from('hc_real_operators').upsert(finalBatch, { onConflict: 'slug' });
        if (error) {
            console.error("[-] DB Push Error:", error.message);
        } else {
            console.log(`[+] ✅ LODGING DIRECTORY SEEDED: ${finalBatch.length} Heavy-Haul Friendly Hotels deployed. Claim Funnel Active.`);
        }
    }
}

run().catch(console.error);
