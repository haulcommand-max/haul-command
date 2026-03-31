const fs = require('fs');
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

function formatPhoneDisplay(digits) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
}

function createSlug(baseStr, stateStr, phoneStr) {
    const safeStr = baseStr.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0,30);
    const safeState = stateStr.toLowerCase().replace(/[^a-z]/g, '').slice(0,2);
    return `hc-${safeStr}-${safeState}-${phoneStr.slice(0,5)}-claim`;
}

function parseTextDump() {
    const raw = fs.readFileSync('raw_operators.txt', 'utf-8');
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l);
    
    let operators = [];
    const phoneRegex = /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const phoneMatch = line.match(phoneRegex);
        
        if (phoneMatch) {
            const phoneStr = phoneMatch[0];
            const norm = normalize(phoneStr);
            if (norm.length !== 10) continue;

            let name = "Independent Escort Service";
            let state = "TX";
            let city = "Regional";
            
            const previousLine = i > 0 && !lines[i-1].match(phoneRegex) ? lines[i-1] : line;
            if (previousLine.includes(',')) {
                const parts = previousLine.split(',');
                if (parts.length >= 2) {
                    state = parts[1].trim().substring(0,2).toUpperCase();
                    city = parts[0].trim().split('|').pop().trim();
                }
            } else {
                name = previousLine.split('|')[0].trim() || name;
            }

            if(name === "Independent Escort Service" || name.length < 4) {
                name = previousLine.replace(phoneStr, '').replace(/\|/g, '').trim() || name;
            }

            operators.push({
                phone_norm: norm,
                raw_phone: phoneStr,
                name: (name.length > 3 ? name : `Independent Escort ${norm.slice(-4)}`).substring(0,60).replace(/[^a-zA-Z0-9 &]/g, '').trim(),
                state: state.match(/^[A-Z]{2}$/) ? state : 'TX',
                city: (city.length > 2 ? city : 'Regional').substring(0,40).replace(/[^a-zA-Z0-9 ]/g, '').trim(),
                source: 'MANUAL_DUMP'
            });
        }
    }
    return operators;
}

// Scrape US Pilot Cars logs to array (simplified memory read since we know 207 exist)
// We already printed the 373 total phones. Let's merge them!
// To get the 207 scraped ones instantly, we'll re-run the quick scrape (takes < 5 seconds) and inject them!
async function scrapePublic() {
    let allPhones = new Set();
    const phoneRegex = /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    
    const BASE_URL = 'https://uspilotcars.com/';
    const stateLinks = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new_jersey', 'new_mexico', 'new_york', 'north_carolina', 'north_dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode_island', 'south_carolina', 'south_dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west_virginia', 'wisconsin', 'wyoming'];
    
    const batchSize = 10;
    for (let i = 0; i < stateLinks.length; i += batchSize) {
        const batch = stateLinks.slice(i, i + batchSize);
        await Promise.allSettled(batch.map(async (link) => {
            try {
                const res = await fetch(BASE_URL + link + '_pilot_car.html', {
                    headers: { "User-Agent": "Mozilla/5.0" }
                });
                if(res.ok) {
                    const text = await res.text();
                    const phones = text.match(phoneRegex) || [];
                    for(const p of phones) {
                       const norm = normalize(p);
                       if(validPhone(norm)) allPhones.add({phone_norm: norm, state: link.substring(0,2).toUpperCase()});
                    }
                }
            } catch(e) {}
        }));
    }
    return Array.from(allPhones);
}

async function runFullSeeder() {
    console.log(`[+] Executing Master Directory Seed into hc_real_operators...`);

    const parsedOps = parseTextDump();
    console.log(`[+] Manual Dump Generated: ${parsedOps.length}`);
    
    // Attempting quick re-scrape
    const scrapedOps = await scrapePublic();
    console.log(`[+] Web Scrape Generated: ${scrapedOps.length}`);

    // Merge them
    let combined = [...parsedOps];
    
    // Add scraped ops only if phone isn't already in parsedOps
    const parsedSet = new Set(parsedOps.map(o => o.phone_norm));
    for (const s of scrapedOps) {
        if (!parsedSet.has(s.phone_norm)) {
            combined.push({
                phone_norm: s.phone_norm,
                name: "Independent Pilot Car",
                state: s.state,
                city: "Regional",
                source: "uspilotcars.com"
            });
            parsedSet.add(s.phone_norm);
        }
    }

    // Fetch existing to dedupe
    let existingPhones = new Set();
    const { data } = await supabase.from('hc_real_operators').select('phone_e164').not('phone_e164', 'is', null).limit(15000);
    if(data) data.forEach(r => existingPhones.add(normalize(r.phone_e164)));

    let netNew = combined.filter(o => !existingPhones.has(o.phone_norm));

    // Dedupe within batch again just in case
    let finalBatch = [];
    let seen = new Set();
    for (const op of netNew) {
        if (!seen.has(op.phone_norm)) {
            seen.add(op.phone_norm);
            finalBatch.push(op);
        }
    }

    if (finalBatch.length === 0) {
        console.log(`[!] No new profiles to inject.`);
        return;
    }

    console.log(`[+] Mapping ${finalBatch.length} fresh operators to valuable claimable profiles...`);
    
    const insertPayload = finalBatch.map(o => {
        const desc = `⚠️ UNVERIFIED PROFILE ⚠️\nThis ${o.state} operator profile is currently pending verification. If you are the owner, CLAIM this profile to verify your COI, unlock direct broker dispatch, and activate your trust rating mapping.`;

        return {
            slug: createSlug(o.name, o.state, o.phone_norm),
            display_name: `${o.name} [UNCLAIMED]`,
            entity_type: 'pilot_car',
            phone: formatPhoneDisplay(o.phone_norm),
            phone_e164: '+1' + o.phone_norm,
            city: o.city,
            state_code: o.state,
            country_code: 'US',
            source_system: o.source,
            source_table: 'manual_seed',   // Triggers canonical rules
            trust_classification: 'likely_real_unverified',
            evidence_score: 0.10,
            trust_score: 0.10,
            is_public: true,
            claim_status: 'unclaimed',
            description: desc
        };
    });

    const { error, count } = await supabase.from('hc_real_operators').upsert(insertPayload, { onConflict: 'slug' });
    
    if (error) {
        console.error("[-] ❌ Supabase Injection Error:", error.message, error.details);
    } else {
        console.log(`[+] ✅ SUCCESS! Injected ${finalBatch.length} highly-visible profiles to the active map.`);
    }
}

runFullSeeder().catch(console.error);
