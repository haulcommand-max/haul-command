require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CA_PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

function getCountry(stateCode) {
    if (CA_PROVINCES.includes(stateCode)) return 'CA';
    return 'US'; // default for others for now
}

function generateSlug(name, state) {
    return (name + '-' + (state || 'us')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 80);
}

// Maps source tag to entity_type and target table
const TAG_MAPPING = {
    'pilot_car_services': { table: 'directory_listings', type: 'operator' },
    'pilot_car_companies': { table: 'directory_listings', type: 'operator' },
    'mobile_truck_trailer_repair': { table: 'directory_listings', type: 'operator' },
    'mobile_trailer_repair': { table: 'directory_listings', type: 'operator' },
    'auto_repair': { table: 'directory_listings', type: 'operator' },
    'axle_repairs': { table: 'directory_listings', type: 'operator' },
    'body_shop': { table: 'directory_listings', type: 'operator' },
    'hydraulics': { table: 'directory_listings', type: 'operator' },
    'glass_repair_sales': { table: 'directory_listings', type: 'operator' },
    'reefer_repairs': { table: 'directory_listings', type: 'operator' },
    'truck_trailer_repair': { table: 'directory_listings', type: 'operator' },
    'garage_shop': { table: 'directory_listings', type: 'operator' },
    'garages_shops': { table: 'directory_listings', type: 'operator' },
    'welding': { table: 'directory_listings', type: 'operator' },
    'towing_wrecker_service': { table: 'directory_listings', type: 'operator' },
    'transportation_brokers': { table: 'directory_listings', type: 'operator' },
    'pilot_car_services_insurance_permits': { table: 'directory_listings', type: 'operator' },
    
    'truck_stops': { table: 'hc_places', type: 'truck_stop' },
    'truck_stop': { table: 'hc_places', type: 'truck_stop' },
    'secure_storage': { table: 'hc_places', type: 'terminal' },
    'secure_drop_yard': { table: 'hc_places', type: 'terminal' },
    'secure_trailer_drop_yard_parking': { table: 'hc_places', type: 'terminal' },
    'motels_with_truck_parking_specials': { table: 'hc_places', type: 'hotel' },
    'truck_trailer_dealers': { table: 'hc_places', type: 'heavy_equipment_dealer' }
};

function normalizePhone(phone) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return phone;
}

async function run() {
    console.log('🔄 Promoting hc_discovery_entities to valid canonical tables...');
    
    // Quick load existing entities to avoid duplicate slugs/entity_ids (light check)
    // For large tables, upsert with ON CONFLICT is better, but Supabase INSERT will skip on duplicate PK if we handle err.
    
    let offset = 0;
    let limit = 50;
    let promotedOperators = 0;
    let promotedPlaces = 0;
    
    while(true) {
        const { data: entities, error } = await sb
            .from('hc_discovery_entities')
            .select('*')
            .range(offset, offset + limit - 1);
            
        if (error) { console.error('Error fetching:', error); break; }
        if (!entities || entities.length === 0) break;
        
        console.log(`Processing batch of ${entities.length} records (offset ${offset})...`);
        
        const operatorInserts = [];
        const placeInserts = [];
        
        for (const record of entities) {
            if (!record.industry_type) continue;
            const tags = record.industry_type.split(',');
            let targetMap = null;
            for (const tag of tags) {
                if (TAG_MAPPING[tag.trim()]) {
                    targetMap = TAG_MAPPING[tag.trim()];
                    break; // Just pick the first dominant tag map
                }
            }
            if (!targetMap) continue;
            
            const country = getCountry(record.state);
            const slug = generateSlug(record.company_name, record.state);
            
            if (targetMap.table === 'directory_listings') {
                operatorInserts.push({
                    entity_type: targetMap.type,
                    entity_id: record.id,
                    name: record.company_name,
                    slug: slug,
                    city: record.city || null,
                    region_code: record.state || null,
                    country_code: country,
                    rank_score: 15,
                    claim_status: 'unclaimed',
                    is_visible: true,
                    source: 'hc_discovery_entities',
                    metadata: {
                        phone: normalizePhone(record.phone)
                    }
                });
            } else if (targetMap.table === 'hc_places') {
                placeInserts.push({
                    primary_source_id: record.id,
                    surface_category_key: targetMap.type,
                    surface_subcategory_key: targetMap.type,
                    name: record.company_name,
                    slug: slug,
                    locality: record.city || null,
                    admin1_code: record.state || null,
                    country_code: country,
                    phone: normalizePhone(record.phone),
                    lat: 0,
                    lng: 0,
                    normalized_name: String(record.company_name).trim().toLowerCase(),
                    normalized_address: String(record.city || '').toLowerCase(),
                    dedupe_hash: slug
                });
            }
        }
        
        // Batch insert for performance
        if (operatorInserts.length > 0) {
            const { error: opErr } = await sb.from('directory_listings').insert(operatorInserts);
            if (!opErr) promotedOperators += operatorInserts.length;
            else if (!opErr.message.includes('duplicate')) console.error('Operator Insert Error:', opErr.message);
        }
        
        if (placeInserts.length > 0) {
            const { error: plErr } = await sb.from('hc_places').insert(placeInserts);
            if (!plErr) promotedPlaces += placeInserts.length;
            else if (!plErr.message.includes('duplicate')) console.error('Places Insert Error:', plErr.message);
        }
        
        offset += limit;
    }
    
    console.log('\n═══════════════════════════════════');
    console.log(`✅ Promoted Operators (directory_listings): ${promotedOperators}`);
    console.log(`✅ Promoted Places (hc_places): ${promotedPlaces}`);
    console.log('═══════════════════════════════════');
}

run();
