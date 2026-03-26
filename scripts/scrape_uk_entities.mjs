/**
 * HAUL COMMAND - GLOBAL EXPANSION ENGINE
 * UK DATA SCRAPER: Companies House API / Heavy Haulage Entities
 * 
 * Target: UK Heavy Haul & Abnormal Load Operators
 * Priority: 49410 (Freight transport by road)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.UK_COMPANIES_HOUSE_API_KEY; 
const SIC_HEAVY_HAUL = '49410'; 
const OUTPUT_FILE = path.join(__dirname, 'seed', 'uk_operators_raw.json');

if (!fs.existsSync(path.join(__dirname, 'seed'))) {
    fs.mkdirSync(path.join(__dirname, 'seed'), { recursive: true });
}

async function scrapeUKEntities() {
    console.log(`[HAUL COMMAND - EXPANSION ENGINE] Initiating UK Scraper for SIC ${SIC_HEAVY_HAUL}...`);
    
    if (!API_KEY) {
        console.error('\n[!] ERROR: UK_COMPANIES_HOUSE_API_KEY not found in environment.');
        console.error('[!] Aborting scrape. Fake data has been removed per system command - only valid entities allowed.\n');
        process.exit(1);
    } 

    console.log('[+] Connecting to UK Companies House API (Advanced Search)...');
    
    let entities = [];
    try {
        const authHeader = 'Basic ' + Buffer.from(API_KEY + ':').toString('base64');
        const res = await fetch(`https://api.company-information.service.gov.uk/advanced-search/companies?sic_codes=${SIC_HEAVY_HAUL}&company_status=active&size=5000`, {
            headers: { 
                'Authorization': authHeader,
                'Accept': 'application/json' 
            }
        });
        
        if (!res.ok) {
            throw new Error(`Companies House API responded with ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        
        entities = data.items.map(item => ({
            source_id: item.company_number,
            company_name: item.company_name,
            country: 'GB_UK',
            status: item.company_status,
            address_line_1: item.registered_office_address?.address_line_1 || '',
            city: item.registered_office_address?.locality || '',
            postal_code: item.registered_office_address?.postal_code || '',
            creation_date: item.date_of_creation,
            sic_codes: item.sic_codes,
            is_claimed: false,
            ingestion_source: 'gov.uk_companies_house',
            reputation_score: 5.0
        }));

        console.log(`[+] Successfully extracted ${entities.length} active road freight entities.`);

    } catch (err) {
        console.error('[!] Scrape execution failed:', err.message);
        process.exit(1);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(entities, null, 2));
    console.log(`[+] Persisted ${entities.length} UK entities to ${OUTPUT_FILE}`);
}

scrapeUKEntities();
