import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_KEY || 'secret';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const US_PILOT_CARS_BASE_URL = 'https://uspilotcars.com';

async function executeUsPilotCars() {
    console.log('[US PILOT CARS] Initiating autonomous extraction on US Pilot Cars Directory...');
    try {
        const startUrls = [
            `${US_PILOT_CARS_BASE_URL}/pilot_car_directory.html`,
            `${US_PILOT_CARS_BASE_URL}/truck_stop.html`,
            `${US_PILOT_CARS_BASE_URL}/find_a_hotel.html`
        ];
        
        const stateLinks = [];

        for (const url of startUrls) {
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);

            $('a').each((i, el) => {
                const link = $(el).attr('href');
                if (link && (link.includes('_pilot_car') || link.includes('_truck_stops') || link.includes('hotel')) && !link.includes('regulations') && !link.includes('guidelines') && !link.includes('privacy')) {
                    const fullLink = link.startsWith('http') ? link : `${US_PILOT_CARS_BASE_URL}/${link}`;
                    stateLinks.push(fullLink);
                }
            });
        }

        // Deduplicate links
        const uniqueLinks = [...new Set(stateLinks)];
        console.log(`[US PILOT CARS] Discovered ${uniqueLinks.length} State/Provincial Geographies. Spawning deep extraction...`);

        let totalExtracted = 0;

        for (const stateLink of uniqueLinks) {
            try {
                const stateResponse = await fetch(stateLink);
                const stateHtml = await stateResponse.text();
                const _$ = cheerio.load(stateHtml);
                
                // UsPilotCars uses very loose text structure, often placing phone numbers next to or under company names.
                // We will extract all unique 10-digit phone numbers and the text immediately preceding them.
                const bodyText = _$('body').text();
                const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                
                const entities = [];
                const phoneRegex = /(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/;

                for (let i = 1; i < lines.length; i++) {
                    const match = lines[i].match(phoneRegex);
                    if (match) {
                        // The line before the phone number is typically the company name and city
                        let potentialName = lines[i - 1];
                        
                        // Clean up trailing superscripts or flags like "1 2 4 5"
                        potentialName = potentialName.replace(/[0-9\s]+$/, '').trim();

                        if (potentialName.length > 3 && potentialName.length < 50 && !potentialName.includes('Superscript')) {
                            // Determine state from url
                            const stateNameMatch = stateLink.match(/([a-z_]+)_pilot/i);
                            const state = stateNameMatch ? stateNameMatch[1].replace('_', ' ').toUpperCase() : 'US';

                            entities.push({
                                full_name: potentialName,
                                phone_number: match[0],
                                city_state: state,
                                source_system: 'us_pilot_cars_directory',
                                discovered_at: new Date().toISOString()
                            });
                        }
                    }
                }

                if (entities.length > 0) {
                    const deduplicated = entities.filter((v,i,a)=>a.findIndex(v2=>(v2.full_name===v.full_name))===i);
                    const { error } = await supabase
                        .from('hc_extraction_candidates')
                        .upsert(deduplicated, { onConflict: 'full_name' });
                    
                    if (error) console.error('[DB] Upsert error', error.message);
                    totalExtracted += deduplicated.length;
                    console.log(`  -> Handled Region. Mapped ${deduplicated.length} pilot cars.`);
                }
            } catch (err) {
                console.error(`[ERROR] Parsing failed for ${stateLink}`);
            }

            // Throttle to respect basic rate limits against primitive servers
            await new Promise(r => setTimeout(r, 500));
        }

        console.log(`[US PILOT CARS] COMPLETE. Total New Entities Mined: ${totalExtracted}. Merging into hc_extraction_candidates...`);
        
    } catch (e) {
        console.error(`[FATAL] Pipeline crash on US Pilot Cars`, e);
    }
}

executeUsPilotCars();
