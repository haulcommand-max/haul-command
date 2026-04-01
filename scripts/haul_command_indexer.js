const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config({ path: '.env.local' }); // Read from your root .env.local securely

// Load Service Role Key for Admin injection
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('FATAL: Missing Supabase credentials. Ensure .env.local exists.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// The Core Taxonomies based on the 50x strategy (All 46 categories)
const TARGETS = [
  { id: 109, tag: "auto_repair" },
  { id: 96, tag: "axle_repairs" },
  { id: 104, tag: "body_shop" },
  { id: 117, tag: "cartage_moves" },
  { id: 93, tag: "cat_scale_locations" },
  { id: 71, tag: "cb_shops" },
  { id: 86, tag: "chrome_shops" },
  { id: 79, tag: "environmental_clean_up" },
  { id: 78, tag: "fast_food_with_truck_parking" },
  { id: 88, tag: "garages_shops" },
  { id: 123, tag: "glass_repair_sales" },
  { id: 103, tag: "hydraulics" },
  { id: 99, tag: "load_storage_cold_or_dry" },
  { id: 106, tag: "lock_out_services" },
  { id: 113, tag: "mobile_fueling" },
  { id: 70, tag: "mobile_truck_trailer_repair" },
  { id: 73, tag: "motels_with_truck_parking_specials" },
  { id: 31, tag: "oil_and_lube" },
  { id: 122, tag: "oil_supplies_delivery" },
  { id: 101, tag: "parts" },
  { id: 27, tag: "pilot_car_companies" },
  { id: 92, tag: "pilot_car_services_insurance_permits" },
  { id: 81, tag: "reefer_repairs" },
  { id: 26, tag: "rest_areas" },
  { id: 72, tag: "restaurants_with_truck_parking" },
  { id: 75, tag: "rv_repair" },
  { id: 95, tag: "secure_storage" },
  { id: 107, tag: "secure_trailer_drop_yard_parking" },
  { id: 128, tag: "spill_response" },
  { id: 25, tag: "state_weigh_stations" },
  { id: 28, tag: "tire_repair_sales" },
  { id: 29, tag: "towing_wrecker_service" },
  { id: 33, tag: "trailer_wash" },
  { id: 105, tag: "trailer_tanker_wash_out" },
  { id: 68, tag: "transportation_brokers" },
  { id: 87, tag: "truck_trailer_dealers" },
  { id: 30, tag: "truck_trailer_repair" },
  { id: 98, tag: "truck_driving_jobs" },
  { id: 111, tag: "truck_insurance" },
  { id: 94, tag: "truck_salvage" },
  { id: 19, tag: "truck_stops" },
  { id: 32, tag: "truck_wash" },
  { id: 97, tag: "trucker_supplies_acces_safety_equip" },
  { id: 23, tag: "wal_marts_with_truck_parking" },
  { id: 112, tag: "wal_marts_without_truck_parking" },
  { id: 82, tag: "welding" }
];

// For testing purposes, we start with State 1 (Alabama). 
// When ready to 50x, we change this to loop from 1 to 50.
const STATES_TO_SCRAPE = Array.from({length: 50}, (_, i) => i + 1); 

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           
    .replace(/[^\w\-]+/g, '')       
    .replace(/\-\-+/g, '-')         
    .replace(/^-+/, '')             
    .replace(/-+$/, '');            
}

async function scrapeDirectory(id, state, tag) {
    const url = `https://www.truckstopsandservices.com/listcatbusinesses.php?id=${id}&state=${state}`;
    console.log(`\n[🔎] Scrubbing Deep Level ID: ${id} State: ${state} at ${url}`);
    
    try {
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        let $ = cheerio.load(data);
        const leads = [];
        
        const detailLinks = [];
        $("#locTable tbody tr").each((i, el) => {
            const href = $(el).find("a").attr("href");
            if (href && href.includes('location_details.php')) {
                detailLinks.push(`https://www.truckstopsandservices.com/${href}`);
            }
        });
        
        console.log(`[🔗] Found ${detailLinks.length} listings. Extracting Deep Links for ${tag}...`);

        for (const link of detailLinks) {
            try {
                const { data: detailData } = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const $$ = cheerio.load(detailData);
                
                const name = $$("h1.locdetupper").text().trim();
                let phone = null;
                let stateCode = "XX";
                
                $$(".locdetinfo").each((i, el) => {
                    const text = $$(el).text();
                    if (text.includes('Phone:')) phone = text.replace('Phone:', '').trim();
                    if (text.includes('State:')) stateCode = text.replace('State:', '').trim();
                });
                
                if (name && phone) {
                    leads.push({
                        display_name: name,
                        slug: slugify(`${name}-${stateCode}`).substring(0, 50),
                        city: 'Unknown',
                        state: stateCode,
                        phone: phone,
                        service_tag: tag
                    });
                }
            } catch(e) {
                console.error(`Error fetching detail: ${link}`, e.message);
            }
        }
        return leads;
    } catch(e) {
        console.error("Error scraping:", e.message);
        return [];
    }
}

async function injectOrUpdate(lead) {
    // 🛡️ PHASE 1: READ DEEP LEVELS (Check Supabase before making a decision)
    const { data: existing, error: searchError } = await supabase
        .from('hc_discovery_entities')
        .select('*')
        .eq('company_name', lead.display_name)
        .eq('state', lead.state)
        .maybeSingle();

    if (searchError) {
        console.error(`Database error reading ${lead.slug}:`, searchError.message);
        return;
    }

    if (existing) {
        // 🚀 PHASE 2: UPGRADE, NEVER DOWNGRADE
        let currentTags = existing.industry_type || '';
        if (!currentTags.includes(lead.service_tag)) {
            currentTags = currentTags ? `${currentTags},${lead.service_tag}` : lead.service_tag;
            
            const updates = { 
                industry_type: currentTags,
                updated_at: new Date().toISOString()
            };

            await supabase.from('hc_discovery_entities').update(updates).eq('id', existing.id);
            console.log(`[⬆️] UPGRADED: ${lead.display_name} (Added tag: ${lead.service_tag})`);
        } else {
            console.log(`[✔] SKIP: ${lead.display_name} already strictly categorized with ${lead.service_tag}`);
        }
    } else {
        // 🚀 PHASE 3: INSERT NEW ENTITY
        const newRecord = {
            company_name: lead.display_name,
            city: lead.city,
            state: lead.state,
            phone: lead.phone,
            industry_type: lead.service_tag,
            country_code: 'US',
            registry_source: 'directory_truckstopsandservices'
        };

        const { error: insertError } = await supabase.from('hc_discovery_entities').insert(newRecord);
        if (insertError) {
            console.error(`[❌] ERROR INSERTING ${lead.display_name}:`, insertError.message);
        } else {
            console.log(`[🚀] INJECTED: ${lead.display_name}`);
        }
    }
}

async function startEngine() {
    console.log("=================================================");
    console.log(" = HAUL COMMAND OS: MASS DIRECTORY INDEXER = ");
    console.log("=================================================");

    const promises = TARGETS.map(async (target) => {
        for (const stateId of STATES_TO_SCRAPE) {
            const leads = await scrapeDirectory(target.id, stateId, target.tag);
            console.log(`[${target.tag} | State ${stateId}] Found ${leads.length} entities. Beginning Autonomous Injection...`);
            
            for (const lead of leads) {
                await injectOrUpdate(lead);
            }
        }
    });

    await Promise.all(promises);

    console.log("\n=================================================");
    console.log(" SYSTEM INJECTION COMPLETE");
    console.log("=================================================");
}

startEngine();
