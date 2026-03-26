import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

/**
 * HAUL COMMAND: THE FMCSA BROKER INTERCEPT ENGINE
 * Execution: Extracts raw FMCSA DOT data and enriches it via LinkedIn & Google Places.
 * Strategy: "The 10x Vanity Trap". We do not ask brokers to join. We auto-build their profile 
 * with their 5-star reviews and logo, so when they Google themselves or "Chicago Pilot Cars", 
 * they see their own brokerage ranking on our site. They MUST claim it.
 */

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const LINKEDIN_API_KEY = process.env.LINKEDIN_ENTERPRISE_KEY;
const GOOGLE_PLACES_API = process.env.GOOGLE_PLACES_KEY;

export async function runHybridBrokerEnrichment() {
    console.log('[FMCSA Broker Intercept] Initializing Data Enrichment Pipeline...');

    // 1. Pull raw un-enriched brokers from the FMCSA datadump
    const { data: rawBrokers, error } = await supabase
        .from('hc_extraction_candidates')
        .select('*')
        .eq('status', 'RAW_FMCSA')
        .eq('entity_type', 'FREIGHT_BROKER')
        .limit(100); 

    if (error || !rawBrokers) {
        console.error('Failed to pull raw FMCSA queue', error);
        return;
    }

    for (const broker of rawBrokers) {
        try {
            console.log(`[Enriching] Broker DOT: ${broker.dot_number} | Name: ${broker.business_name}`);
            
            // 2. Google Places API (Pull Reviews & Logo)
            const placesRes = await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json`, {
                params: {
                    query: `${broker.business_name} freight broker ${broker.city} ${broker.state}`,
                    key: GOOGLE_PLACES_API
                }
            });

            const placeData = placesRes.data.results[0];
            const googleRating = placeData?.rating || null;
            const logoUrl = placeData?.photos ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${placeData.photos[0].photo_reference}&key=${GOOGLE_PLACES_API}` : null;

            // 3. LinkedIn Company Deep-Dive (Pull CEO / Year Founded)
            const linkedinRes = await axios.get(`https://api.linkedin.com/v2/organizations`, {
                params: { q: 'vanityName', vanityName: broker.business_name.toLowerCase().replace(/\s+/g, '-') },
                headers: { 'Authorization': `Bearer ${LINKEDIN_API_KEY}` }
            });
            
            const liData = linkedinRes.data.elements[0];
            const employeeCount = liData?.employeeCountRange?.start || 1;

            // 4. Transform to Final Vanity Profile & Inject into the Directory
            const enrichedProfile = {
                user_id: broker.id, // Placeholder ID until claimed
                company_name: broker.business_name,
                company_phone: broker.extracted_phone,
                dot_number: broker.dot_number,
                mc_number: broker.mc_number,
                reputation_score: googleRating ? (googleRating * 20) : 50, // 5.0 rating = 100 Truth Score
                avatar_url: logoUrl,
                bio: `Established Freight Brokerage out of ${broker.city}, ${broker.state}. Currently operating with ${employeeCount}+ personnel. (UNCLAIMED DIRECTORY LISTING)`,
                claim_status: 'UNCLAIMED',
                metadata: {
                    source: 'FMCSA_ENRICHED_V2',
                    linked_in_url: liData?.localizedName || 'Unknown',
                }
            };

            // 5. Fire the Insert into profiles for immediate SEO Indexing
            await supabase.from('profiles').insert(enrichedProfile);
            await supabase.from('hc_extraction_candidates').update({ status: 'PROMOTED_UNCLAIMED' }).eq('id', broker.id);

            console.log(`✅ [Promoted & Indexed] ${broker.business_name} is now live on the Public Directory.`);

        } catch (e) {
            console.error(`❌ [Enrichment Failed] for ${broker.business_name}`, e.message);
            // Requeue for manual retry
            await supabase.from('hc_extraction_candidates').update({ status: 'ENRICHMENT_FAILED' }).eq('id', broker.id);
        }
    }
}

// runHybridBrokerEnrichment();
