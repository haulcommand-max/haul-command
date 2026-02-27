/**
 * Merge & clean seed data from both scraper runs.
 * Takes the larger v1 dataset and applies strict validation
 * using v2's phone-verified data as a quality baseline.
 * Outputs final Supabase-ready data + claim infrastructure.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const v1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'uspilotcars_seed_data.json'), 'utf8'));
const v2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'uspilotcars_seed_v2.json'), 'utf8'));

// ── Strict validation ──
function isValidOperator(op) {
    if (!op.name || op.name.length < 3 || op.name.length > 80) return false;

    // Must not be noise
    const noise = [
        /pilots for the ny/i, /permits.*dispatching/i, /related to your account/i,
        /lake city.*fl/i, /mobile.*al\s*\|/i, /height pole/i, /route survey/i,
        /lead.*chase/i, /wa.*cert/i, /family operated/i, /safety is key/i,
        /privacy policy/i, /pilot car directory/i, /all credit cards/i,
        /free breakfast/i, /free parking/i, /guest laundry/i, /pet friendly/i,
        /motel 6/i, /studio 6/i, /baymont/i, /la quinta/i, /atrea inn/i,
        /permit division/i, /bucket truck division/i, /escort coordinator/i,
        /multi-cars.*national/i, /\binsurance\b/i, /\binsured\b/i,
        /women business/i, /sc&ra/i, /workman/i, /certified/i,
        /the most visited/i, /the most complete/i, /most informative/i,
        /call us now/i, /legalshield/i, /risk managers/i, /charles james/i,
        /oversize load/i, /professional pilot car ins/i, /call.*quote/i,
        /experienced.*lower.*48/i, /highly experienced/i, /veteran owned/i,
        /going the distance/i, /we'll get you/i, /your safety/i,
        /full service pilot car company/i, /check or cc/i, /accommodations/i,
        /dining.*shopping/i, /entertainment/i, /newly renovated/i,
        /remodeled/i, /nice rooms/i, /walking distance/i, /continental/i,
        /free.*hot.*breakfast/i, /pilot car rate/i, /discounted/i,
        /^[a-z]\s+[a-z]\s+[a-z]\s+[a-z]/i, /program$/i, /^workers$/i,
        /acknowledging/i, /giving us your phone/i, /msg.*data/i,
        /reply stop/i, /uspilotcars/i, /^services$/i, /^permits?$/i,
        /^escorts$/i, /^steerman$/i, /^hot stick$/i, /^height pole$/i,
        /^route survey$/i, /^bucket trucks?$/i, /^pilot cars?$/i,
        /^home$/i, /^find a pilot/i, /^pilot car regulations/i,
        /^listing update/i, /superscript indicate/i, /truck stop/i,
        /^[a-z]$/i, /occupational accident/i, /compensation/i,
        /$1,000,000/i, /pilot cars drivers/i, /\bwyndham\b/i,
        /\bparamount\b/i, /\b(exit|bulldog|dumas|mesa)\b/i,
        /^\d+ .*blvd/i, /^\d+ .*ave/i, /^\d+ .*st\b/i,
        /national service$/i, /^p\s+r\s+o/i, /^c\s+a\s+l/i,
        /comprehensive/i, /alabama|alaska|arizona|arkansas|california/i,
    ];
    if (noise.some(p => p.test(op.name))) return false;

    // Must not be just a phone number
    if (/^\(?\d{3}\)?[\s\-\.]+\d{3}/.test(op.name)) return false;

    // Must not be a state vertical text artifact
    if (/^[A-Z]\s*$/.test(op.name) || op.name.split(/\s+/).every(w => w.length <= 2)) return false;

    // City must not be noise
    if (op.city) {
        const cityNoise = [
            /pilot car/i, /permits?/i, /insurance/i, /bucket/i, /division/i,
            /service/i, /national/i, /program/i, /certified/i, /height/i,
            /escort/i, /route/i, /^black beard$/i, /only\)$/i,
        ];
        if (cityNoise.some(p => p.test(op.city))) {
            op.city = ''; // Clear bad city, keep operator
        }
    }

    return true;
}

function normalizePhone(phone) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length === 11 && digits[0] === '1') return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    return phone;
}

function generateClaimHash(name, phone, region) {
    return crypto.createHash('sha256')
        .update(`${name}::${phone}::${region}::haulcommand2026`)
        .digest('hex').substring(0, 16);
}

function slug(name) {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 60);
}

function titleCase(str) {
    if (!str) return '';
    return str.toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace(/\bLlc\b/g, 'LLC')
        .replace(/\bInc\b\./g, 'Inc.')
        .replace(/\bPcs\b/g, 'PCS')
        .replace(/\bSvcs?\b/gi, 'Svcs');
}

// ── Merge both datasets ──
console.log(`📊 v1 raw: ${v1.operators.length}`);
console.log(`📊 v2 raw: ${v2.operators.length}`);

const allOps = [];

// Add v2 first (higher quality - phone anchored)
for (const op of v2.operators) {
    op.phone = normalizePhone(op.phone);
    op.name = titleCase(op.name || '');
    op.city = titleCase(op.city || '');
    if (isValidOperator(op)) allOps.push(op);
}

// Add v1 entries that pass validation
for (const op of v1.operators) {
    op.phone = normalizePhone(op.phone);
    op.name = titleCase(op.name || '');
    op.city = titleCase(op.city || '');
    if (isValidOperator(op)) allOps.push(op);
}

console.log(`📊 After validation: ${allOps.length}`);

// ── Deduplicate ──
const seen = new Map();
const final = [];

for (const op of allOps) {
    const normName = op.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normPhone = (op.phone || '').replace(/\D/g, '');
    const key = normPhone && normPhone.length === 10
        ? `${normName}__${normPhone}`
        : `${normName}__${(op.city || '').toLowerCase()}__${op.region_code}`;

    if (seen.has(key)) {
        const existing = seen.get(key);
        // Merge
        if (op.city && !existing.city) existing.city = op.city;
        if (op.phone && !existing.phone) existing.phone = op.phone;
        if (op.website && !existing.website) existing.website = op.website;
        if (op.services?.length) existing.services = [...new Set([...(existing.services || []), ...op.services])];
        if (op.region_code !== existing.region_code) {
            existing.additional_regions = existing.additional_regions || [];
            if (!existing.additional_regions.includes(op.region_code)) existing.additional_regions.push(op.region_code);
        }
        if (op.city && existing.city !== op.city) {
            existing.additional_cities = existing.additional_cities || [];
            if (!existing.additional_cities.includes(op.city) && existing.additional_cities.length < 20) {
                existing.additional_cities.push(op.city);
            }
        }
    } else {
        const entry = {
            ...op,
            additional_cities: op.additional_cities || [],
            additional_regions: op.additional_regions || [],
            services: op.services || [],
        };
        seen.set(key, entry);
        final.push(entry);
    }
}

// Add claim infrastructure
for (const op of final) {
    op.claim_hash = generateClaimHash(op.name, op.phone || '', op.region_code);
    op.claim_url = `https://haulcommand.com/claim/invite/${op.claim_hash}`;
    op.claim_status = 'unclaimed';
    op.entity_type = 'escort_operator';
    op.slug = slug(op.name);
    op.is_visible = true;
    op.rank_score = 10; // base score for unclaimed
}

console.log(`📊 Final deduped: ${final.length}`);

// Stats
const withPhone = final.filter(o => o.phone).length;
const withSite = final.filter(o => o.website).length;
const withCity = final.filter(o => o.city).length;
const withSvc = final.filter(o => o.services.length > 0).length;
const multiRegion = final.filter(o => (o.additional_regions || []).length > 0).length;
const byCountry = {};
const byRegion = {};
for (const op of final) {
    byCountry[op.country_code] = (byCountry[op.country_code] || 0) + 1;
    byRegion[op.region_code] = (byRegion[op.region_code] || 0) + 1;
}

console.log(`\n📊 Data Quality:`);
console.log(`   With phone:      ${withPhone} (${Math.round(withPhone / final.length * 100)}%)`);
console.log(`   With website:    ${withSite} (${Math.round(withSite / final.length * 100)}%)`);
console.log(`   With city:       ${withCity} (${Math.round(withCity / final.length * 100)}%)`);
console.log(`   With services:   ${withSvc} (${Math.round(withSvc / final.length * 100)}%)`);
console.log(`   Multi-region:    ${multiRegion}`);
console.log(`\n📊 By Country:`);
Object.entries(byCountry).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`   ${k}: ${v}`));
console.log('\n📊 Top 15 Regions:');
Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

// Sample
console.log('\n📋 Sample Clean Operators:');
final.filter(o => o.phone && o.city).slice(0, 10).forEach(op => {
    console.log(`   ${op.name} | ${op.city}, ${op.region_code} | ${op.phone} | svc: ${op.services.join(',') || 'none'}`);
});

// ── Write outputs ──
const outJson = path.join(__dirname, 'seed_final.json');
fs.writeFileSync(outJson, JSON.stringify({
    generated_at: new Date().toISOString(),
    source: 'uspilotcars.com',
    total: final.length,
    claim_email_date: '2026-03-26',
    operators: final,
}, null, 2));
console.log(`\n💾 JSON: ${outJson}`);

// CSV
const csvPath = path.join(__dirname, 'seed_final.csv');
const hdr = 'name,city,region_code,country_code,phone,website,services,slug,claim_hash,claim_url,additional_cities,additional_regions\n';
const rows = final.map(o => [
    q(o.name), q(o.city), o.region_code, o.country_code, o.phone || '', o.website || '',
    q((o.services || []).join(';')), o.slug, o.claim_hash, o.claim_url,
    q((o.additional_cities || []).join(';')), q((o.additional_regions || []).join(';')),
].join(','));
fs.writeFileSync(csvPath, hdr + rows.join('\n'));
console.log(`💾 CSV: ${csvPath}`);

// Supabase SQL
const sqlPath = path.join(__dirname, 'seed_final_insert.sql');
let sql = `-- Haul Command Directory Seed — ${final.length} operators from uspilotcars.com\n`;
sql += `-- Generated: ${new Date().toISOString()}\n`;
sql += `-- Claim emails scheduled: 2026-03-26\n\n`;
sql += `INSERT INTO directory_listings (name, slug, entity_type, city, region_code, country_code, claim_status, is_visible, rank_score, metadata)\nVALUES\n`;
const sqlRows = final.map(op => {
    const meta = JSON.stringify({
        phone: op.phone || null,
        website: op.website || null,
        services: op.services,
        claim_hash: op.claim_hash,
        source: 'uspilotcars.com',
        additional_cities: op.additional_cities,
        additional_regions: op.additional_regions,
        scraped_at: new Date().toISOString(),
    }).replace(/'/g, "''");
    return `  ('${esc(op.name)}', '${esc(op.slug)}', 'escort_operator', ${op.city ? `'${esc(op.city)}'` : 'NULL'}, '${esc(op.region_code)}', '${esc(op.country_code)}', 'unclaimed', true, 10, '${meta}'::jsonb)`;
});
sql += sqlRows.join(',\n');
sql += `\nON CONFLICT (slug) DO UPDATE SET\n  metadata = directory_listings.metadata || EXCLUDED.metadata,\n  city = COALESCE(NULLIF(EXCLUDED.city, ''), directory_listings.city),\n  region_code = COALESCE(NULLIF(EXCLUDED.region_code, ''), directory_listings.region_code);\n`;
fs.writeFileSync(sqlPath, sql);
console.log(`💾 SQL: ${sqlPath}`);

console.log('\n✅ Seed data ready. Next steps:');
console.log('   1. Run seed_final_insert.sql in Supabase');
console.log('   2. Wire /claim/invite/[hash] route to look up claim_hash in metadata');
console.log('   3. Schedule email campaign for 2026-03-26');
console.log('   4. Scrape additional sources for 10X expansion');

function q(s) { return `"${(s || '').replace(/"/g, '""')}"`; }
function esc(s) { return (s || '').replace(/'/g, "''"); }
