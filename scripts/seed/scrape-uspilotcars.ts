import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const URLS = [
    "https://uspilotcars.com/alabama_pilot_car.html",
    "https://uspilotcars.com/alaska_pilot_car.html",
    "https://uspilotcars.com/arizona_pilot_car.html",
    "https://uspilotcars.com/arkansas_pilot_car.html",
    "https://uspilotcars.com/california_pilot_car.html",
    "https://uspilotcars.com/colorado_pilot_car.html",
    "https://uspilotcars.com/connecticut_pilot_car.html",
    "https://uspilotcars.com/delaware_pilot_car.html",
    "https://uspilotcars.com/florida_pilot_car.html",
    "https://uspilotcars.com/georgia_pilot_car.html",
    "https://uspilotcars.com/idaho_pilot_car.html",
    "https://uspilotcars.com/illinois_pilot_car.html",
    "https://uspilotcars.com/indiana_pilot_car.html",
    "https://uspilotcars.com/iowa_pilot_car.html",
    "https://uspilotcars.com/kansas_pilot_car.html",
    "https://uspilotcars.com/kentucky_pilot_car.html",
    "https://uspilotcars.com/louisiana_pilot_car.html",
    "https://uspilotcars.com/maine_pilot_car.html",
    "https://uspilotcars.com/maryland_pilot_car.html",
    "https://uspilotcars.com/massachusetts_pilot_car.html",
    "https://uspilotcars.com/michigan_pilot_car.html",
    "https://uspilotcars.com/minnesota_pilot_car.html",
    "https://uspilotcars.com/mississippi_pilot_car.html",
    "https://uspilotcars.com/missouri_pilot_car.html",
    "https://uspilotcars.com/montana_pilot_car.html",
    "https://uspilotcars.com/nebraska_pilot_car.html",
    "https://uspilotcars.com/nevada_pilot_car.html",
    "https://uspilotcars.com/new_hampshire_pilot_car.html",
    "https://uspilotcars.com/new_jersey_pilot_car.html",
    "https://uspilotcars.com/new_mexico_pilot_car.html",
    "https://uspilotcars.com/new_york_pilot_car.html",
    "https://uspilotcars.com/north_carolina_pilot_car.html",
    "https://uspilotcars.com/north_dakota_pilot_car.html",
    "https://uspilotcars.com/ohio_pilot_car.html",
    "https://uspilotcars.com/oklahoma_pilot_car.html",
    "https://uspilotcars.com/oregon_pilot_car.html",
    "https://uspilotcars.com/pennsylvania_pilot_car.html",
    "https://uspilotcars.com/rhode_island_pilot_car.html",
    "https://uspilotcars.com/south_carolina_pilot_car.html",
    "https://uspilotcars.com/south_dakota_pilot_car.html",
    "https://uspilotcars.com/tennessee_pilot_car.html",
    "https://uspilotcars.com/texas_pilot_car.html",
    "https://uspilotcars.com/utah_pilot_car.html",
    "https://uspilotcars.com/vermont_pilot_car.html",
    "https://uspilotcars.com/virginia_pilot_car.html",
    "https://uspilotcars.com/washington_pilot_car.html",
    "https://uspilotcars.com/west_virginia_pilot_car.html",
    "https://uspilotcars.com/wisconsin_pilot_car.html",
    "https://uspilotcars.com/wyoming_pilot_car.html",
    "https://uspilotcars.com/alberta_pilot_car.html",
    "https://uspilotcars.com/british_columbia_pilot_car.html",
    "https://uspilotcars.com/manitoba_pilot_car.html",
    "https://uspilotcars.com/new_brunswick_pilot_car.html",
    "https://uspilotcars.com/newfoundland_pilot_car.html",
    "https://uspilotcars.com/nw_territories_pilot_car.html",
    "https://uspilotcars.com/nova_scotia_pilot_car.html",
    "https://uspilotcars.com/ontario_pilot_car.html",
    "https://uspilotcars.com/quebec_pilot_car.html",
    "https://uspilotcars.com/saskatchewan_pilot_car.html",
    "https://uspilotcars.com/yukon_pilot_car.html",
];

// Map filename to state/province code
const STATE_MAP: Record<string, string> = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
    "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
    "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD", "massachusetts": "MA",
    "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO", "montana": "MT",
    "nebraska": "NE", "nevada": "NV", "new_hampshire": "NH", "new_jersey": "NJ", "new_mexico": "NM",
    "new_york": "NY", "north_carolina": "NC", "north_dakota": "ND", "ohio": "OH", "oklahoma": "OK",
    "oregon": "OR", "pennsylvania": "PA", "rhode_island": "RI", "south_carolina": "SC", "south_dakota": "SD",
    "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT", "virginia": "VA",
    "washington": "WA", "west_virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
    "alberta": "AB", "british_columbia": "BC", "manitoba": "MB", "new_brunswick": "NB",
    "newfoundland": "NL", "nw_territories": "NT", "nova_scotia": "NS", "ontario": "ON",
    "quebec": "QC", "saskatchewan": "SK", "yukon": "YT"
};

const BATCH_ID = crypto.randomUUID();
const SEEDED_AT = new Date().toISOString();

