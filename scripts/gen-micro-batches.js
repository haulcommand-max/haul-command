/**
 * Generate micro-batches (50 rows each) as individual SQL files
 * small enough for the Supabase MCP execute_sql tool.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateCanonicalSlug, generateCitySlug, batchGenerateSlugs, logSlugEvent } = require('./lib/slugify');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed_final.json'), 'utf8'));
const operators = data.operators.filter(op => {
    if (!op.name || op.name.length < 3) return false;
    if (/^workers$/i.test(op.name) || /^cards$/i.test(op.name)) return false;
    if (/program$/i.test(op.name) && op.name.length < 15) return false;
    return true;
});

function esc(s) { return (s || '').replace(/'/g, "''"); }

// Slug generation now uses shared canonical contract (scripts/lib/slugify.js)

const MICRO_BATCH = 50;
const totalBatches = Math.ceil(operators.length / MICRO_BATCH);

console.log(`Total operators: ${operators.length}`);
console.log(`Micro-batches: ${totalBatches} (${MICRO_BATCH} rows each)`);

for (let b = 0; b < totalBatches; b++) {
    const batch = operators.slice(b * MICRO_BATCH, (b + 1) * MICRO_BATCH);

    let sql = `INSERT INTO directory_listings (entity_type, entity_id, name, slug, city, city_slug, region_code, country_code, source, claim_status, claim_hash, rank_score, is_visible, entity_confidence_score, profile_completeness, claim_priority_score, metadata)\nVALUES\n`;

    const rows = batch.map(op => {
        const uuid = crypto.randomUUID();
        const slug = generateCanonicalSlug(op.name, op.region_code || '', 'pilot_car_operator');
        const citySlug = generateCitySlug(op.city);

        let conf = 0.50;
        if (op.phone) conf += 0.15;
        if (op.city) conf += 0.10;
        if (op.website) conf += 0.10;
        if (op.services?.length > 0) conf += 0.05;
        conf = Math.min(conf, 0.95);

        let completeness = 0.20;
        if (op.phone) completeness += 0.20;
        if (op.city) completeness += 0.15;
        if (op.website) completeness += 0.15;
        if (op.services?.length > 0) completeness += 0.15;
        completeness = Math.min(completeness, 0.95);

        let claimPri = 0.50;
        if (op.phone) claimPri += 0.15;
        if (op.website) claimPri += 0.15;
        if ((op.additional_regions || []).length > 0) claimPri += 0.10;
        claimPri = Math.min(claimPri, 0.95);

        const meta = JSON.stringify({
            phone: op.phone || null,
            website: op.website || null,
            services: op.services || [],
            claim_hash: op.claim_hash,
            source: 'uspilotcars.com',
            additional_cities: op.additional_cities || [],
            additional_regions: op.additional_regions || [],
        }).replace(/'/g, "''");

        return `('pilot_car_operator','${uuid}','${esc(op.name)}','${esc(slug)}',${op.city ? `'${esc(op.city)}'` : 'NULL'},${citySlug ? `'${esc(citySlug)}'` : 'NULL'},'${esc(op.region_code)}','${esc(op.country_code)}','uspilotcars.com','unclaimed','${op.claim_hash}',10,true,${conf.toFixed(2)},${completeness.toFixed(2)},${claimPri.toFixed(2)},'${meta}'::jsonb)`;
    });

    sql += rows.join(',\n') + '\nON CONFLICT (slug) DO UPDATE SET\n  metadata = directory_listings.metadata || EXCLUDED.metadata,\n  city = COALESCE(NULLIF(EXCLUDED.city, \'\'), directory_listings.city);';

    const fp = path.join(__dirname, 'micro', `mb_${String(b + 1).padStart(2, '0')}.sql`);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, sql);
}

// Batch collision pre-flight check
const slugEntries = operators.map(op => ({
    name: op.name,
    disambiguator: op.region_code || '',
    entityType: 'pilot_car_operator',
}));
const { collisions } = batchGenerateSlugs(slugEntries);
if (collisions.length > 0) {
    for (const c of collisions) {
        logSlugEvent({
            script_name: 'gen-micro-batches',
            source_name: 'uspilotcars.com',
            entity_name: operators[c.indices[0]]?.name,
            attempted_slug: c.slug,
            collision_count: c.indices.length,
            insert_outcome: 'collision_preflight',
        });
    }
}

console.log(`✅ Wrote ${totalBatches} micro-batch files to scripts/micro/`);
console.log(`   Ready for Supabase MCP execute_sql`);
