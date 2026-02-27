/**
 * USPilotCars.com — Full Directory Scraper v2
 * More aggressive HTML table parsing to isolate the actual listing table.
 * Extracts every pilot car operator from all US state + Canadian province pages.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── All state/province URLs ──
const STATE_URLS = [
    { url: "https://uspilotcars.com/alabama_pilot_car.html", region: "AL", country: "US", name: "Alabama" },
    { url: "https://uspilotcars.com/alaska_pilot_car.html", region: "AK", country: "US", name: "Alaska" },
    { url: "https://uspilotcars.com/arizona_pilot_car.html", region: "AZ", country: "US", name: "Arizona" },
    { url: "https://uspilotcars.com/arkansas_pilot_car.html", region: "AR", country: "US", name: "Arkansas" },
    { url: "https://uspilotcars.com/california_pilot_car.html", region: "CA", country: "US", name: "California" },
    { url: "https://uspilotcars.com/colorado_pilot_car.html", region: "CO", country: "US", name: "Colorado" },
    { url: "https://uspilotcars.com/connecticut_pilot_car.html", region: "CT", country: "US", name: "Connecticut" },
    { url: "https://uspilotcars.com/delaware_pilot_car.html", region: "DE", country: "US", name: "Delaware" },
    { url: "https://uspilotcars.com/florida_pilot_car.html", region: "FL", country: "US", name: "Florida" },
    { url: "https://uspilotcars.com/georgia_pilot_car.html", region: "GA", country: "US", name: "Georgia" },
    { url: "https://uspilotcars.com/idaho_pilot_car.html", region: "ID", country: "US", name: "Idaho" },
    { url: "https://uspilotcars.com/illinois_pilot_car.html", region: "IL", country: "US", name: "Illinois" },
    { url: "https://uspilotcars.com/indiana_pilot_car.html", region: "IN", country: "US", name: "Indiana" },
    { url: "https://uspilotcars.com/iowa_pilot_car.html", region: "IA", country: "US", name: "Iowa" },
    { url: "https://uspilotcars.com/kansas_pilot_car.html", region: "KS", country: "US", name: "Kansas" },
    { url: "https://uspilotcars.com/kentucky_pilot_car.html", region: "KY", country: "US", name: "Kentucky" },
    { url: "https://uspilotcars.com/louisiana_pilot_car.html", region: "LA", country: "US", name: "Louisiana" },
    { url: "https://uspilotcars.com/maine_pilot_car.html", region: "ME", country: "US", name: "Maine" },
    { url: "https://uspilotcars.com/maryland_pilot_car.html", region: "MD", country: "US", name: "Maryland" },
    { url: "https://uspilotcars.com/massachusetts_pilot_car.html", region: "MA", country: "US", name: "Massachusetts" },
    { url: "https://uspilotcars.com/michigan_pilot_car.html", region: "MI", country: "US", name: "Michigan" },
    { url: "https://uspilotcars.com/minnesota_pilot_car.html", region: "MN", country: "US", name: "Minnesota" },
    { url: "https://uspilotcars.com/mississippi_pilot_car.html", region: "MS", country: "US", name: "Mississippi" },
    { url: "https://uspilotcars.com/missouri_pilot_car.html", region: "MO", country: "US", name: "Missouri" },
    { url: "https://uspilotcars.com/montana_pilot_car.html", region: "MT", country: "US", name: "Montana" },
    { url: "https://uspilotcars.com/nebraska_pilot_car.html", region: "NE", country: "US", name: "Nebraska" },
    { url: "https://uspilotcars.com/nevada_pilot_car.html", region: "NV", country: "US", name: "Nevada" },
    { url: "https://uspilotcars.com/new_hampshire_pilot_car.html", region: "NH", country: "US", name: "New Hampshire" },
    { url: "https://uspilotcars.com/new_jersey_pilot_car.html", region: "NJ", country: "US", name: "New Jersey" },
    { url: "https://uspilotcars.com/new_mexico_pilot_car.html", region: "NM", country: "US", name: "New Mexico" },
    { url: "https://uspilotcars.com/new_york_pilot_car.html", region: "NY", country: "US", name: "New York" },
    { url: "https://uspilotcars.com/north_carolina_pilot_car.html", region: "NC", country: "US", name: "North Carolina" },
    { url: "https://uspilotcars.com/north_dakota_pilot_car.html", region: "ND", country: "US", name: "North Dakota" },
    { url: "https://uspilotcars.com/ohio_pilot_car.html", region: "OH", country: "US", name: "Ohio" },
    { url: "https://uspilotcars.com/oklahoma_pilot_car.html", region: "OK", country: "US", name: "Oklahoma" },
    { url: "https://uspilotcars.com/oregon_pilot_car.html", region: "OR", country: "US", name: "Oregon" },
    { url: "https://uspilotcars.com/pennsylvania_pilot_car.html", region: "PA", country: "US", name: "Pennsylvania" },
    { url: "https://uspilotcars.com/rhode_island_pilot_car.html", region: "RI", country: "US", name: "Rhode Island" },
    { url: "https://uspilotcars.com/south_carolina_pilot_car.html", region: "SC", country: "US", name: "South Carolina" },
    { url: "https://uspilotcars.com/south_dakota_pilot_car.html", region: "SD", country: "US", name: "South Dakota" },
    { url: "https://uspilotcars.com/tennesee_pilot_car.html", region: "TN", country: "US", name: "Tennessee" },
    { url: "https://uspilotcars.com/texas_pilot_car.html", region: "TX", country: "US", name: "Texas" },
    { url: "https://uspilotcars.com/utah_pilot_car.html", region: "UT", country: "US", name: "Utah" },
    { url: "https://uspilotcars.com/vermont_pilot_cars.html", region: "VT", country: "US", name: "Vermont" },
    { url: "https://uspilotcars.com/virginia_pilot_car.html", region: "VA", country: "US", name: "Virginia" },
    { url: "https://uspilotcars.com/washington_pilot_car.html", region: "WA", country: "US", name: "Washington" },
    { url: "https://uspilotcars.com/west_virginia_pilot_car.html", region: "WV", country: "US", name: "West Virginia" },
    { url: "https://uspilotcars.com/wisconsin_pilot_car.html", region: "WI", country: "US", name: "Wisconsin" },
    { url: "https://uspilotcars.com/wyoming_pilot_car.html", region: "WY", country: "US", name: "Wyoming" },
    { url: "https://uspilotcars.com/alberta_pilot_cars.html", region: "AB", country: "CA", name: "Alberta" },
    { url: "https://uspilotcars.com/british_columbia_pilot_cars.html", region: "BC", country: "CA", name: "British Columbia" },
    { url: "https://uspilotcars.com/nova_scotia_pilot_cars.html", region: "NS", country: "CA", name: "Nova Scotia" },
    { url: "https://uspilotcars.com/ontario_pilot_car.html", region: "ON", country: "CA", name: "Ontario" },
    { url: "https://uspilotcars.com/quebec_pilot_cars.html", region: "QC", country: "CA", name: "Quebec" },
    { url: "https://uspilotcars.com/saskatchewan_pilot_cars.html", region: "SK", country: "CA", name: "Saskatchewan" },
];

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HaulCommand/1.0)' },
            timeout: 15000
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchPage(res.headers.location).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** 
 * The site uses a consistent pattern in each state page:
 * After the premium ads and header, there's a 3-column table with listings:
 *   Col1: CITY\nCOMPANY\nPHONE  |  Col2: CITY\nCOMPANY\nPHONE  |  Col3: CITY\nCOMPANY\nPHONE
 * 
 * The key insight: the listing table cells contain text in this repeated pattern:
 *   - ALL CAPS CITY NAME
 *   - Company name (could be linked) + optional service codes (1 2 3 4)
 *   - Optional description line
 *   - Phone number (xxx-xxx-xxxx or (xxx) xxx-xxxx)
 *
 * We'll use the phone number as the anchor to work backwards.
 */
