import { z } from 'zod';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_KEY || 'secret';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const OSOW_BASE_URL = 'https://osowhaven.com';

async function extractOsowHaven() {
    console.log('[OSOW HAVEN] Initiating extraction of competitive pilot car directory...');
    const startUrl = `${OSOW_BASE_URL}/pilot-car-directory/`;
    
    try {
        const response = await fetch(startUrl);
        const html = await response.text();
        const $ = cheerio.load(html);

        const extractedEntities = [];

        // They use modern URL paths for companies /companies/:id/
        $('a').each((i, el) => {
            const link = $(el).attr('href');
            if (link && link.includes('/companies/')) {
                let name = $(el).text().trim();
                
                // Exclude any junk mapping
                if (name && name.length > 3 && !name.includes('http')) {
                    extractedEntities.push({
                        full_name: name,
                        website_url: link.startsWith('http') ? link : `${OSOW_BASE_URL}${link}`,
                        source_system: 'osowhaven_directory',
                        discovered_at: new Date().toISOString()
                    });
                }
            }
        });

        // Deduplicate just in case of multiple anchor tags wrapping the same card
        const uniqueEntitiesMap = new Map();
        for (const e of extractedEntities) {
            uniqueEntitiesMap.set(e.website_url, e);
        }
        const uniqueEntities = Array.from(uniqueEntitiesMap.values());

        console.log(`[OSOW HAVEN] Extracted ${uniqueEntities.length} verified pilot car providers. Prepping for Database Insert.`);

        if (uniqueEntities.length > 0) {
            const { error } = await supabase
                .from('hc_extraction_candidates')
                .upsert(uniqueEntities, { onConflict: 'full_name' });
            
            if (error) console.error('[DB] Upsert error', error.message);
        }
        
    } catch (e) {
        console.error(`[FATAL] Pipeline crash on OSOW Haven`, e);
    }
}

extractOsowHaven();
