import { z } from 'zod';
// @ts-ignore
import fetch from 'node-fetch';
// @ts-ignore
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_KEY || 'secret';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const BASE_URL = 'https://www.truckstopsandservices.com';

/**
 * ============================================================================
 * DC BOOK INGESTION ENGINE (truckstopsandservices.com)
 * Objective: Extract every single pilot car, repair shop, and truck stop
 * from the competitor directory into Haul Command's entity system.
 * ============================================================================
 */

export async function scrapeCategoryStates(categoryId, type) {
    console.log(`[INGESTION] Initiating crawl for DC Book Category ${categoryId}...`);
    // Example: https://www.truckstopsandservices.com/listcatbusinesses.php?id=27
    const url = `${BASE_URL}/listcatbusinesses.php?id=${categoryId}`;
    
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const stateLinks = [];
        
        // Extract all state-level URLs
        $('a').each((i, el) => {
            const link = $(el).attr('href');
            if (link && link.includes('&state=')) {
                if (link.startsWith('http')) {
                    stateLinks.push(link);
                } else {
                    stateLinks.push(`${BASE_URL}/${link}`);
                }
            }
        });

        console.log(`[INGESTION] Discovered ${stateLinks.length} State Geographies. Beginning parallel extraction...`);
        
        let totalExtracted = 0;
        // Batching state requests
        for (const stateLink of stateLinks) {
            totalExtracted += await extractListingsFromState(stateLink, type);
            // Throttle to avoid IP ban during massive ingestion
            await new Promise(r => setTimeout(r, 500));
        }

        console.log(`[INGESTION] Complete. Successfully mapped ${totalExtracted} entities across all US states. Now prepping for 57 country expansion logic.`);

    } catch (e) {
        console.error(`[FATAL] Failed to scrape DC Book category ${categoryId}`, e);
    }
}

async function extractListingsFromState(stateUrl, type) {
    try {
        const response = await fetch(stateUrl);
        const html = await response.text();
        const $ = cheerio.load(html);

        const extractedEntities = [];

        // Parse individual location detail links directly from the state list
        $('a').each((i, el) => {
            const link = $(el).attr('href');
            if (link && link.includes('location_details.php')) {
                const name = $(el).text().trim();
                
                // Identify state from URL params
                const params = new URL(stateUrl).searchParams;
                const stateId = params.get('state') || 'US';

                if (name.length > 2) {
                    extractedEntities.push({
                        name,
                        website: `${BASE_URL}/${link}`,
                        state: stateId,
                        type: type,
                        source: 'dc_book_company',
                        raw_data: ''
                    });
                }
            }
        });

        if (extractedEntities.length > 0) {
            // Push directly to hc_extraction_candidates
            const { error } = await supabase
                .from('hc_extraction_candidates')
                .upsert(
                    extractedEntities.map(e => ({
                        full_name: e.name,
                        phone_number: e.phone,
                        website_url: e.website,
                        city_state: e.state,
                        source_system: e.source,
                        discovered_at: new Date().toISOString()
                    })), { onConflict: 'full_name' }
                );

            if (error) console.error('[DB] Upsert failed:', error.message);
        }

        console.log(`  -> State processed. Mapped ${extractedEntities.length} entities.`);
        return extractedEntities.length;

    } catch (e) {
        console.error(`[ERROR] State processing failed for ${stateUrl}`);
        return 0;
    }
}

// await scrapeCategoryStates(27, 'pilot_car');
// await scrapeCategoryStates(78, 'fast_food_truck_parking');
await scrapeCategoryStates(113, 'mobile_fueling');
