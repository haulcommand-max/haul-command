
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const urlsPath = path.join(__dirname, '../seed/pilot-car-urls.json');
const urls = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));

// Regex Patterns
const PHONE_REGEX = /(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/;
const HOTEL_KEYWORDS = ['hotel', 'motel', 'inn', 'suites', 'lodge', 'resort', 'best western', 'super 8', 'days inn', 'comfort', 'quality', 'holiday', 'hampton', 'mariott', 'wyndham', 'microtel', 'red roof', 'econo', 'travelodge', 'rodeway'];

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

        // HEURISTIC: The site likely uses table rows OR distinct blocks.
        // We will scan for *any* text block containing a phone number.

        // 1. Clean HTML roughly to blocks
        // Replace <br>, <tr>, <p>, <div> with newlines to isolate lines
        const cleanText = html
            .replace(/<(tr|p|div|br)[^>]*>/gi, '\n')
            .replace(/<[^>]+>/g, ' ') // strip other tags
            .replace(/&nbsp;/g, ' ')
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 2); // remove empty noise

        // 2. Window Sliding Scraper
        // We look for a line with a phone number. 
        // The name is usually the line(s) before it.
        // The city is usually the line(s) after (or on same line).

        for (let i = 0; i < cleanText.length; i++) {
            const line = cleanText[i];
            const phoneMatch = line.match(PHONE_REGEX);

            if (phoneMatch) {
                const phone = phoneMatch[0];

                // Context Window: Previous 2 lines, Current line, Next 2 lines
                const context = [
                    cleanText[i - 2] || '',
                    cleanText[i - 1] || '',
                    line, // includes phone
                    cleanText[i + 1] || '',
                    cleanText[i + 2] || ''
                ].join(' ');

                const nameCandidate = (cleanText[i - 1] || line.replace(phone, '').trim()).replace(/[^\w\s&'-]/g, '');
                const rawLower = context.toLowerCase();

                // Classification: Is this a Hotel or a Pilot Car?
                const isHotel = HOTEL_KEYWORDS.some(k => rawLower.includes(k));

                // Location Extraction
                const filename = url.split('/').pop().split('_')[0];
                const fallbackState = filename.charAt(0).toUpperCase() + filename.slice(1);

                // Look for City in context
                // Rough match: "City, ST" or just assume context has city
                let city = 'Unknown';
                // Try to find a capitalized word followed by comma? No, often unstructured.
                // Let's rely on the user to clean up data later if needed, or use robust Geo matching if we had a DB.
                // For now, extract "City" if it looks like "Amarillo, TX"
                const cityMatch = context.match(/([A-Z][a-zA-Z\s]+),\s?([A-Z]{2})/);
                if (cityMatch) {
                    city = cityMatch[1].trim();
                }

                if (isHotel) {
                    entities.hotels.push({
                        name: nameCandidate,
                        phone: phone,
                        city: city,
                        state: fallbackState,
                        notes: line // store raw line as notes
                    });
                } else {
                    // Provider
                    const equipment = [];
                    if (rawLower.includes('high pole') || rawLower.includes('hi-pole')) equipment.push('High Pole');
                    if (rawLower.includes('chase')) equipment.push('Chase');
                    if (rawLower.includes('lead')) equipment.push('Lead');
                    if (rawLower.includes('survey')) equipment.push('Route Survey');

                    entities.providers.push({
                        name: nameCandidate || "Pilot Car Service",
                        phone: phone,
                        city: city,
                        state: fallbackState,
                        equipment: equipment
                    });
                }
            }
        }

        // Dedupe by Phone
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

        // Insert Providers
        if (data.providers.length > 0) {
            const rows = data.providers.map(p => ({
                company_name: p.name.substring(0, 100),
                contact_phone_e164: '+1' + p.phone.replace(/\D/g, ''),
                city: p.city,
                state: p.state,
                equipment_tags: p.equipment,
                status: 'unverified'
            }));

            const { error } = await supabase.from('providers').upsert(rows, { onConflict: 'contact_phone_e164', ignoreDuplicates: true });
            if (!error) totalProviders += rows.length;
        }

        // Insert Hotels
        if (data.hotels.length > 0) {
            const rows = data.hotels.map(h => ({
                name: h.name.substring(0, 100),
                phone_e164: '+1' + h.phone.replace(/\D/g, ''),
                city: h.city,
                state: h.state,
                rate_notes: h.notes.substring(0, 200),
                is_pilot_car_friendly: true
            }));

            const { error } = await supabase.from('hotels').upsert(rows, { onConflict: 'phone_e164', ignoreDuplicates: true }); // Need unique constraint on hotels phone? Or just insert
            if (!error) totalHotels += rows.length;
        }

        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\nDone! Imported ${totalProviders} Providers, ${totalHotels} Hotels.`);
}

run();