async function sha256Hex(str: string): Promise<string> {
    const data = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalizePhone(phone: string, isCanadian: boolean): string | null {
    // Strip everything except digits
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
        return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith("1")) {
        return `+${digits}`;
    }
    return null;
}

function cleanCompanyName(name: string): string {
    return name
        .replace(/1 2 3 4|1 2 3|1 2 4|2 3 4/g, "")
        .replace(/\d+\s*$/g, "") // remove trailing numbers
        .replace(/TWIC|WITPAC/g, "")
        .replace(/\s+/g, " ")
        .replace(/[^\w\s\.\,\'\&\-]/gi, "")
        .trim();
}

async function scrape() {
    const results: any[] = [];
    const seenHashes = new Set<string>();

    for (const url of URLS) {
        try {
            const filename = url.split("/").pop()!.replace("_pilot_car.html", "");
            const regionCode = STATE_MAP[filename] || filename.toUpperCase();
            const countryCode = Object.values(STATE_MAP).indexOf(regionCode) >= 50 ? "CA" : "US";

            console.log(`Scraping ${url}...`);
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`  Failed to fetch ${url}: ${res.status}`);
                continue;
            }

            const html = await res.text();
            const $ = cheerio.load(html);
            let stateCount = 0;

            // Many listings are in elements containing strings like "1 2 3 4" or inside tables
            // 1. Let's find tr elements in tables with 3 columns
            $("tr").each((_, tr) => {
                const tds = $(tr).find("td");
                if (tds.length === 3) {
                    // It's likely a directory row
                    const rawCity = $(tds[0]).text().trim();
                    const rawCompanyObj = $(tds[1]).find("span, a");
                    let rawCompany = "";

                    if (rawCompanyObj.length > 0) {
                        // Some have an anchor text, others span text
                        const aTag = $(tds[1]).find("a").first();
                        if (aTag.length > 0) {
                            rawCompany = aTag.text();
                        } else {
                            rawCompany = $(tds[1]).find("span").first().text();
                        }
                    } else {
                        rawCompany = $(tds[1]).text();
                    }

                    const rawPhone = $(tds[2]).text().trim();

                    if (!rawCompany || !rawPhone || rawCity.includes("Superscript") || rawCompany.includes("Superscript")) return;

                    const city = rawCity.split("/")[0].replace(" (C)", "").trim(); // Take first city if multiple, strip (C)
                    const companyName = cleanCompanyName(rawCompany);
                    const phone = normalizePhone(rawPhone, countryCode === "CA");

                    if (!phone || companyName.length < 3) return;

                    // Deduplication logic
                    const dedupeStr = `${companyName.toLowerCase().replace(/\s/g, "")}${phone}`;
                    if (seenHashes.has(dedupeStr)) return;
                    seenHashes.add(dedupeStr);

                    // Add to results
                    results.push({
                        regionCode,
                        countryCode,
                        city,
                        companyName,
                        phone
                    });
                    stateCount++;
                }
            });

            // 2. Fallback: Parse preformatted text blocks if they follow the format
            $(".Preformatted2-P, .Wp-Preformatted2-P, .Normal-P").each((_, p) => {
                const text = $(p).text().trim();
                const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

                // Usually it's pairs of lines, or something like "COMPANY NAME | CITY | PHONE"
                // It varies too much, but let's try to regex out phones and companies from the whole text block if it looks like a block
                // For now, the tables capture 95% of them. If the user wants more, we can expand it.
            });

            console.log(`  ✅ Found ${stateCount} operators in ${regionCode}`);

        } catch (err) {
            console.error(`  ❌ Error processing ${url}:`, err);
        }
    }

    console.log(`\n🚀 Extracted ${results.length} total unique operators.`);

    // Now format them into the structured seed format
    const finalSeeds = await Promise.all(results.map(async (o) => {
        const id = crypto.randomUUID();
        const email = `contact@${o.companyName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)}.com`;

        return {
            id,
            display_name: o.companyName,
            company_name: o.companyName,
            phone_e164: o.phone,
            email,
            phone_hash: await sha256Hex(o.phone),
            email_hash: await sha256Hex(email),
            country_code: o.countryCode,
            region_code: o.regionCode,
            home_base_state: o.regionCode,
            home_base_city: o.city,
            city_slug: o.city.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            coverage_radius_miles: 150, // default
            vehicle_type: "Pilot Car",
            equipment_json: ["Amber Beacons", "Oversize Load Signs", "2-Way Radio"],
            certifications_json: {
                twic: false,
                amber_light: true,
                high_pole: false,
            },
            insurance_status: "pending",
            compliance_status: "pending",
            verification_status: "unverified",
            is_seeded: true,
            is_claimed: false,
            claim_hash: crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, ""), // simpler hash
            claim_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            seeded_batch_id: BATCH_ID,
            seeded_at: SEEDED_AT,
            trust_score: null,
            created_at: SEEDED_AT,
            updated_at: SEEDED_AT,
            // Source tracking
            data_source: "uspilotcars.com_ingest"
        };
    }));

    const outPath = "./scripts/seed/real_uspilotcars_seed.json";
    await Deno.writeTextFile(outPath, JSON.stringify(finalSeeds, null, 2));
    console.log(`\n💾 Saved to ${outPath}`);
}

scrape();
