
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto'); // Built-in Node module

// 0. Manual Env Loader (No dependencies)
try {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, ''); // Strip quotes
            }
        });
        console.log("Loaded .env.local");
    }
} catch (e) {
    console.warn("Could not load .env.local", e.message);
}

// 1. Setup Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. Make sure .env.local exists or vars are set.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Load URLs
const urlsPath = path.join(__dirname, '../seed/pilot-car-urls.json');
const urls = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));

// Regex Patterns
const PHONE_REGEX = /(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/;
const HOTEL_KEYWORDS = ['hotel', 'motel', 'inn', 'suites', 'lodge', 'resort', 'best western', 'super 8', 'days inn', 'comfort', 'quality', 'holiday', 'hampton', 'mariott', 'wyndham', 'microtel', 'red roof', 'econo', 'travelodge', 'rodeway'];

// 3. Scraper Logic
async function scrapeUrl(url) {
    console.log(`\nScraping: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();

        const entities = {
            providers: [],
            hotels: []
        };

        // Naive cleaning to text lines
        const cleanText = html
            .replace(/<(tr|p|div|br)[^>]*>/gi, '\n')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 2);

        for (let i = 0; i < cleanText.length; i++) {
            const line = cleanText[i];
            const phoneMatch = line.match(PHONE_REGEX);

            if (phoneMatch) {
                const phone = phoneMatch[0];

                // Context Window
                const context = [
                    cleanText[i - 2] || '',
                    cleanText[i - 1] || '',
                    line,
                    cleanText[i + 1] || '',
                    cleanText[i + 2] || ''
                ].join(' ');

                let nameCandidate = (cleanText[i - 1] || line.replace(phone, '').trim()).replace(/[^\w\s&'-]/g, '');
                if (nameCandidate.length < 3) {
                    nameCandidate = (cleanText[i - 2] || "Unknown").replace(/[^\w\s&'-]/g, '');
                }

                const rawLower = context.toLowerCase();
                const isHotel = HOTEL_KEYWORDS.some(k => rawLower.includes(k)) || url.includes('find_a_hotel.html');

                const filename = url.split('/').pop().split('_')[0];
                let fallbackState = 'US';
                if (filename !== 'find') {
                    fallbackState = filename.charAt(0).toUpperCase() + filename.slice(1);
                }

                // Location
                let city = 'Unknown';
                let state = fallbackState;

                // Simple City matcher
                const cityMatch = context.match(/([A-Z][a-zA-Z\s]+),\s?([A-Z]{2})/);
                if (cityMatch) {
                    city = cityMatch[1].trim();
                    state = cityMatch[2].trim();
                }

                if (isHotel) {
                    entities.hotels.push({
                        name: nameCandidate.substring(0, 100),
                        phone: phone,
                        city: city.substring(0, 100),
                        state: state.substring(0, 2),
                        notes: line
                    });
                } else {
                    const equipment = [];
                    if (rawLower.includes('high pole') || rawLower.includes('hi-pole')) equipment.push('High Pole');
                    if (rawLower.includes('chase')) equipment.push('Chase');
                    if (rawLower.includes('lead')) equipment.push('Lead');
                    if (rawLower.includes('survey')) equipment.push('Route Survey');

                    entities.providers.push({
                        name: (nameCandidate || "Pilot Car Service").substring(0, 100),
                        phone: phone,
                        city: city.substring(0, 100),
                        state: fallbackState.substring(0, 50),
                        equipment: equipment
                    });
                }
            }
        }

        // Dedupe
        const uniqueProviders = Array.from(new Map(entities.providers.map(item => [item.phone, item])).values());
        const uniqueHotels = Array.from(new Map(entities.hotels.map(item => [item.phone, item])).values());

        console.log(`   Found ${uniqueProviders.length} Providers, ${uniqueHotels.length} Hotels.`);
        return { providers: uniqueProviders, hotels: uniqueHotels };

    } catch (err) {
        console.error(`   Failed to scrape ${url}:`, err.message);
        return { providers: [], hotels: [] };
    }
}

async function run() {
    console.log("Starting ingestion...");
    let totalProviders = 0;
    let totalHotels = 0;

    for (const url of urls) {
        const data = await scrapeUrl(url);

        if (data.providers.length > 0) {

            // Transform for NEW Schema
            // 1. Providers Table (one row per provider)
            // 2. Contacts Table (one row per provider)

            // Note: We need UUIDs. Simple map: Phone -> UUID
            const providersPayload = [];
            const contactsPayload = [];

            for (const p of data.providers) {
                const providerKey = crypto.randomUUID(); // Generate new ID

                // Providers Table
                providersPayload.push({
                    provider_key: providerKey,
                    name_raw: p.name,
                    name_norm: p.name.toLowerCase().trim(),
                    provider_type: 'pilot_car',
                    source: 'uspilotcars.com',
                    city: p.city,
                    state: p.state,
                    country: 'US',
                    status: 'active',
                    trust_score: 10 // baseline
                });

                // Contacts Table
                contactsPayload.push({
                    provider_key: providerKey,
                    phone_raw: p.phone,
                    phone_e164: '+1' + p.phone.replace(/\D/g, ''), // Naive formatting
                    is_primary: true
                });
            }

            // Batch Upsert
            // Note: Scraped data might duplicate CSV data. We should technically check existence first.
            // But for speed, we'll just insert.

            // Chunking
            for (let i = 0; i < providersPayload.length; i += 50) {
                const pChunk = providersPayload.slice(i, i + 50);
                const cChunk = contactsPayload.slice(i, i + 50);

                // Insert Providers
                const { error: pError } = await supabase.from('providers').upsert(pChunk, { ignoreDuplicates: false });
                // Using non-ignore to overwrite? No ignoreDuplicates: false is default.

                if (pError) console.error("   Provider DB Error:", pError.message);
                else {
                    // Insert Contacts (only if provider insert worked)
                    const { error: cError } = await supabase.from('provider_contacts').insert(cChunk);
                    if (cError) console.error("   Contact DB Error:", cError.message);
                }
            }
            totalProviders += data.providers.length;
        }

        if (data.hotels.length > 0) {
            const rows = data.hotels.map(h => ({
                name: h.name,
                phone_e164: '+1' + h.phone.replace(/\D/g, ''),
                city: h.city,
                state: h.state,
                rate_notes: h.notes.substring(0, 200),
                is_pilot_car_friendly: true,
                metadata: { source: 'uspilotcars_import', url: url }
            }));

            for (let i = 0; i < rows.length; i += 50) {
                const chunk = rows.slice(i, i + 50);
                const { error } = await supabase.from('hotels').upsert(chunk, { ignoreDuplicates: true });
                if (error) console.error("   Hotel DB Error:", error.message);
            }
            totalHotels += data.hotels.length;
        }

        // Random delay 500-1500ms
        await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
    }

    console.log(`\nDone! Imported ${totalProviders} Providers, ${totalHotels} Hotels.`);
}

run();