function parseListings(html, regionCode, countryCode, stateName) {
    const operators = [];

    // Extract all links for website lookups
    const linkMap = {};
    const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let lm;
    while ((lm = linkRe.exec(html)) !== null) {
        const linkText = lm[2].replace(/<[^>]*>/g, '').trim().toUpperCase();
        const href = lm[1].trim();
        if (linkText.length > 2 && href.startsWith('http') && !href.includes('uspilotcars.com')
            && !href.includes('truck_stop') && !href.includes('riskmanagers') && !href.includes('legalshield')) {
            linkMap[linkText] = href;
        }
    }

    // Strategy: find all phone numbers in the page, then look backwards for company + city
    const stripped = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Split by table cells to isolate listing blocks
    const cellBlocks = stripped.split(/<\/td>/i);

    for (const block of cellBlocks) {
        const text = block
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/?(p|div|tr|li|h\d)[^>]*>/gi, '\n')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '')
            .replace(/\r/g, '')
            .replace(/[ \t]+/g, ' ');

        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);

        // Find phone numbers and work backwards
        for (let i = 0; i < lines.length; i++) {
            const phoneMatch = lines[i].match(/^\s*\(?\s*(\d{3})\s*\)?\s*[\-\.\s]+(\d{3})\s*[\-\.\s]+(\d{4})\s*$/);
            if (!phoneMatch) continue;

            const phone = `${phoneMatch[1]}-${phoneMatch[2]}-${phoneMatch[3]}`;

            // Look backwards for company name (1-2 lines up)
            let companyName = '';
            let city = '';
            let services = [];
            let website = '';
            let description = '';

            // Line right above phone = company (usually)
            if (i >= 1) {
                let compLine = lines[i - 1].trim();

                // Skip if it's just noise
                if (isNoise(compLine)) {
                    if (i >= 2) compLine = lines[i - 2].trim();
                    else continue;
                }

                // Extract service codes from end of company line
                const svcMatch = compLine.match(/\s+([1-4](?:\s+[1-4]){0,3})\s*$/);
                if (svcMatch) {
                    compLine = compLine.substring(0, compLine.length - svcMatch[0].length).trim();
                    services = parseSvcCodes(svcMatch[1]);
                }

                // Extract WITPAC/WINPAC
                compLine = compLine.replace(/\s*(WITPAC|WINPAC)\s*/gi, (_, tag) => {
                    services.push(tag.toUpperCase());
                    return '';
                }).trim();

                // Remove trailing "PERMITS" etc
                compLine = compLine.replace(/\s+PERMITS?\s*$/i, '').trim();

                companyName = compLine;

                // Check for website
                const upperComp = companyName.toUpperCase();
                if (linkMap[upperComp]) website = linkMap[upperComp];

                // Look 2 lines up for city
                let cityIdx = i - 2;
                // If we used i-2 for company, look at i-3
                if (lines[i - 1] && isNoise(lines[i - 1].trim())) cityIdx = i - 3;

                if (cityIdx >= 0) {
                    const maybeCityLine = lines[cityIdx].trim();
                    if (looksLikeCity(maybeCityLine)) {
                        city = maybeCityLine;
                    }
                }

                // Check if there's a description between company and phone
                if (i >= 2 && !looksLikeCity(lines[i - 1].trim()) && lines[i - 1].trim() !== companyName) {
                    const descLine = lines[i - 1].trim();
                    if (!isNoise(descLine) && !descLine.match(/^\(?\d{3}\)?[\s\-\.]+\d{3}/) && descLine.length > 5) {
                        // The company might actually be one more line up
                        if (i >= 2 && looksLikeCity(lines[i - 2]?.trim())) {
                            // Pattern: CITY -> COMPANY -> DESC -> PHONE — desc line is description
                            description = descLine;
                        }
                    }
                }
            }

            // Validate: must have a reasonable company name
            if (!companyName || companyName.length < 3) continue;
            if (isNoise(companyName)) continue;
            if (/^\d+$/.test(companyName)) continue;
            if (companyName.length > 80) continue;
            // Skip if company looks like a phone
            if (/^\(?\d{3}\)?\s*[\-\.]\s*\d{3}/.test(companyName)) continue;
            // Skip hotel listings
            if (/motel|inn|hotel|wyndham|la quinta|baymont/i.test(companyName)) continue;

            operators.push({
                name: titleCase(companyName),
                city: city ? titleCase(cleanCity(city)) : '',
                region_code: regionCode,
                country_code: countryCode,
                state_name: stateName,
                phone,
                website: cleanUrl(website),
                services: [...new Set(services)],
                description: description.substring(0, 200),
                source: 'uspilotcars.com',
            });
        }
    }

    // Also try to catch inline-format listings: "CITY, STATE | COMPANY | PHONE"
    const inlineRe = /([A-Z][A-Z\s,/.]+),\s*([A-Z]{2})\s*\|\s*(.+?)\s*\|\s*(\d{3}[\-\.\s]\d{3}[\-\.\s]\d{4})/g;
    let im;
    while ((im = inlineRe.exec(html.replace(/<[^>]*>/g, ' '))) !== null) {
        const city = im[1].trim();
        const state = im[2].trim();
        const company = im[3].replace(/<[^>]*>/g, '').trim();
        const phone = im[4].replace(/[\.\s]/g, '-');

        if (state === regionCode && company.length > 2 && !isNoise(company)) {
            operators.push({
                name: titleCase(company),
                city: titleCase(city),
                region_code: regionCode,
                country_code: countryCode,
                state_name: stateName,
                phone,
                website: linkMap[company.toUpperCase()] ? cleanUrl(linkMap[company.toUpperCase()]) : '',
                services: [],
                description: '',
                source: 'uspilotcars.com',
            });
        }
    }

    return operators;
}

