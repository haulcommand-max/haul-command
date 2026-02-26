
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

// State URLs provided by user
const STATE_URLS = [
    "https://uspilotcars.com/alabama_truck_stops.html",
    "https://uspilotcars.com/alaska_truck_stops.html",
    "https://uspilotcars.com/arizona_truck_stops.html",
    "https://uspilotcars.com/arkansas_truck_stops.html",
    "https://uspilotcars.com/california_truck_stops.html",
    "https://uspilotcars.com/colorado_truck_stops.html",
    "https://uspilotcars.com/connecticut_truck_stops.html",
    "https://uspilotcars.com/delaware_truck_stops.html",
    "https://uspilotcars.com/florida_truck_stops.html",
    "https://uspilotcars.com/georgia_truck_stops.html",
    "https://uspilotcars.com/idaho_truck_stops.html",
    "https://uspilotcars.com/illinois_truck_stops.html",
    "https://uspilotcars.com/indiana_truck_stops.html",
    "https://uspilotcars.com/iowa_truck_stops.html",
    "https://uspilotcars.com/kansas_truck_stops.html",
    "https://uspilotcars.com/kentucky_truck_stops.html",
    "https://uspilotcars.com/louisiana_truck_stops.html",
    "https://uspilotcars.com/maine_truck_stops.html",
    "https://uspilotcars.com/maryland_truck_stops.html",
    "https://uspilotcars.com/massachusetts_truck_stops.html",
    "https://uspilotcars.com/michigan_truck_stops.html",
    "https://uspilotcars.com/minnesota_truck_stops.html",
    "https://uspilotcars.com/mississippi_truck_stops.html",
    "https://uspilotcars.com/missouri_truck_stops.html",
    "https://uspilotcars.com/montana_truck_stops.html",
    "https://uspilotcars.com/nebraska_truck_stops.html",
    "https://uspilotcars.com/nevada_truck_stops.html",
    "https://uspilotcars.com/new_hampshire_truck_stops.html",
    "https://uspilotcars.com/new_jersey_truck_stops.html",
    "https://uspilotcars.com/new_mexico_truck_stops.html",
    "https://uspilotcars.com/new_york_truck_stops.html",
    "https://uspilotcars.com/north_carolina_truck_stops.html",
    "https://uspilotcars.com/north_dakota_truck_stops.html",
    "https://uspilotcars.com/ohio_truck_stops.html",
    "https://uspilotcars.com/oklahoma_truck_stops.html",
    "https://uspilotcars.com/oregon_truck_stops.html",
    "https://uspilotcars.com/pennsylvania_truck_stops.html",
    "https://uspilotcars.com/rhode_island_truck_stops.html",
    "https://uspilotcars.com/south_carolina_truck_stops.html",
    "https://uspilotcars.com/south_dakota_truck_stops.html",
    "https://uspilotcars.com/tennessee_truck_stops.html",
    "https://uspilotcars.com/texas_truck_stops.html",
    "https://uspilotcars.com/utah_truck_stops.html",
    "https://uspilotcars.com/vermont_truck_stops.html",
    "https://uspilotcars.com/virginia_truck_stops.html",
    "https://uspilotcars.com/washington_truck_stops.html",
    "https://uspilotcars.com/west_virginia_truck_stops.html",
    "https://uspilotcars.com/wisconsin_truck_stops.html",
    "https://uspilotcars.com/wyoming_truck_stops.html"
];

async function scrapeState(url) {
    const stateMatch = url.match(/([a-z_]+)_truck_stops\.html/);
    const stateSlug = stateMatch ? stateMatch[1] : 'unknown';
    const stateCode = stateSlug.replace(/_/g, ' ').toUpperCase().substring(0, 2); // Approximation, usually 2-letter code is better derived or passed. 
    // Map full state names to 2-letter codes if needed, but for now we'll store the slug or rough abbrev.
    // Actually, better to use the state name for now and we can normalize later.

    console.log(`\n🔍 Scraping ${stateSlug} from ${url}...`);

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        const $ = cheerio.load(html);

        const stops = [];

        // Find the main data table
        // It usually has multiple rows and specific headers "CITY", "HWY", "NAME", etc.
        $('table').each((tIdx, table) => {
            const rows = $(table).find('tr');
            if (rows.length < 2) return; // Skip small tables

            // Check header
            const headerText = $(rows[0]).text().toUpperCase();
            if (!headerText.includes('CITY') || !headerText.includes('NAME')) return;

            // Iterate data rows
            rows.each((rIdx, row) => {
                if (rIdx === 0) return; // Skip header

                const cells = $(row).find('td');
                if (cells.length < 5) return; // Skip invalid rows

                // Layout seems to be:
                // 0: CITY
                // 1: HWY / ADDRESS
                // 2: NAME
                // 3: WIFI (Y/N)
                // 4: PARK (Count)
                // 5: SHOWER (Count/Y/N)
                // 6: SCALE (Y/N)

                const city = $(cells[0]).text().trim();
                const address = $(cells[1]).text().trim();
                const name = $(cells[2]).text().trim();

                // Skip empty rows
                if (!name || name === 'NAME') return;

                const wifiRaw = $(cells[3]).text().trim().toUpperCase();
                const parkingRaw = $(cells[4]).text().trim();
                const showerRaw = $(cells[5]).text().trim().toUpperCase(); // Sometimes numbers
                const scaleRaw = $(cells[6]).text().trim().toUpperCase();

                // Parse Attributes
                const has_wifi = wifiRaw.includes('Y');
                const parking_spots = parseInt(parkingRaw.replace(/\D/g, '')) || 0;
                const has_showers = showerRaw.includes('Y') || /\d/.test(showerRaw);
                const has_scales = scaleRaw.includes('Y');

                stops.push({
                    name,
                    address,
                    city,
                    state: stateSlug.toUpperCase(), // Using full slug upper for now
                    has_wifi,
                    parking_spots,
                    has_showers,
                    has_scales,
                    source_url: url
                });
            });
        });

        console.log(`   ✅ Found ${stops.length} candidates.`);
        return stops;

    } catch (err) {
        console.error(`   ❌ Failed to scrape ${stateSlug}: ${err.message}`);
        return [];
    }
}

async function run() {
    console.log("🚛 Starting Truck Stop Ingestion...");

    let totalImported = 0;

    for (const url of STATE_URLS) {
        const stops = await scrapeState(url);

        // Batch upsert
        for (const stop of stops) {
            const { data, error } = await supabase
                .from('truck_stops')
                .upsert({
                    name: stop.name,
                    address: stop.address,
                    city: stop.city,
                    state: stop.state,
                    has_wifi: stop.has_wifi,
                    parking_spots: stop.parking_spots,
                    has_showers: stop.has_showers,
                    has_scales: stop.has_scales,
                    source_url: stop.source_url
                }, { onConflict: 'state,name,city' });

            if (error) {
                // console.error(`   ⚠️ DB Error for ${stop.name}:`, error.message);
            } else {
                totalImported++;
            }
        }
    }

    console.log(`\n🎉 DONE! Imported ${totalImported} truck stops.`);
}

run();
