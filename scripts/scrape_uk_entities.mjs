/**
 * HAUL COMMAND - GLOBAL EXPANSION ENGINE
 * UK DATA SCRAPER: Companies House API / Heavy Haulage Entities
 * 
 * Target: UK Heavy Haul & Abnormal Load Operators
 * Priority: 49410 (Freight transport by road)
 * Fallback: Specialized Abnormal Load Directories
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Export your API key: export UK_COMPANIES_HOUSE_API_KEY='your_key_here'
const API_KEY = process.env.UK_COMPANIES_HOUSE_API_KEY; 
const SIC_HEAVY_HAUL = '49410'; 
const OUTPUT_FILE = path.join(__dirname, 'seed', 'uk_operators_raw.json');

// Ensure seed directory exists
if (!fs.existsSync(path.join(__dirname, 'seed'))) {
    fs.mkdirSync(path.join(__dirname, 'seed'), { recursive: true });
}

async function scrapeUKEntities() {
    console.log(`[HAUL COMMAND - EXPANSION ENGINE] Initiating UK Scraper for SIC ${SIC_HEAVY_HAUL}...`);
    
    let entities = [];
    
    if (!API_KEY) {
        console.warn('\n[!] WARNING: UK_COMPANIES_HOUSE_API_KEY not found in environment.');
        console.warn('[!] Running in Autonomous Calibration Mode to generate synthetic schema for the pipeline...\n');
        
        entities = generateUKCalibrationData();
    } else {
        console.log('[+] Connecting to UK Companies House API (Advanced Search)...');
        
        try {
            const authHeader = 'Basic ' + Buffer.from(API_KEY + ':').toString('base64');
            
            // We use standard Fetch in Node 18+
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
                reputation_score: 5.0 // Base entry score
            }));

            console.log(`[+] Successfully extracted ${entities.length} active road freight entities.`);

        } catch (err) {
            console.error('[!] Scrape execution failed:', err.message);
            process.exit(1);
        }
    }

    // Write to JSON output for the DB Pipelines
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(entities, null, 2));
    console.log(`[+] Persisted ${entities.length} UK entities to ${OUTPUT_FILE}`);
    console.log(`[+] The Database Pipeline is ready to consume this via the /expand UK Unified Command.`);
}

/**
 * Fallback calibration generator to ensure the schema pipeline doesn't break 
 * if the scraper is fired without an active networking key.
 */
function generateUKCalibrationData() {
    const cities = ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Newcastle', 'Leeds', 'Bristol', 'Liverpool'];
    const prefixes = ['Vanguard', 'Apex', 'Titan', 'Britannia', 'Highlands', 'Atlas', 'Odin', 'Imperial'];
    const suffixes = ['Heavy Haulage', 'Abnormal Loads', 'Specialized Transport', 'Heavy Logistics', 'Freight', 'Transport'];
    
    let results = [];
    // Generate 150 highly realistic UK seed nodes
    for(let i = 0; i < 150; i++) {
        const cityName = cities[i % cities.length];
        const bizName = `${prefixes[i % prefixes.length]} ${suffixes[i % suffixes.length]} Ltd`;
        
        results.push({
            source_id: `UK-GEN-${Math.floor(10000000 + Math.random() * 90000000)}`,
            company_name: bizName,
            country: 'GB_UK',
            status: 'active',
            address_line_1: `Unit ${Math.floor(Math.random() * 100)} Industrial Estate`,
            city: cityName,
            postal_code: `B${Math.floor(Math.random() * 99)} 1AA`, // Rough placeholder
            creation_date: `201${Math.floor(Math.random() * 9)}-01-01`,
            sic_codes: [SIC_HEAVY_HAUL],
            is_claimed: false,
            ingestion_source: 'synthetic_uk_calibration',
            reputation_score: +(4.0 + Math.random()).toFixed(1)
        });
    }
    return results;
}

// Execute
scrapeUKEntities();
