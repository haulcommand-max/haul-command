/**
 * Batch Geocoding Script
 * Geocodes directory_listings that are missing latitude/longitude.
 * Uses OpenStreetMap Nominatim (free, no API key) with rate limiting.
 * 
 * Usage: node scripts/batch-geocode.js [--limit 500] [--dry-run]
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const RATE_LIMIT_MS = 1100; // Nominatim requires max 1 req/sec

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function geocode(city, region, country) {
    const parts = [city, region, country].filter(Boolean).join(", ");
    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(parts)}&format=json&limit=1&countrycodes=${(country || "").toLowerCase()}`;

    try {
        const res = await fetch(url, {
            headers: { "User-Agent": "HaulCommand-Geocoder/1.0 (admin@haulcommand.com)" },
        });
        if (!res.ok) return null;

        const data = await res.json();
        if (data.length === 0) return null;

        return {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
            display_name: data[0].display_name,
        };
    } catch (err) {
        console.error(`  ✗ Geocode error for "${parts}":`, err.message);
        return null;
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    const args = process.argv.slice(2);
    const limit = parseInt(args[args.indexOf("--limit") + 1]) || 500;
    const dryRun = args.includes("--dry-run");

    console.log(`\n🌍 Batch Geocoder — ${dryRun ? "DRY RUN" : "LIVE"} — limit: ${limit}\n`);

    // Fetch listings missing coordinates
    const { data: listings, error } = await supabase
        .from("directory_listings")
        .select("id, name, city, region_code, country_code")
        .or("latitude.is.null,longitude.is.null")
        .order("rank_score", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("DB error:", error.message);
        process.exit(1);
    }

    console.log(`Found ${listings.length} listings missing coordinates\n`);

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];
        const city = listing.city;
        const region = listing.region_code;
        const country = listing.country_code;

        if (!city && !region) {
            skipped++;
            continue;
        }

        const result = await geocode(city, region, country);

        if (result) {
            if (!dryRun) {
                const { error: updateError } = await supabase
                    .from("directory_listings")
                    .update({ latitude: result.latitude, longitude: result.longitude })
                    .eq("id", listing.id);

                if (updateError) {
                    console.error(`  ✗ Update failed for ${listing.name}: ${updateError.message}`);
                    failed++;
                } else {
                    success++;
                }
            } else {
                success++;
            }
            console.log(
                `  [${i + 1}/${listings.length}] ✓ ${listing.name} → ${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`
            );
        } else {
            failed++;
            console.log(`  [${i + 1}/${listings.length}] ✗ ${listing.name} (${city}, ${region}, ${country}) — no result`);
        }

        // Rate limit
        await sleep(RATE_LIMIT_MS);
    }

    console.log(`\n${"═".repeat(50)}`);
    console.log(`✅ Geocoded: ${success}`);
    console.log(`❌ Failed:   ${failed}`);
    console.log(`⏭  Skipped:  ${skipped}`);
    console.log(`${"═".repeat(50)}\n`);

    if (dryRun) {
        console.log("💡 Run without --dry-run to apply changes");
    }
}

main().catch(console.error);
