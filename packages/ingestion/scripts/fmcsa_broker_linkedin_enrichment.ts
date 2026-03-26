import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';

// Load the .env.local file explicitly if running from the CLI
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * HAUL COMMAND: THE FMCSA BROKER INTERCEPT ENGINE (GOOGLE-ONLY PIVOT)
 * Execution: Extracts raw FMCSA DOT data and enriches it purely via Google Places to avoid 
 *            the $1,200-$2,400 Proxycurl API costs and LinkedIn IP ban risks.
 * Strategy: "The 10x Vanity Trap". We auto-build their profile with their 5-star reviews 
 *            and logo, so when they Google themselves they see their own brokerage ranking 
 *            on our site. They MUST claim it.
 */

// If running locally, check environment variables early
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("⚠️ Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Profile insertion may fail.");
}
if (!process.env.GOOGLE_PLACES_API_KEY && !process.env.GOOGLE_PLACES_KEY) {
    console.warn("⚠️ Warning: GOOGLE_PLACES_API_KEY is missing. Enrichment will fallback to raw FMCSA data without Google enrichment.");
}

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const GOOGLE_PLACES_API = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_KEY;

export async function runHybridBrokerEnrichment() {
    console.log('[FMCSA Broker Intercept] Initializing Google-First Enrichment Pipeline...');

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

    if (rawBrokers.length === 0) {
        console.log('✅ No raw FMCSA brokers currently in queue.');
        return;
    }

    for (const broker of rawBrokers) {
        try {
            console.log(`[Enriching] Broker DOT: ${broker.dot_number} | Name: ${broker.business_name}`);
            
            let googleRating = null;
            let logoUrl = null;
            let placeAddress = null;

            // 2. Google Places API (Pull Reviews, Address, & Logo)
            if (GOOGLE_PLACES_API) {
                const placesRes = await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json`, {
                    params: {
                        query: `${broker.business_name} freight broker ${broker.city || ''} ${broker.state || ''}`.trim(),
                        key: GOOGLE_PLACES_API
                    }
                });

                if (placesRes.data.results && placesRes.data.results.length > 0) {
                    const placeData = placesRes.data.results[0];
                    googleRating = placeData?.rating || null;
                    placeAddress = placeData?.formatted_address || null;
                    
                    // Pull the Google Maps Avatar/Logo if they have a storefront image
                    logoUrl = placeData?.photos 
                        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${placeData.photos[0].photo_reference}&key=${GOOGLE_PLACES_API}` 
                        : null;
                }
            }

            // 3. Transform to Final Vanity Profile & Inject into the Directory
            const establishedLocation = placeAddress ? placeAddress : `${broker.city}, ${broker.state}`;
            
            const enrichedProfile = {
                user_id: broker.id, // Placeholder ID until claimed
                company_name: broker.business_name,
                company_phone: broker.extracted_phone,
                dot_number: broker.dot_number,
                mc_number: broker.mc_number,
                reputation_score: googleRating ? Math.round(googleRating * 20) : 50, // 5.0 rating = 100 Truth Score
                avatar_url: logoUrl,
                bio: `Established Freight Brokerage located in ${establishedLocation}. This is an unclaimed directory listing. Claim this profile to unlock route intelligence, verified compliance badging, and direct pilot car dispatching.`,
                claim_status: 'UNCLAIMED',
                metadata: {
                    source: 'FMCSA_GOOGLE_ENRICHED',
                    google_maps_address: placeAddress || 'Unknown',
                    raw_fmcsa_data: true
                }
            };

            // 4. Fire the Insert into profiles for immediate SEO Indexing
            await supabase.from('profiles').insert(enrichedProfile);
            await supabase.from('hc_extraction_candidates').update({ status: 'PROMOTED_UNCLAIMED' }).eq('id', broker.id);

            console.log(`✅ [Promoted & Indexed] ${broker.business_name} is now live on the Public Directory.`);

        } catch (e: any) {
            console.error(`❌ [Enrichment Failed] for ${broker.business_name}:`, e.message);
            // Requeue for manual retry
            await supabase.from('hc_extraction_candidates').update({ status: 'ENRICHMENT_FAILED' }).eq('id', broker.id);
        }
    }
    
    console.log(`[FMCSA Broker Intercept] Batch Complete. Transferred ${rawBrokers.length} brokers to the active directory.`);
}

// Automatically execute if run directly
runHybridBrokerEnrichment();
