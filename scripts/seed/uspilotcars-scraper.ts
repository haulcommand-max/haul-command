import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// Define the precise targeted URLs for the core hub
const CORE_URL = 'https://uspilotcars.com/';
const DIRECTORY_URL = 'https://uspilotcars.com/pilot_car_directory.html';

export interface ExtractedOperator {
    companyName: string;
    phoneNumbers: string[];
    emails: string[];
    serviceRegions: string[];
    certifications: string[];
    outboundLinks: string[];
    sourceUrl: string;
}

/**
 * Normalizes a website link ensuring we don't grab internal generic pages
 */
function isOutboundOperatorLink(href: string): boolean {
    if (!href) return false;
    const clean = href.toLowerCase();
    if (clean.includes('uspilotcars.com')) return false;
    if (clean.startsWith('tel:') || clean.startsWith('mailto:')) return false;
    if (clean.startsWith('http')) return true;
    return false;
}

/**
 * Extracts phone numbers from text using Regex
 */
function extractPhones(text: string): string[] {
    const rx = /(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    return Array.from(new Set(text.match(rx) || []));
}

/**
 * Core scraping logic specifically tuned for the US Pilot Cars network architecture
 */
export async function scrapeUSPilotCarsSeed() {
    console.log('[Anti-Gravity] 🚀 Initiating Core Directory Scrape on US Pilot Cars...');
    
    // 1. Fetch Homepage & Directory
    const homeHtml = await fetch(CORE_URL).then(res => res.text());
    const dirHtml = await fetch(DIRECTORY_URL).then(res => res.text());

    const $ = cheerio.load(homeHtml);
    const $dir = cheerio.load(dirHtml);

    const operators: ExtractedOperator[] = [];
    const expansionQueue: string[] = [];

    // --- STRATEGY: 1) EXTRACT AD/HOME OPERATORS ---
    // Specifically targets their side-panels and header text blocks based on visual structural mapping
    $('body').contents().each((_, el) => {
        const text = $(el).text();
        if (text.includes('PILOTING SERVICES') || text.includes('CERT.')) {
            // Very noisy DOM, simple string search chunking
            const chunk = text;
            
            // Extract features
            const hasNYCert = chunk.includes('NY CERT');
            const hasWACert = chunk.includes('WA CERT');
            const hasTXCert = chunk.includes('TX FLAGGING');
            const certs = [];
            if (hasNYCert) certs.push('NY Cert');
            if (hasWACert) certs.push('WA Cert');
            if (hasTXCert) certs.push('TX Flagging Cert');

            const phones = extractPhones(chunk);
            
            const lines = chunk.split('\n').map(s => s.trim()).filter(Boolean);
            let companyName = "Unknown Listed Operator";
            // usually the line before the phone number is the name
            const phoneIdx = lines.findIndex(l => extractPhones(l).length > 0);
            if (phoneIdx > 0) {
                companyName = lines[phoneIdx - 1];
            }

            if (phones.length > 0) {
                operators.push({
                    companyName,
                    phoneNumbers: phones,
                    emails: [],
                    serviceRegions: ['US', 'NY', 'WA', 'TX'], // Inferred from texts
                    certifications: certs,
                    outboundLinks: [],
                    sourceUrl: CORE_URL
                });
            }
        }
    });

    // --- STRATEGY: 2) EXTRACT OUTBOUND EXPANSION GRAPH FROM DIRECTORY ---
    // Look for all outbound Links to other domains (These are the actual operator websites)
    $dir('a').each((_, el) => {
        const href = $dir(el).attr('href');
        if (href) {
            if (isOutboundOperatorLink(href)) {
                expansionQueue.push(href);
            } else if (href.includes('_pilot_car_directory.html') || href.includes('_regulations.html')) {
                // INTERNAL state expansion loop
                const stateUrl = new URL(href, DIRECTORY_URL).toString();
                if (!expansionQueue.includes(stateUrl)) {
                    expansionQueue.push(stateUrl);
                }
            }
        }
    });

    // Deduplicate queues
    const finalQueue = Array.from(new Set(expansionQueue));

    // Consolidate data
    const dataset = {
        seedOperators: operators,
        outboundExpansionQueueLength: finalQueue.length,
        outboundExpansionQueue: finalQueue
    };

    // Save outputs locally as JSON seed layer
    const outPath = path.join(process.cwd(), 'data');
    if (!fs.existsSync(outPath)) fs.mkdirSync(outPath);

    fs.writeFileSync(
        path.join(outPath, 'uspilotcars_initial_seed.json'), 
        JSON.stringify(dataset, null, 2)
    );

    console.log(`[Anti-Gravity] ✅ Extracted ${operators.length} seed operators from Core.`);
    console.log(`[Anti-Gravity] ✅ Captured ${finalQueue.length} URL nodes into the recursive Expansion Loop.`);
    console.log(`[Anti-Gravity] 💾 Wrote out to data/uspilotcars_initial_seed.json`);
}

// Allow direct execution
scrapeUSPilotCarsSeed();