function isNoise(line) {
    if (!line || line.length < 2) return true;
    const patterns = [
        /^superscript/i, /listing update/i, /truck stop/i, /privacy/i,
        /pilot car directory/i, /pilot car regulations/i, /call us now/i,
        /free breakfast/i, /free parking/i, /guest laundry/i, /pet friendly/i,
        /discounted rates/i, /pilot car rate/i, /motel 6/i, /studio 6/i,
        /baymont/i, /la quinta/i, /atrea inn/i, /women business/i, /sc&ra/i,
        /workman.*comp/i, /msg.*data/i, /reply stop/i, /permit division/i,
        /bucket truck division/i, /escort coordinator/i, /multi-cars.*national/i,
        /safety is our priority/i, /nationwide.*steer.*height/i, /uspilotcars/i,
        /giving us your phone/i, /acknowledging/i, /walking distance/i,
        /continental/i, /newly renovated/i, /remodeled/i, /nice rooms/i,
        /dining.*shopping/i, /entertainment/i, /^home$/i, /^find a pilot/i,
        /^pilot car$/i, /^escorts$/i, /^route survey$/i, /^height pole$/i,
        /^hot stick$/i, /^steerman$/i, /^permits?$/i, /^services:?$/i,
        /professional pilot car insurance/i, /call.*quote.*now/i, /risk managers/i,
        /occupational accident/i, /legalshield/i, /charles james/i, /oversize load/i,
        /^\$\d+.*insurance/i, /^\d+\s+(bulldog|dumas|mesa)/i,
        /^[a-z]\s*$/i, /^p\s+i\s+l\s+o/i, /^p\s+r\s+o\s+f/i,
        /^c\s+a\s+l\s+l/i, /^[a-z]\s+[a-z]\s+[a-z]\s+[a-z]/i,
        /pilot cars drivers/i, /\$1,000,000/i, /compensation/i,
        /certified.*insured/i, /insured.*certified/i,
        /^\d+\s+i-\d+/i, /paramount blvd/i,
        /^your safety/i, /going the distance/i,
        /we'll get you from/i, /full service pilot car company/i,
        /experienced.*lower 48/i, /highly experienced/i,
        /all credit cards/i, /check or cc/i,
    ];
    return patterns.some(p => p.test(line));
}

