
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// --- CONFIG ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase credentials in environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// The user indicated "THE US PILOT CARS HOTEL PHONE NUMBERS LISTINGS"
// Probable URL based on site pattern
const HOTEL_LIST_URL = "https://uspilotcars.com/hotel_phone_numbers.html";

async function scrapeHotels() {
    console.log(`\n🏨 Scraping Hotel List from ${HOTEL_LIST_URL}...`);

    try {
        const res = await fetch(HOTEL_LIST_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        const $ = cheerio.load(html);

        const hotels = [];

        // Find the main data table
        // It usually has headers "STATE", "CITY", "NAME", "PHONE"
        $('table').each((tIdx, table) => {
            const rows = $(table).find('tr');
            if (rows.length < 2) return;

            // Check header
            const headerText = $(rows[0]).text().toUpperCase();
            if (!headerText.includes('CITY') || !headerText.includes('PHONE')) return;

            // Iterate data rows
            rows.each((rIdx, row) => {
                if (rIdx === 0) return; // Skip header

                const cells = $(row).find('td');
                if (cells.length < 4) return;

                // Layout based on user paste:
                // STATE | CITY | NAME | PHONE
                // TX | AMARILLO | ATREA INN | 806-803-2590

                const state = $(cells[0]).text().trim().substring(0, 2).toUpperCase();
                const city = $(cells[1]).text().trim();
                const nameRaw = $(cells[2]).text().trim();
                const phoneRaw = $(cells[3]).text().trim();

                // Extract messy notes from name or phone column if present
                // The paste shows "ATREA INN\nDining, Shopping..." in the Name column
                // and "$45 Pilot Car Rate"

                const nameLines = nameRaw.split('\n').map(l => l.trim()).filter(Boolean);
                const name = nameLines[0]; // First line is likely the name
                const notes = nameLines.slice(1).join('. ');

                if (!name || name === 'NAME') return;

                // Normalize Phone
                const phone_e164 = '+1' + phoneRaw.replace(/\D/g, '');

                hotels.push({
                    name,
                    city,
                    state,
                    phone_e164,
                    rate_notes: notes,
                    is_pilot_car_friendly: true, // It's on the pilot car list
                    metadata: { source_url: HOTEL_LIST_URL }
                });
            });
        });

        console.log(`   ✅ Found ${hotels.length} hotels.`);
        return hotels;

    } catch (err) {
        console.error(`   ❌ Failed to scrape hotels: ${err.message}`);
        return [];
    }
}

async function run() {
    console.log("🛌 Starting Hotel Ingestion...");

    const hotels = await scrapeHotels();
    let totalImported = 0;

    for (const h of hotels) {
        // Upsert based on name + city + state to avoid dupes
        // We don't have a unique constraint on (state, city, name) in schema yet,
        // but we can try to find existing or just insert.
        // Actually, let's look up by name+city+state first or just insert if we want to be lazy.
        // Better: use the `hotels` table schema. `id` is primary key.
        // We'll match on name/city/state logic if possible, or just insert.
        // Since no unique constraint, we might duplicate. 
        // Let's check if it exists first.

        const { data: existing } = await supabase
            .from('hotels')
            .select('id')
            .eq('state', h.state)
            .eq('city', h.city)
            .ilike('name', h.name) // Case insensitive match
            .single();

        if (existing) {
            // Update
            const { error } = await supabase
                .from('hotels')
                .update({
                    phone_e164: h.phone_e164,
                    rate_notes: h.rate_notes,
                    is_pilot_car_friendly: true,
                    updated_at: new Date()
                })
                .eq('id', existing.id);

            if (!error) totalImported++;
        } else {
            // Insert
            const { error } = await supabase.from('hotels').insert({
                name: h.name,
                city: h.city,
                state: h.state,
                phone_e164: h.phone_e164,
                rate_notes: h.rate_notes,
                is_pilot_car_friendly: true
            });

            if (!error) totalImported++;
        }
    }

    console.log(`\n🎉 DONE! Processed ${totalImported} hotels.`);
}

run();
