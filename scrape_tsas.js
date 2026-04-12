const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: '.env.production.local' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

function normalize(phone) {
    if (!phone) return null;
    let d = phone.replace(/\D/g, '');
    if (d.length > 10) d = d.slice(-10);
    return d.length === 10 ? d : null;
}

function formatPhone(digits) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
}

function createSlug(baseStr, stateStr, phoneStr) {
    let safeStr = (baseStr || 'place').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);
    let safeState = (stateStr || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 2);
    let ph = phoneStr ? phoneStr.slice(0, 5) : Math.floor(Math.random()*10000);
    return `hc-${safeStr}-${safeState}-${ph}-claim`;
}

const CATEGORIES = [
    { id: 19, name: 'truck_stop', display: 'Truck Stops', sourceId: '19' },
    { id: 30, name: 'repair_shop', display: 'Truck & Trailer Repair', sourceId: '30' },
    { id: 28, name: 'tire_shop', display: 'Tire Repair & Sales', sourceId: '28' },
    { id: 107, name: 'drop_yard', display: 'Secure Trailer Drop Yard', sourceId: '107' },
    { id: 25, name: 'scale_weigh_station_public', display: 'State Weigh Stations', sourceId: '25' },
    { id: 105, name: 'washout', display: 'Trailer / Tanker Wash Out', sourceId: '105' },
    { id: 113, name: 'mobile_fueling', display: 'Mobile Fueling', sourceId: '113' },
    { id: 26, name: 'rest_area', display: 'Rest Areas', sourceId: '26' },
    { id: 29, name: 'tow_rotator', display: 'Towing & Wrecker Service', sourceId: '29' },
    { id: 104, name: 'body_shop', display: 'Body Shop', sourceId: '104' },
    { id: 82, name: 'welding', display: 'Welding', sourceId: '82' },
    { id: 31, name: 'oil_lube', display: 'Oil & Lube', sourceId: '31' },
    { id: 70, name: 'mobile_truck_repair', display: 'Mobile Truck / Trailer Repair', sourceId: '70' },
    { id: 88, name: 'garages_shops', display: 'Garages / Shops', sourceId: '88' },
    { id: 32, name: 'truck_wash', display: 'Truck Wash', sourceId: '32' },
    { id: 33, name: 'trailer_wash', display: 'Trailer Wash', sourceId: '33' },
    { id: 93, name: 'cat_scale', display: 'CAT Scale Locations', sourceId: '93' },
    { id: 95, name: 'secure_storage', display: 'Secure Storage', sourceId: '95' },
    { id: 27, name: 'pilot_car_company', display: 'Pilot Car Companies', sourceId: '27' },
    { id: 72, name: 'restaurant_truck_parking', display: 'Restaurants With Truck Parking', sourceId: '72' }
];