function looksLikeCity(line) {
    if (!line || line.length < 3 || line.length > 35) return false;
    // Remove slash/ampersand separators
    const cleaned = line.replace(/[\/\-&,]/g, ' ').replace(/\s+/g, ' ').trim();
    // Must be all uppercase letters/spaces (no digits)
    if (/\d/.test(cleaned)) return false;
    if (cleaned !== cleaned.toUpperCase()) return false;
    // Not a known non-city
    if (/PERMIT|INSURANCE|CERTIFIED|HEIGHT|ROUTE|BUCKET|SAFETY|VETERAN|NATIONWIDE|SERVICE|STEERING|LEAD|CHASE|FAMILY|OPERATED/i.test(cleaned)) return false;
    return true;
}

function cleanCity(city) {
    return city.replace(/[\/]/g, ' / ').replace(/\s+/g, ' ').trim();
}

function cleanUrl(url) {
    if (!url) return '';
    try {
        const u = new URL(url.startsWith('//') ? 'https:' + url : url);
        if (u.hostname.includes('facebook.com')) return url;
        return u.origin + u.pathname;
    } catch { return ''; }
}

function parseSvcCodes(str) {
    const map = { '1': 'height_pole', '2': 'route_survey', '3': 'multiple_cars', '4': 'steering' };
    return str.trim().split(/\s+/).filter(c => map[c]).map(c => map[c]);
}

