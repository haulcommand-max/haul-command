import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_KEY || 'secret';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function parseLoadBoard() {
    try {
        console.log('[LOADBOARD PARSER] Reading load board dump...');
        const text = fs.readFileSync('tmp/loadboard_dump.txt', 'utf8');
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        const entitiesMap = new Map();
        
        // Regex to identify name lines: {Company Name} -  ID Verified
        const idVerifiedRegex = /^(.*?)\s*-\s*ID Verified/i;
        const phoneRegex = /(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/;

        let currentCompany = null;
        let currentPhone = null;

        for (const line of lines) {
            const verifiedMatch = line.match(idVerifiedRegex);
            if (verifiedMatch) {
                // Save previous if exists
                if (currentCompany) {
                    entitiesMap.set(currentCompany, {
                        full_name: currentCompany,
                        phone_number: currentPhone || 'Hidden (Load Board)',
                        source_system: 'pilotloadcars_board',
                        discovered_at: new Date().toISOString()
                    });
                }
                
                // Start a new company block
                currentCompany = verifiedMatch[1].trim();
                currentPhone = null;
                continue;
            }

            if (currentCompany && !currentPhone) {
                const pMatch = line.match(phoneRegex);
                if (pMatch) {
                    currentPhone = pMatch[0];
                }
            }
        }

        // Catch the last one
        if (currentCompany) {
            entitiesMap.set(currentCompany, {
                full_name: currentCompany,
                phone_number: currentPhone || 'Hidden (Load Board)',
                source_system: 'pilotloadcars_board',
                discovered_at: new Date().toISOString()
            });
        }

        const entities = Array.from(entitiesMap.values());
        console.log(`[LOADBOARD PARSER] Parsed ${entities.length} verified brokers/operators. Prepping Upsert...`);
        
        if (entities.length > 0) {
            const { error } = await supabase
                .from('hc_extraction_candidates')
                .upsert(entities, { onConflict: 'full_name' });

            if (error) console.error('[DB] Upsert error', error.message);
            else console.log('[LOADBOARD PARSER] Successfully inserted array into Database Queue.');
        }

    } catch (e) {
        console.error('[FATAL] Failed to parse load board dump', e);
    }
}

parseLoadBoard();