async function run() {
    console.log("[🚀] Launching GLOBAL TS&S INGESTION PIPELINE...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0 Safari/537.36'
    });
    
    let allExtracted = [];
    let processedPhones = new Set();
    const page = await context.newPage();

    let existingSlugs = new Set();
    const { data: dbRows } = await supabase.from('places').select('slug').eq('source_name', 'truckstopsandservices.com');
    if(dbRows) {
        dbRows.forEach(r => existingSlugs.add(r.slug));
    }

    let globalCount = 0;

    for (const cat of CATEGORIES) {
        console.log(`\n[+] Processing Category: ${cat.display} (sourceId: ${cat.id})`);
        const catUrl = `https://www.truckstopsandservices.com/listcatbusinesses.php?id=${cat.id}`;
        try {
            await page.goto(catUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Extract all href links regardless of container, filter manually
            const stateLinks = await page.$$eval('a', els => 
                els.map(e => e.href).filter(href => href.includes('listcatbusinesses.php?id=') && href.includes('&state='))
            );
            
            const uniqueLinks = Array.from(new Set(stateLinks));
            console.log(`    Found ${uniqueLinks.length} active states for ${cat.display}`);

            for (const stateUrl of uniqueLinks) {
                try {
                    await page.goto(stateUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    
                    const pData = await page.evaluate(() => {
                        let validNodes = [];
                        let elements = document.querySelectorAll('div, td');
                        elements.forEach(el => {
                            let text = (el.innerText || '').trim();
                            // Keep short nodes containing a phone number
                            if (text.match(/\b\d{3}[-.\s]\d{4}\b/) && text.length < 500 && text.length > 20) {
                                validNodes.push(text);
                            }
                        });
                        return Array.from(new Set(validNodes));
                    });
                    
                    let foundOnState = 0;
                    
                    for (let textBlockRaw of pData) {
                        let textBlock = String(textBlockRaw || '');
                        let lines = textBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                        let name = lines[0] || '';
                        if (name.includes('More Info')) continue;

                        let phoneMatch = textBlock.match(/\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
                        if (!phoneMatch) continue;
                        let phone = phoneMatch[0].replace(/\D/g, '');
                        if (phone.length > 10) phone = phone.slice(-10);
                        if (phone.length !== 10) continue;

                        let cityFallback = "";
                        let stateFallback = stateUrl.match(/state=(\d+)/)[1];
                        
                        let locMatch = textBlock.match(/([A-Za-z\s]+),\s*([A-Z]{2})\b/);
                        if (locMatch) {
                            cityFallback = locMatch[1].trim();
                            stateFallback = locMatch[2].trim();
                        }

                        // Determine Country Code from Region
                        let resolvedCountryCode = 'US';
                        const caProvinces = new Set(['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT']);
                        if (caProvinces.has(stateFallback)) {
                            resolvedCountryCode = 'CA';
                        }

                        if (!name || name.length < 3) continue;

                        let dedupKey = phone + cat.name;
                        if (!processedPhones.has(dedupKey)) {
                            processedPhones.add(dedupKey);

                            let finalSlug = 'hc-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30) + '-' + stateFallback.toLowerCase() + '-' + phone.slice(0,5) + '-claim';

                            allExtracted.push({
                                place_type: cat.name,
                                name: name.substring(0, 50),
                                country_code: resolvedCountryCode,
                                region: stateFallback.length > 2 ? 'US' : stateFallback,
                                city: cityFallback || 'Unknown',
                                phone: '(' + phone.slice(0,3) + ') ' + phone.slice(3,6) + '-' + phone.slice(6),
                                source_name: 'truckstopsandservices.com',
                                source_identifier: cat.id.toString(),
                                claim_status: 'unclaimed',
                                verification_status: 'unverified',
                                trust_score_seed: 0.10,
                                slug: finalSlug,
                                is_live: true,
                                description: `Unverified ${cat.display} location in ${cityFallback}, ${stateFallback}. Claim this profile to update your services and commercial rates.`,
                                created_at: new Date().toISOString()
                            });
                            foundOnState++;
                            globalCount++;
                        }
                    }
                    console.log(`      > Scraped ${foundOnState} entries from ${stateUrl.split('?')[1]}`);
                } catch(err) {
                    console.log(`    [!] Error on state ${stateUrl}: ${err.message}`);
                }
            }
        } catch(err) {
            console.log(`[!] Error on category ${cat.name}: ${err.message}`);
        }
    }
    
    await browser.close();

    console.log(`\n[🚀] Extraction Complete! Pulled ${allExtracted.length} verified listings.`);

    // Upsert into Supabase `places` table
    const chunk_size = 500;
    for (let i = 0; i < allExtracted.length; i += chunk_size) {
        const chunk = allExtracted.slice(i, i + chunk_size);
        const { error } = await supabase.from('places').upsert(chunk, { onConflict: 'slug' });
        if (error) {
            console.error(`[-] Batch chunk ${i} Insert Error:`, error.message);
        } else {
            console.log(`[+] Sent chunk ${i / chunk_size + 1} (${chunk.length} profiles) to DB`);
        }
    }

    console.log("\n[+] ✅ Haul Command Directory Injection Complete from TSAS!");
}

run().catch(console.error);
