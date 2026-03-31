const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.production.local' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
const BASE_URL = 'https://uspilotcars.com/';

async function fetchText(url) {
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
        }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.text();
}

function normalize(phone) {
    let d = phone.replace(/\D/g, '');
    if (d.length > 10) d = d.slice(-10);
    return d;
}
function valid(digits) { return digits.length === 10 && !["800", "888", "877", "866", "855"].includes(digits.substring(0,3)); }

async function run() {
    console.log(`[+] Downloading main directory page from ${BASE_URL}...`);
    let html;
    try {
        html = await fetchText(BASE_URL);
    } catch(e) {
        console.error("Failed to load root, falling back to state list. Error:", e.message);
        html = ""; // bypass to default list if cloudflare completely blocks root
    }

    const stateLinks = new Set();
    const linkRegex = /href=['"]([^'"]*_pilot_car\.html)['"]/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) stateLinks.add(match[1]);

    if (stateLinks.size === 0) {
        ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new_jersey', 'new_mexico', 'new_york', 'north_carolina', 'north_dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode_island', 'south_carolina', 'south_dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west_virginia', 'wisconsin', 'wyoming']
        .forEach(s => stateLinks.add(`${s}_pilot_car.html`));
    }

    let allPhones = new Set();
    const phoneRegex = /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

    const linksArray = Array.from(stateLinks);
    console.log(`[+] Firing parallel scraping on ${linksArray.length} state pages...`);
    
    // Batch process to avoid instant rate limiting
    const batchSize = 10;
    for (let i = 0; i < linksArray.length; i += batchSize) {
        const batch = linksArray.slice(i, i + batchSize);
        await Promise.allSettled(batch.map(async (link) => {
            try {
                const stateHtml = await fetchText(BASE_URL + link);
                const phones = stateHtml.match(phoneRegex) || [];
                for (const p of phones) {
                    const norm = normalize(p);
                    if (valid(norm)) allPhones.add(norm);
                }
            } catch (e) {}
        }));
        process.stdout.write(`\rScanned ${Math.min(i + batchSize, linksArray.length)}/${linksArray.length} states (${allPhones.size} phones found)... `);
    }

    console.log("\n[+] Total Scraped Distinct Pilot Cars: " + allPhones.size);
    console.log(`[+] Deduplicating against Haul Command OS tables...`);

    let existing = new Set();
    for (const table of ['provider_directory', 'hc_public_operators', 'hc_real_operators', 'directory_listings']) {
        const { data, error } = await supabase.from(table).select('phone').not('phone', 'is', null).limit(10000);
        if (data) data.forEach(row => row.phone && existing.add(normalize(row.phone)));
    }

    let overlaps = 0;
    let newEntries = [];
    Array.from(allPhones).forEach(p => existing.has(p) ? overlaps++ : newEntries.push(p));

    console.log(`\n=================================================`);
    console.log(`📡 TOTAL DEDUPLICATION REPORT (uspilotcars.com)`);
    console.log(`=================================================`);
    console.log(`Total Scraped Web Phones:       ${allPhones.size}`);
    console.log(`Total In HC Database:           ${existing.size}`);
    console.log(`Duplicates (Already tracking):  ${overlaps}`);
    console.log(`🔥 TOTAL NET-NEW GAINED:        ${newEntries.length}`);
    console.log(`=================================================`);
}

run();