function titleCase(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace(/\bLlc\b/g, 'LLC')
        .replace(/\bInc\b/g, 'Inc.')
        .replace(/\bPcs\b/g, 'PCS')
        .replace(/\bSvcs?\b/gi, 'Svcs')
        .replace(/\bSvc\b/g, 'Svc');
}

/**
 * Generate a claim hash for each operator.
 * This will be used in /claim/invite/{hash} URLs.
 */
function generateClaimHash(name, phone, region) {
    const input = `${name}::${phone}::${region}::haulcommand2026`;
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}

/**
 * Deduplicate by normalized name+phone, merging multi-region operators.
 */
function dedup(operators) {
    const seen = new Map();
    const result = [];

    for (const op of operators) {
        const normName = op.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normPhone = op.phone.replace(/\D/g, '');
        const key = normPhone ? `${normName}__${normPhone}` : `${normName}__${op.city.toLowerCase()}__${op.region_code}`;

        if (seen.has(key)) {
            const existing = seen.get(key);
            // Merge cities
            if (op.city && existing.city !== op.city) {
                existing.additional_cities = existing.additional_cities || [];
                if (!existing.additional_cities.includes(op.city) && existing.additional_cities.length < 20) {
                    existing.additional_cities.push(op.city);
                }
            }
            // Merge regions
            if (existing.region_code !== op.region_code) {
                existing.additional_regions = existing.additional_regions || [];
                if (!existing.additional_regions.includes(op.region_code)) {
                    existing.additional_regions.push(op.region_code);
                }
            }
            // Merge services
            if (op.services.length) existing.services = [...new Set([...existing.services, ...op.services])];
            if (!existing.website && op.website) existing.website = op.website;
            if (!existing.description && op.description) existing.description = op.description;
        } else {
            const entry = { ...op, additional_cities: [], additional_regions: [] };
            seen.set(key, entry);
            result.push(entry);
        }
    }
    return result;
}

