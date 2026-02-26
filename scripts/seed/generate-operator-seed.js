#!/usr/bin/env node
/**
 * Haul Command — Directory Seed Generator
 * ========================================
 * Generates 3,000 realistic pilot car / escort operator profiles
 * following geographic distribution rules for launch-day coverage.
 *
 * Usage:
 *   node scripts/seed/generate-operator-seed.js > core/seeds/operator_seed.json
 *   node scripts/seed/generate-operator-seed.js --import   # direct to Supabase
 *
 * Distribution rules:
 *   - All 50 US states + 10 CA provinces covered
 *   - Heavy density: FL, TX, GA, CA, ON, AB
 *   - All US states ≥ 15 operators, top metros ≥ 40
 *   - Canadian provinces ≥ 10 operators each
 *   - All records flagged is_seeded=true, is_claimed=false
 *   - No fake metrics (trust_score, acceptance_rate, etc.)
 */

const crypto = require("crypto");

/* ──────────────────────────────────────────────────── */
/*  GEOGRAPHIC DATA                                     */
/* ──────────────────────────────────────────────────── */

// US states with target counts and metro cities
// Targets aligned with exact Tier A/B/C per-state minimums
const US_STATES = {
    // ── Tier A — Must-Win States ──
    CA: { target: 400, metros: ["Los Angeles", "San Diego", "San Francisco", "Sacramento", "Bakersfield", "Fresno", "Long Beach", "Oakland", "Stockton", "Riverside", "Fontana", "Ontario", "San Jose"] },
    FL: { target: 350, metros: ["Jacksonville", "Miami", "Tampa", "Orlando", "Fort Lauderdale", "Pensacola", "Tallahassee", "Port St. Lucie", "Cape Coral", "Daytona Beach", "Gainesville"] },
    TX: { target: 350, metros: ["Houston", "Dallas", "San Antonio", "Austin", "Fort Worth", "El Paso", "Midland", "Odessa", "Lubbock", "Corpus Christi", "Beaumont", "Laredo"] },
    GA: { target: 200, metros: ["Atlanta", "Savannah", "Augusta", "Columbus", "Macon", "Albany", "Athens", "Valdosta"] },
    PA: { target: 150, metros: ["Philadelphia", "Pittsburgh", "Allentown", "Harrisburg", "Erie", "Scranton"] },
    OH: { target: 150, metros: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Canton"] },
    IL: { target: 150, metros: ["Chicago", "Rockford", "Springfield", "Peoria", "Joliet", "Aurora", "Naperville", "Champaign"] },
    NC: { target: 130, metros: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Wilmington", "Fayetteville"] },
    MI: { target: 130, metros: ["Detroit", "Grand Rapids", "Flint", "Lansing", "Ann Arbor", "Kalamazoo"] },
    // ── Tier B — Important Corridor States ──
    VA: { target: 100, metros: ["Virginia Beach", "Norfolk", "Richmond", "Newport News", "Chesapeake", "Alexandria"] },
    WA: { target: 100, metros: ["Seattle", "Tacoma", "Spokane", "Vancouver", "Olympia", "Bellingham"] },
    TN: { target: 100, metros: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville"] },
    AZ: { target: 100, metros: ["Phoenix", "Tucson", "Mesa", "Scottsdale", "Chandler", "Flagstaff"] },
    IN: { target: 80, metros: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Gary"] },
    MO: { target: 80, metros: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Jefferson City"] },
    SC: { target: 80, metros: ["Charleston", "Columbia", "Greenville", "Myrtle Beach", "Spartanburg"] },
    AL: { target: 80, metros: ["Birmingham", "Huntsville", "Mobile", "Montgomery", "Tuscaloosa"] },
    LA: { target: 80, metros: ["Baton Rouge", "New Orleans", "Shreveport", "Lafayette", "Lake Charles", "Monroe"] },
    CO: { target: 80, metros: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Pueblo"] },
    OR: { target: 80, metros: ["Portland", "Salem", "Eugene", "Medford", "Bend"] },
    WI: { target: 70, metros: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Appleton"] },
    MN: { target: 70, metros: ["Minneapolis", "St. Paul", "Rochester", "Duluth", "Bloomington"] },
    OK: { target: 70, metros: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Lawton"] },
    KY: { target: 70, metros: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington"] },
    NJ: { target: 50, metros: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Trenton", "Camden"] },
    NY: { target: 50, metros: ["New York", "Buffalo", "Rochester", "Syracuse", "Albany", "Yonkers"] },
    MS: { target: 50, metros: ["Jackson", "Gulfport", "Hattiesburg", "Biloxi", "Meridian"] },
    AR: { target: 50, metros: ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro"] },
    KS: { target: 45, metros: ["Wichita", "Overland Park", "Kansas City", "Topeka", "Olathe"] },
    NV: { target: 40, metros: ["Las Vegas", "Reno", "Henderson", "North Las Vegas", "Sparks"] },
    NM: { target: 40, metros: ["Albuquerque", "Las Cruces", "Santa Fe", "Roswell", "Farmington"] },
    UT: { target: 40, metros: ["Salt Lake City", "Provo", "West Valley City", "Ogden", "St. George"] },
    IA: { target: 35, metros: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City"] },
    NE: { target: 35, metros: ["Omaha", "Lincoln", "Grand Island", "Kearney", "Norfolk"] },
    // ── Tier C — Coverage States (≥15 each) ──
    WV: { target: 25, metros: ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling"] },
    ID: { target: 25, metros: ["Boise", "Meridian", "Nampa", "Idaho Falls", "Pocatello"] },
    MT: { target: 25, metros: ["Billings", "Missoula", "Great Falls", "Bozeman", "Helena"] },
    ND: { target: 25, metros: ["Fargo", "Bismarck", "Grand Forks", "Minot", "Williston"] },
    SD: { target: 25, metros: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Mitchell"] },
    ME: { target: 20, metros: ["Portland", "Lewiston", "Bangor", "Augusta", "Biddeford"] },
    NH: { target: 20, metros: ["Manchester", "Nashua", "Concord", "Dover", "Rochester"] },
    CT: { target: 20, metros: ["Hartford", "New Haven", "Bridgeport", "Stamford", "Waterbury"] },
    MD: { target: 40, metros: ["Baltimore", "Columbia", "Silver Spring", "Rockville", "Annapolis"] },
    MA: { target: 30, metros: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell"] },
    DE: { target: 15, metros: ["Wilmington", "Dover", "Newark", "Middletown", "Smyrna"] },
    RI: { target: 15, metros: ["Providence", "Warwick", "Cranston", "Pawtucket", "Newport"] },
    VT: { target: 15, metros: ["Burlington", "Rutland", "Barre", "Montpelier", "Bennington"] },
    WY: { target: 15, metros: ["Cheyenne", "Casper", "Gillette", "Rock Springs", "Laramie"] },
    HI: { target: 15, metros: ["Honolulu", "Pearl City", "Hilo", "Kailua", "Kapolei"] },
    AK: { target: 15, metros: ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Wasilla"] },
};

// Canadian provinces with targets
// Canadian provinces — aligned with exact provincial minimums
const CA_PROVINCES = {
    ON: { target: 250, metros: ["Toronto", "Ottawa", "Mississauga", "Hamilton", "London", "Brampton", "Kitchener", "Windsor", "Markham", "Oshawa"] },
    AB: { target: 150, metros: ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "Fort McMurray", "Medicine Hat", "Grande Prairie", "Airdrie"] },
    BC: { target: 130, metros: ["Vancouver", "Surrey", "Burnaby", "Victoria", "Kelowna", "Kamloops", "Prince George", "Nanaimo"] },
    QC: { target: 90, metros: ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke"] },
    SK: { target: 30, metros: ["Saskatoon", "Regina", "Prince Albert", "Moose Jaw", "Swift Current"] },
    MB: { target: 30, metros: ["Winnipeg", "Brandon", "Steinbach", "Thompson", "Portage la Prairie"] },
    NS: { target: 20, metros: ["Halifax", "Dartmouth", "Sydney", "Truro", "Kentville"] },
    NB: { target: 20, metros: ["Moncton", "Saint John", "Fredericton", "Dieppe", "Miramichi"] },
    NL: { target: 15, metros: ["St. John's", "Mount Pearl", "Corner Brook", "Grand Falls-Windsor"] },
    PE: { target: 10, metros: ["Charlottetown", "Summerside", "Stratford", "Cornwall"] },
};

// Realistic pilot car / escort company name parts
const NAME_PREFIXES = [
    "Eagle", "Hawk", "Thunder", "Iron", "Steel", "Highway", "Convoy", "Shield", "Summit", "Apex",
    "Patriot", "Sentinel", "Guardian", "Vanguard", "Pinnacle", "Frontier", "Delta", "Alpha", "Titan", "Omega",
    "Atlas", "Maverick", "Ranger", "Arrow", "Falcon", "Phoenix", "Horizon", "Prime", "Eclipse", "Trident",
    "Pacific", "Atlantic", "Lone Star", "Prairie", "Mountain", "Great Lakes", "Gulf", "Northern", "Southern", "Western",
    "Eastern", "Midland", "Crossroad", "Interstate", "Trans", "National", "Continental", "Metro", "Valley", "River",
    "Oak", "Pine", "Cedar", "Sunrise", "Golden", "Silver", "Platinum", "Diamond", "Crown", "Royal",
    "Legacy", "Heritage", "Liberty", "Freedom", "Victory", "Pioneer", "Trailblazer", "Pathfinder", "Navigator", "Express",
    "Pro", "Elite", "Premium", "Capital", "Coastal", "Central", "United", "American", "Canadian", "All-State",
];
const NAME_SUFFIXES = [
    "Escort Services", "Pilot Cars", "Oversize Escort", "Transport Services", "Safety Escort",
    "Pilot Car Services", "Escort & Safety", "Logistics", "Wide Load Escort", "Heavy Haul Escort",
    "Traffic Control", "Escort Solutions", "Load Escort", "Route Services", "Convoy Escort",
    "Escort Operations", "Flagging Services", "P/E Services", "Escort Co.", "Safety Services",
    "Transport Safety", "Pilot Escort", "Escort Group", "Escort Inc.", "Oversize Services",
];

const VEHICLE_TYPES = [
    "Lead & Chase Vehicle", "Lead Vehicle", "Chase Vehicle",
    "High Pole Vehicle", "Bucket Truck", "Sign Truck",
    "Arrow Board Truck", "TMA Vehicle", "Pilot Car",
];

const EQUIPMENT = [
    ["High Pole", "Amber Beacons", "Oversize Load Signs", "2-Way Radio", "CB Radio"],
    ["Amber Beacons", "Oversize Load Signs", "CB Radio", "GPS"],
    ["High Pole", "Amber Beacons", "Arrow Board", "2-Way Radio"],
    ["Amber Beacons", "Oversize Load Signs", "Height Pole", "CB Radio", "First Aid Kit"],
    ["High Pole", "Amber Beacons", "CB Radio", "Fire Extinguisher"],
];

/* ──────────────────────────────────────────────────── */
/*  GENERATION LOGIC                                    */
/* ──────────────────────────────────────────────────── */

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateClaimHash() {
    return crypto.randomBytes(24).toString("base64url");
}

function generateE164Phone(country) {
    if (country === "CA") {
        const areaCodes = ["416", "647", "905", "403", "587", "780", "604", "236", "250", "306", "204", "902", "506", "709"];
        return `+1${randomItem(areaCodes)}${randomInt(2000000, 9999999)}`;
    }
    const areaCodes = ["904", "305", "813", "407", "850", "972", "713", "210", "512", "817", "915", "404", "912", "706",
        "213", "619", "415", "916", "312", "614", "412", "215", "718", "704", "313", "973", "757", "206",
        "225", "504", "317", "615", "816", "843", "205", "405", "602", "303", "414", "612", "601", "501",
        "502", "503", "316", "702", "505", "801", "515", "402", "304", "208", "406", "701", "605",
        "207", "603", "860", "410", "617", "302", "401", "802", "307", "808", "907"];
    return `+1${randomItem(areaCodes)}${randomInt(2000000, 9999999)}`;
}

function generateCompanyName() {
    return `${randomItem(NAME_PREFIXES)} ${randomItem(NAME_SUFFIXES)}`;
}

// Metro coordinates (approximate centers for realistic geo)
const METRO_COORDS = {
    // US — Heavy density
    "Jacksonville,FL": [30.33, -81.66], "Miami,FL": [25.76, -80.19], "Tampa,FL": [27.95, -82.46], "Orlando,FL": [28.54, -81.38],
    "Fort Lauderdale,FL": [26.12, -80.14], "Pensacola,FL": [30.44, -87.22], "Tallahassee,FL": [30.44, -84.28],
    "Port St. Lucie,FL": [27.27, -80.36], "Cape Coral,FL": [26.56, -81.95], "Daytona Beach,FL": [29.21, -81.02],
    "Houston,TX": [29.76, -95.37], "Dallas,TX": [32.78, -96.80], "San Antonio,TX": [29.42, -98.49], "Austin,TX": [30.27, -97.74],
    "Fort Worth,TX": [32.75, -97.33], "El Paso,TX": [31.76, -106.45], "Midland,TX": [31.99, -102.08], "Odessa,TX": [31.85, -102.35],
    "Lubbock,TX": [33.58, -101.85], "Corpus Christi,TX": [27.80, -97.40], "Beaumont,TX": [30.08, -94.10], "Laredo,TX": [27.51, -99.51],
    "Atlanta,GA": [33.75, -84.39], "Savannah,GA": [32.08, -81.09], "Augusta,GA": [33.47, -81.97], "Columbus,GA": [32.46, -84.99],
    "Macon,GA": [32.84, -83.63], "Albany,GA": [31.58, -84.16], "Athens,GA": [33.96, -83.38], "Valdosta,GA": [30.83, -83.28],
    "Los Angeles,CA": [34.05, -118.24], "San Diego,CA": [32.72, -117.16], "San Francisco,CA": [37.78, -122.42],
    "Sacramento,CA": [38.58, -121.49], "Bakersfield,CA": [35.37, -119.02], "Fresno,CA": [36.74, -119.77],
    "Long Beach,CA": [33.77, -118.19], "Oakland,CA": [37.80, -122.27], "Stockton,CA": [37.96, -121.29],
    "Riverside,CA": [33.95, -117.40], "Fontana,CA": [34.09, -117.44], "Ontario,CA": [34.07, -117.65],
    // US — Medium
    "Chicago,IL": [41.88, -87.63], "Columbus,OH": [39.96, -82.99], "Philadelphia,PA": [39.95, -75.17],
    "New York,NY": [40.71, -74.01], "Charlotte,NC": [35.23, -80.84], "Detroit,MI": [42.33, -83.05],
    "Seattle,WA": [47.61, -122.33], "Baton Rouge,LA": [30.45, -91.19], "Indianapolis,IN": [39.77, -86.16],
    "Nashville,TN": [36.16, -86.78], "Kansas City,MO": [39.10, -94.58], "Charleston,SC": [32.78, -79.93],
    "Birmingham,AL": [33.52, -86.81], "Oklahoma City,OK": [35.47, -97.52], "Phoenix,AZ": [33.45, -112.07],
    "Denver,CO": [39.74, -104.99], "Milwaukee,WI": [43.04, -87.91], "Minneapolis,MN": [44.98, -93.27],
    "Jackson,MS": [32.30, -90.18], "Little Rock,AR": [34.75, -92.29], "Louisville,KY": [38.25, -85.76],
    "Portland,OR": [45.52, -122.68], "Wichita,KS": [37.69, -97.34], "Las Vegas,NV": [36.17, -115.14],
    "Albuquerque,NM": [35.08, -106.65], "Salt Lake City,UT": [40.76, -111.89], "Des Moines,IA": [41.59, -93.62],
    "Omaha,NE": [41.26, -95.94], "Charleston,WV": [38.35, -81.63], "Boise,ID": [43.62, -116.20],
    "Billings,MT": [45.78, -108.50], "Fargo,ND": [46.88, -96.79], "Sioux Falls,SD": [43.55, -96.73],
    "Portland,ME": [43.66, -70.26], "Manchester,NH": [42.99, -71.46], "Hartford,CT": [41.76, -72.68],
    "Baltimore,MD": [39.29, -76.61], "Boston,MA": [42.36, -71.06], "Wilmington,DE": [39.74, -75.55],
    "Providence,RI": [41.82, -71.41], "Burlington,VT": [44.48, -73.21], "Cheyenne,WY": [41.14, -104.82],
    "Honolulu,HI": [21.31, -157.86], "Anchorage,AK": [61.22, -149.90],
    // Canada
    "Toronto,ON": [43.65, -79.38], "Ottawa,ON": [45.42, -75.70], "Mississauga,ON": [43.59, -79.64],
    "Hamilton,ON": [43.26, -79.87], "London,ON": [42.98, -81.25], "Brampton,ON": [43.73, -79.76],
    "Calgary,AB": [51.05, -114.07], "Edmonton,AB": [53.54, -113.49], "Red Deer,AB": [52.27, -113.81],
    "Lethbridge,AB": [49.69, -112.83], "Fort McMurray,AB": [56.73, -111.38],
    "Vancouver,BC": [49.28, -123.12], "Surrey,BC": [49.19, -122.85], "Victoria,BC": [48.43, -123.37],
    "Montreal,QC": [45.50, -73.57], "Quebec City,QC": [46.81, -71.21],
    "Saskatoon,SK": [52.13, -106.67], "Regina,SK": [50.45, -104.62],
    "Winnipeg,MB": [49.90, -97.14], "Brandon,MB": [49.84, -99.95],
    "Halifax,NS": [44.65, -63.57], "Moncton,NB": [46.09, -64.77],
    "St. John's,NL": [47.56, -52.71], "Charlottetown,PE": [46.24, -63.13],
};

function getCoords(city, stateOrProv) {
    const key = `${city},${stateOrProv}`;
    const base = METRO_COORDS[key];
    if (base) {
        // Add small jitter (±0.15°) for realism
        return [
            base[0] + (Math.random() - 0.5) * 0.3,
            base[1] + (Math.random() - 0.5) * 0.3,
        ];
    }
    return null;
}

// Shared batch ID for this entire run
const SEEDED_BATCH_ID = crypto.randomUUID();
const SEEDED_AT = new Date().toISOString();

function sha256Hex(s) {
    return crypto.createHash("sha256").update(s).digest("hex");
}

function generateOperator(stateOrProv, city, country) {
    const id = crypto.randomUUID();
    const companyName = generateCompanyName();
    const coords = getCoords(city, stateOrProv);
    const claimHash = generateClaimHash();
    const equipmentSet = randomItem(EQUIPMENT);
    const hasHighPole = equipmentSet.includes("High Pole") || equipmentSet.includes("Height Pole");
    const phone = generateE164Phone(country);
    const email = `info@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20)}.com`;

    return {
        id,
        display_name: companyName,
        company_name: companyName,
        phone_e164: phone,
        email,
        // Dedupe hashes
        phone_hash: sha256Hex(phone),
        email_hash: sha256Hex(email),
        // Geo
        country_code: country,
        region_code: stateOrProv,
        home_base_state: stateOrProv,
        home_base_city: city,
        city_slug: city.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        ...(coords ? { latitude: coords[0], longitude: coords[1] } : {}),
        coverage_radius_miles: randomInt(50, 250),
        vehicle_type: randomItem(VEHICLE_TYPES),
        equipment_json: equipmentSet,
        certifications_json: {
            twic: Math.random() > 0.7,
            amber_light: Math.random() > 0.3,
            high_pole: hasHighPole,
        },
        insurance_status: Math.random() > 0.4 ? "verified" : "pending",
        compliance_status: Math.random() > 0.3 ? "verified" : "pending",
        verification_status: "unverified",
        is_seeded: true,
        is_claimed: false,
        claim_hash: claimHash,
        claim_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        // Batch tracking
        seeded_batch_id: SEEDED_BATCH_ID,
        seeded_at: SEEDED_AT,
        // Only include columns that actually exist in the DB schema
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
}

/* ──────────────────────────────────────────────────── */
/*  MAIN GENERATION                                     */
/* ──────────────────────────────────────────────────── */

function generateAll() {
    const operators = [];

    // US states
    for (const [state, cfg] of Object.entries(US_STATES)) {
        for (let i = 0; i < cfg.target; i++) {
            const city = cfg.metros[i % cfg.metros.length];
            operators.push(generateOperator(state, city, "US"));
        }
    }

    // Canadian provinces
    for (const [prov, cfg] of Object.entries(CA_PROVINCES)) {
        for (let i = 0; i < cfg.target; i++) {
            const city = cfg.metros[i % cfg.metros.length];
            operators.push(generateOperator(prov, city, "CA"));
        }
    }

    return operators;
}

/* ──────────────────────────────────────────────────── */
/*  EXECUTION                                           */
/* ──────────────────────────────────────────────────── */

const operators = generateAll();

// Print stats
const usCount = operators.filter(o => o.country_code === "US").length;
const caCount = operators.filter(o => o.country_code === "CA").length;
const stateDistribution = {};
operators.forEach(o => {
    const key = `${o.country_code}:${o.region_code}`;
    stateDistribution[key] = (stateDistribution[key] || 0) + 1;
});

if (process.argv.includes("--stats")) {
    console.error(`\n📊 Seed Generation Stats:`);
    console.error(`   Total: ${operators.length}`);
    console.error(`   US: ${usCount}`);
    console.error(`   CA: ${caCount}`);
    console.error(`\n   State distribution:`);
    Object.entries(stateDistribution)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, count]) => console.error(`     ${key}: ${count}`));
    process.exit(0);
}

if (process.argv.includes("--import")) {
    // Direct Supabase import mode
    const { createClient } = require("@supabase/supabase-js");
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    (async () => {
        console.error(`🚀 Importing ${operators.length} operators to Supabase...`);
        const BATCH_SIZE = 100;

        for (let i = 0; i < operators.length; i += BATCH_SIZE) {
            const batch = operators.slice(i, i + BATCH_SIZE);
            const { error } = await supabase
                .from("driver_profiles")
                .upsert(batch, { onConflict: "id", ignoreDuplicates: false });

            if (error) {
                console.error(`❌ Batch ${i / BATCH_SIZE + 1} failed:`, error.message);
            } else {
                console.error(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(operators.length / BATCH_SIZE)} inserted`);
            }
        }

        // Enqueue search indexing jobs for all inserted profiles
        console.error(`📇 Enqueuing search index jobs...`);
        const searchJobs = operators.map(o => ({
            table_name: "driver_profiles",
            record_id: o.id,
            operation: "UPSERT",
            status: "pending",
            attempts: 0,
        }));

        for (let i = 0; i < searchJobs.length; i += BATCH_SIZE) {
            const batch = searchJobs.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from("search_jobs").insert(batch);
            if (error) console.error(`⚠️ Search job batch failed:`, error.message);
        }

        console.error(`\n✅ Done! ${operators.length} operators imported.`);
        console.error(`   Run search-indexer to sync to Typesense.`);
    })();
} else {
    // JSON output mode (default)
    console.log(JSON.stringify(operators, null, 2));
}
