/**
 * Generate Supabase-ready SQL from seed_final.json
 * Matches the existing directory_listings schema exactly:
 *   entity_type = 'pilot_car_operator' (matching existing pattern)
 *   entity_id = generated UUID
 *   slug = name-slug-XXXXX (with UUID fragment to avoid conflicts)
 * 
 * Outputs batched SQL files (500 rows per batch) for safe ingestion.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { generateCanonicalSlug, generateCitySlug, batchGenerateSlugs, logSlugEvent } = require('./lib/slugify');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed_final.json'), 'utf8'));
const operators = data.operators;

// Filter to quality operators only
const valid = operators.filter(op => {
    if (!op.name || op.name.length < 3) return false;
    // Must not still have noise
    if (/^workers$/i.test(op.name)) return false;
    if (/^cards$/i.test(op.name)) return false;
    if (/program$/i.test(op.name) && op.name.length < 15) return false;
    return true;
});

console.log(`📊 Valid operators: ${valid.length} / ${operators.length}`);

function genUuid() {
    return crypto.randomUUID();
}

// Slug generation now uses shared canonical contract (scripts/lib/slugify.js)

function esc(s) { return (s || '').replace(/'/g, "''"); }

// Build batched SQL
const BATCH_SIZE = 200;
const batches = [];

for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = valid.slice(i, i + BATCH_SIZE);
    let sql = `-- Batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(valid.length / BATCH_SIZE)}\n`;
    sql += `-- USPilotCars.com seed: operators ${i + 1}-${Math.min(i + BATCH_SIZE, valid.length)}\n\n`;
    sql += `INSERT INTO directory_listings (entity_type, entity_id, name, slug, city, city_slug, region_code, country_code, source, claim_status, claim_hash, rank_score, is_visible, entity_confidence_score, profile_completeness, claim_priority_score, metadata)\nVALUES\n`;

    const rows = batch.map(op => {
        const uuid = genUuid();
        const slug = generateCanonicalSlug(op.name, op.region_code || '', 'pilot_car_operator');
        const citySlug = generateCitySlug(op.city);

        // Compute confidence score
        let conf = 0.50; // base
        if (op.phone) conf += 0.15;
        if (op.city) conf += 0.10;
        if (op.website) conf += 0.10;
        if (op.services && op.services.length > 0) conf += 0.05;
        if ((op.additional_regions || []).length > 0) conf += 0.05;
        conf = Math.min(conf, 0.95);

        // Profile completeness
        let completeness = 0.20; // has name + region
        if (op.phone) completeness += 0.20;
        if (op.city) completeness += 0.15;
        if (op.website) completeness += 0.15;
        if (op.services && op.services.length > 0) completeness += 0.15;
        if (op.description) completeness += 0.10;
        completeness = Math.min(completeness, 0.95);

        // Claim priority (higher = more valuable to claim)
        let claimPriority = 0.50;
        if (op.phone) claimPriority += 0.15;
        if (op.website) claimPriority += 0.15;
        if ((op.additional_regions || []).length > 0) claimPriority += 0.10;
        if (op.services && op.services.length >= 3) claimPriority += 0.10;
        claimPriority = Math.min(claimPriority, 0.95);

        const meta = JSON.stringify({
            phone: op.phone || null,
            website: op.website || null,
            services: op.services || [],
            claim_hash: op.claim_hash,
            source: 'uspilotcars.com',
            additional_cities: op.additional_cities || [],
            additional_regions: op.additional_regions || [],
            scraped_at: new Date().toISOString(),
        }).replace(/'/g, "''");

        return `  ('pilot_car_operator', '${uuid}', '${esc(op.name)}', '${esc(slug)}', ${op.city ? `'${esc(op.city)}'` : 'NULL'}, ${citySlug ? `'${esc(citySlug)}'` : 'NULL'}, '${esc(op.region_code)}', '${esc(op.country_code)}', 'uspilotcars.com', 'unclaimed', '${op.claim_hash}', 10, true, ${conf.toFixed(2)}, ${completeness.toFixed(2)}, ${claimPriority.toFixed(2)}, '${meta}'::jsonb)`;
    });

    sql += rows.join(',\n');
    sql += '\nON CONFLICT (slug) DO UPDATE SET\n  metadata = directory_listings.metadata || EXCLUDED.metadata,\n  city = COALESCE(NULLIF(EXCLUDED.city, \'\'), directory_listings.city);\n';
    batches.push(sql);
}

// Write combined SQL
const allSql = batches.join('\n\n');
const outPath = path.join(__dirname, 'seed_operators_supabase.sql');
fs.writeFileSync(outPath, allSql);
console.log(`💾 SQL: ${outPath}`);
console.log(`📦 ${batches.length} batches × ${BATCH_SIZE} max rows`);

// Also write individual batch files for safe execution
for (let i = 0; i < batches.length; i++) {
    const batchPath = path.join(__dirname, `seed_batch_${i + 1}.sql`);
    fs.writeFileSync(batchPath, batches[i]);
}
console.log(`💾 Individual batch files: seed_batch_1.sql - seed_batch_${batches.length}.sql`);

// Print sample
console.log('\n📋 Sample rows:');
valid.filter(o => o.phone && o.city).slice(0, 5).forEach(op => {
    console.log(`   ${op.name} | ${op.city}, ${op.region_code} | ${op.phone}`);
});

// Batch collision pre-flight check
const slugEntries = valid.map(op => ({
    name: op.name,
    disambiguator: op.region_code || '',
    entityType: 'pilot_car_operator',
}));
const { collisions } = batchGenerateSlugs(slugEntries);
if (collisions.length > 0) {
    console.warn(`\n⚠️  ${collisions.length} slug collisions detected in batch:`);
    for (const c of collisions) {
        logSlugEvent({
            script_name: 'gen-supabase-seed',
            source_name: 'uspilotcars.com',
            entity_name: valid[c.indices[0]]?.name,
            attempted_slug: c.slug,
            collision_count: c.indices.length,
            insert_outcome: 'collision_preflight',
        });
    }
}