// ── Main ──
async function main() {
    console.log('🚀 USPilotCars.com Full Scraper v2');
    console.log(`📋 ${STATE_URLS.length} pages to scrape\n`);

    const all = [];
    const errors = [];

    for (let i = 0; i < STATE_URLS.length; i++) {
        const { url, region, country, name } = STATE_URLS[i];
        process.stdout.write(`[${i + 1}/${STATE_URLS.length}] ${name} (${region})... `);
        try {
            const html = await fetchPage(url);
            const ops = parseListings(html, region, country, name);
            all.push(...ops);
            console.log(`✅ ${ops.length} listings`);
        } catch (err) {
            console.log(`❌ ${err.message}`);
            errors.push({ url, region, error: err.message });
        }
        await sleep(400);
    }

    console.log('\n──────────────────────────────────────');
    console.log(`📊 Raw: ${all.length}`);

    const deduped = dedup(all);
    console.log(`📊 Deduped: ${deduped.length}`);

    // Add claim hashes and claim URLs
    for (const op of deduped) {
        op.claim_hash = generateClaimHash(op.name, op.phone, op.region_code);
        op.claim_url = `https://haulcommand.com/claim/invite/${op.claim_hash}`;
        op.claim_status = 'unclaimed';
        op.entity_type = 'escort_operator';
        // Generate slug
        op.slug = op.name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 60);
    }

    // Stats
    const withPhone = deduped.filter(o => o.phone).length;
    const withSite = deduped.filter(o => o.website).length;
    const withSvc = deduped.filter(o => o.services.length > 0).length;
    const withCity = deduped.filter(o => o.city).length;
    const multiRegion = deduped.filter(o => o.additional_regions.length > 0).length;

    console.log(`\n📊 Data Quality:`);
    console.log(`   With phone:      ${withPhone} (${Math.round(withPhone / deduped.length * 100)}%)`);
    console.log(`   With website:    ${withSite} (${Math.round(withSite / deduped.length * 100)}%)`);
    console.log(`   With city:       ${withCity} (${Math.round(withCity / deduped.length * 100)}%)`);
    console.log(`   With services:   ${withSvc} (${Math.round(withSvc / deduped.length * 100)}%)`);
    console.log(`   Multi-region:    ${multiRegion}`);

    if (errors.length) {
        console.log(`\n⚠️  Errors: ${errors.length}`);
        errors.forEach(e => console.log(`   ${e.region}: ${e.error}`));
    }

    // Top states
    const byRegion = {};
    for (const op of deduped) {
        byRegion[op.region_code] = (byRegion[op.region_code] || 0) + 1;
    }
    console.log('\n📊 Top 15 States:');
    Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 15)
        .forEach(([k, v]) => console.log(`   ${k}: ${v}`));

    // Sample output
    console.log('\n📋 Sample 5 operators:');
    deduped.filter(o => o.phone && o.city).slice(0, 5).forEach(op => {
        console.log(`   ${op.name} | ${op.city}, ${op.region_code} | ${op.phone} | ${op.claim_url}`);
    });

    // Write JSON
    const outJson = path.join(__dirname, 'uspilotcars_seed_v2.json');
    fs.writeFileSync(outJson, JSON.stringify({
        scraped_at: new Date().toISOString(),
        source: 'uspilotcars.com',
        total_raw: all.length,
        total_deduped: deduped.length,
        errors,
        operators: deduped,
    }, null, 2));
    console.log(`\n💾 JSON: ${outJson}`);

    // Write CSV
    const csvPath = path.join(__dirname, 'uspilotcars_seed_v2.csv');
    const hdr = 'name,city,region_code,country_code,phone,website,services,slug,claim_hash,claim_url,additional_cities,additional_regions\n';
    const rows = deduped.map(o => [
        q(o.name), q(o.city), o.region_code, o.country_code, o.phone, o.website,
        q((o.services || []).join(';')), o.slug, o.claim_hash, o.claim_url,
        q((o.additional_cities || []).join(';')), q((o.additional_regions || []).join(';')),
    ].join(','));
    fs.writeFileSync(csvPath, hdr + rows.join('\n'));
    console.log(`💾 CSV: ${csvPath}`);

    // Write Supabase-ready SQL insert
    const sqlPath = path.join(__dirname, 'uspilotcars_seed_insert.sql');
    let sql = `-- USPilotCars.com seed data — ${deduped.length} operators\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- Target table: directory_listings\n\n`;
    sql += `INSERT INTO directory_listings (name, slug, entity_type, city, region_code, country_code, claim_status, is_visible, rank_score, metadata)\nVALUES\n`;
    const sqlRows = deduped.map(op => {
        const meta = JSON.stringify({
            phone: op.phone,
            website: op.website,
            services: op.services,
            claim_hash: op.claim_hash,
            source: 'uspilotcars.com',
            additional_cities: op.additional_cities,
            additional_regions: op.additional_regions,
        }).replace(/'/g, "''");
        return `  ('${esc(op.name)}', '${esc(op.slug)}', 'escort_operator', '${esc(op.city)}', '${esc(op.region_code)}', '${esc(op.country_code)}', 'unclaimed', true, 10, '${meta}'::jsonb)`;
    });
    sql += sqlRows.join(',\n');
    sql += `\nON CONFLICT (slug) DO UPDATE SET\n  metadata = EXCLUDED.metadata,\n  city = COALESCE(NULLIF(EXCLUDED.city, ''), directory_listings.city),\n  region_code = COALESCE(NULLIF(EXCLUDED.region_code, ''), directory_listings.region_code);\n`;
    fs.writeFileSync(sqlPath, sql);
    console.log(`💾 SQL: ${sqlPath}`);

    console.log('\n✅ Done! Ready for Supabase seeding + claim email campaign.');
}

function q(s) { return `"${(s || '').replace(/"/g, '""')}"`; }
function esc(s) { return (s || '').replace(/'/g, "''"); }

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
