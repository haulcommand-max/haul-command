const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.production.local' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

function normalizePhone(phone) {
    let d = phone.replace(/\D/g, '');
    if (d.length > 10) d = d.slice(-10);
    return d;
}

function validPhone(digits) {
    return digits.length === 10 && !["800", "888", "877", "866", "855"].includes(digits.substring(0,3));
}

function createSlug(baseStr, stateStr, phoneStr) {
    const safeStr = baseStr.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0,30);
    const safeState = stateStr.toLowerCase().replace(/[^a-z]/g, '').slice(0,5);
    return `hc-operator-${safeStr}-${safeState}-${phoneStr.slice(0,5)}-claim`;
}

// Generates incredibly rich, valuable default placeholders to force claiming.
function synthesizeClaimableProfile(phoneNorm, source, stateParam) {
    
    // Convert 1234567890 -> (123) 456-7890
    const formattedPhone = `(${phoneNorm.slice(0,3)}) ${phoneNorm.slice(3,6)}-${phoneNorm.slice(6)}`;
    
    const state = stateParam ? stateParam.toUpperCase().slice(0,2) : "TX";
    const name = `Unclaimed Pilot Service ${phoneNorm.slice(6)}`;
    
    const description = `⚠️ UNVERIFIED PROFILE ⚠️
This operator is currently sourced from public records (${source}) operating in the ${state} region. 

To the Owner: Your profile is generating traffic but cannot accept direct loads or be ranked in the Haul Command Match Engine until identity is verified. Claim this profile immediately to verify your liability insurance, unlock your Trust Score, and start receiving direct dispatch offers.`;

    return {
        slug: createSlug("independent", state, phoneNorm),
        display_name: name,
        state: state,
        city: 'Regional',
        phone: formattedPhone,
        description: description,
        service_tags: ['Pilot Car', 'Logistics', 'Unverified'],
        coverage_status: 'live', // Puts it live on SEO pages
        source_quality: 'UNSOURCED',
        verified: false // Triggers UI claim funnel
    };
}

async function runFullSeeder() {
    console.log(`[+] Executing Bulk Directory Seed & Claim Injection...`);

    // 1. Read the newly scraped ones from the uspilotcars memory
    // Instead of re-scraping the 373 pages which takes a minute, let's grab the raw text dump first
    const rawText = fs.readFileSync('raw_operators.txt', 'utf-8');
    const phoneRegex = /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    
    const phonesFromText = (rawText.match(phoneRegex) || []).map(normalizePhone).filter(validPhone);
    const uniqueRawPhones = Array.from(new Set(phonesFromText));

    // 2. We'll fetch all existing phones from Supabase to guarantee absolute zero duplicates
    let existingPhones = new Set();
    const { data: currentDir } = await supabase.from('provider_directory').select('phone');
    if(currentDir) currentDir.forEach(r => { if(r.phone) existingPhones.add(normalizePhone(r.phone)) });

    console.log(`[+] Found ${existingPhones.size} existing operators to dedupe against.`);

    // 3. Filter only the brand new ones
    let netNewPhones = uniqueRawPhones.filter(p => !existingPhones.has(p));
    console.log(`[+] Net-New operators to instantly list: ${netNewPhones.length}`);

    if (netNewPhones.length === 0) {
        console.log(`[!] No new profiles to inject.`);
        return;
    }

    // 4. Build array of objects
    const insertPayload = netNewPhones.map(phone => synthesizeClaimableProfile(phone, 'Public Aggregator', 'US'));

    // 5. Blast them to Supabase
    const { error, count } = await supabase.from('provider_directory').upsert(insertPayload, { onConflict: 'slug' });
    
    if (error) {
        console.error("[-] ❌ Supabase Injection Error:", error.message, error.details);
    } else {
        console.log(`[+] ✅ Successfully injected ${netNewPhones.length} rich, LIVE profiles ready for claiming!`);
    }
}

runFullSeeder().catch(console.error);
