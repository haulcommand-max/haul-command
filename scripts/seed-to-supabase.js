/**
 * Seed operators into Supabase using the REST API with service role key.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// Load env - robust parser
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
        env[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim();
    }
}

const SUPABASE_URL = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
console.log('ENV:', { url: SUPABASE_URL ? 'set' : 'MISSING', key: SUPABASE_KEY ? `set (${SUPABASE_KEY.length}c)` : 'MISSING' });
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌ Missing env'); process.exit(1); }

// Load seed data
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed_final.json'), 'utf8'));
const operators = data.operators.filter(op => {
    if (!op.name || op.name.length < 3) return false;
    if (/^workers$/i.test(op.name) || /^cards$/i.test(op.name)) return false;
    return true;
});
console.log(`🚀 Seeding ${operators.length} operators`);

function makeSlug(name) {
    const uid = crypto.randomUUID().substring(0, 8);
    return name.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 50) + '-' + uid;
}

function buildRow(op) {
    const uuid = crypto.randomUUID();
    let conf = 0.50 + (op.phone ? 0.15 : 0) + (op.city ? 0.10 : 0) + (op.website ? 0.10 : 0) + ((op.services || []).length > 0 ? 0.05 : 0);
    let comp = 0.20 + (op.phone ? 0.20 : 0) + (op.city ? 0.15 : 0) + (op.website ? 0.15 : 0) + ((op.services || []).length > 0 ? 0.15 : 0);
    let pri = 0.50 + (op.phone ? 0.15 : 0) + (op.website ? 0.15 : 0) + ((op.additional_regions || []).length > 0 ? 0.10 : 0);
    return {
        entity_type: 'pilot_car_operator', entity_id: uuid, name: op.name, slug: makeSlug(op.name),
        city: op.city || null, city_slug: op.city ? op.city.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 40) : null,
        region_code: op.region_code, country_code: op.country_code, source: 'uspilotcars.com',
        claim_status: 'unclaimed', claim_hash: op.claim_hash, rank_score: 10, is_visible: true,
        entity_confidence_score: Math.min(conf, 0.95), profile_completeness: Math.min(comp, 0.95), claim_priority_score: Math.min(pri, 0.95),
        metadata: { phone: op.phone || null, website: op.website || null, services: op.services || [], claim_hash: op.claim_hash, source: 'uspilotcars.com', additional_cities: op.additional_cities || [], additional_regions: op.additional_regions || [] }
    };
}

function post(tablePath, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(`/rest/v1/${tablePath}`, SUPABASE_URL);
        const postData = JSON.stringify(body);
        const req = https.request({
            hostname: url.hostname, path: url.pathname, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'resolution=ignore-duplicates,return=minimal', 'Content-Length': Buffer.byteLength(postData) },
            timeout: 30000
        }, (res) => {
            let d = ''; res.on('data', c => d += c);
            res.on('end', () => res.statusCode < 300 ? resolve({ status: res.statusCode }) : reject(new Error(`HTTP ${res.statusCode}: ${d.substring(0, 200)}`)));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        req.write(postData); req.end();
    });
}

async function main() {
    const BATCH = 50;
    let inserted = 0, errors = 0;
    for (let i = 0; i < operators.length; i += BATCH) {
        const batch = operators.slice(i, i + BATCH);
        const rows = batch.map(buildRow);
        const bn = Math.floor(i / BATCH) + 1, tb = Math.ceil(operators.length / BATCH);
        process.stdout.write(`[${bn}/${tb}] ${rows.length} rows... `);
        try {
            await post('directory_listings', rows);
            inserted += rows.length;
            console.log('✅');
        } catch (err) {
            errors++;
            console.log(`❌ ${err.message.substring(0, 80)}`);
            // Retry individually
            let rec = 0;
            for (const row of rows) { try { await post('directory_listings', [row]); rec++; inserted++; } catch (e) { } }
            if (rec) console.log(`   ↳ Recovered ${rec}/${rows.length}`);
        }
    }
    console.log(`\n📊 Inserted: ${inserted} | Errors: ${errors} batches`);
    console.log('✅ Seed complete!');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
