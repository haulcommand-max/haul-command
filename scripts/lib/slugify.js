/**
 * scripts/lib/slugify.js
 * 
 * Shared CJS slug generator for all ingestion/scrape/merge scripts.
 * Mirrors the canonical-slug.ts contract exactly:
 *   - Same normalization rules (&→and, apostrophe→strip, lowercase, hyphen-collapse)
 *   - Same SHA-256 hash suffix (8-char default, deterministic)
 *   - Same 120-char max
 * 
 * If a DB trigger (tg_directory_listings_slug_guard) is active, it acts as a safety net.
 * But scripts SHOULD still generate slugs for logging, dedup, and SQL-file workflows.
 * 
 * Usage:
 *   const { generateCanonicalSlug, generateSimpleSlug } = require('./lib/slugify');
 *   const slug = generateCanonicalSlug('Gulf Coast Movers', 'TX', 'pilot_car_operator');
 *   // → "gulf-coast-movers-33b68115"
 */

const crypto = require('crypto');

/**
 * Core slug generation. Deterministic: same inputs → same slug.
 * 
 * @param {string} name - Entity display name
 * @param {string} [disambiguator=''] - Region code, city, or other disambiguating string
 * @param {string} [entityType=''] - Entity type (pilot_car_operator, port, etc.)
 * @param {number} [hashLength=8] - Length of hex suffix
 * @returns {string} Canonical slug with hash suffix
 */
function generateCanonicalSlug(name, disambiguator, entityType, hashLength) {
    disambiguator = disambiguator || '';
    entityType = entityType || '';
    hashLength = hashLength || 8;

    // Step 1: Normalize the base slug (identical to canonical-slug.ts)
    const base = name
        .toLowerCase()
        .replace(/&/g, 'and')                    // & → and
        .replace(/['''\u2019]/g, '')             // apostrophes → nothing
        .replace(/[^a-z0-9\s-]/g, '')            // strip non-alphanumeric except spaces/hyphens
        .replace(/\s+/g, '-')                    // collapse spaces to hyphens
        .replace(/-+/g, '-')                     // collapse multiple hyphens
        .replace(/^-|-$/g, '')                   // trim leading/trailing hyphens
        .substring(0, 100);                      // max base length

    // Step 2: Deterministic hash suffix (identical input → identical output)
    const hashInput = `${name.trim()}::${disambiguator.trim()}::${entityType.trim()}`.toLowerCase();
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, hashLength);

    // Step 3: Combine
    return `${base}-${hash}`.substring(0, 120);
}

/**
 * Simple slug for well-known entities (ports, cities) where name collision is near impossible.
 * No hash suffix.
 * 
 * @param {string} name
 * @returns {string}
 */
function generateSimpleSlug(name) {
    return name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/['''\u2019]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 120);
}

/**
 * Canonical city slug generation.
 * Replaces all ad-hoc city.toLowerCase().replace(...) patterns.
 * No hash suffix — city slugs are disambiguated at the composite level.
 * Max 80 chars.
 * 
 * @param {string} city
 * @returns {string}
 */
function generateCitySlug(city) {
    if (!city) return '';
    return city
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/['''\u2019]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);
}

/**
 * Structured slug event logger for collision/retry tracking.
 * All scripts MUST use this instead of silent swallowing.
 * 
 * @param {object} event
 */
function logSlugEvent(event) {
    const entry = {
        ts: new Date().toISOString(),
        script_name: event.script_name || 'unknown',
        source_name: event.source_name || null,
        entity_name: event.entity_name || null,
        attempted_slug: event.attempted_slug || null,
        final_slug: event.final_slug || null,
        collision_count: event.collision_count || 0,
        retry_count: event.retry_count || 0,
        insert_outcome: event.insert_outcome || 'unknown',
        listing_id: event.listing_id || null,
        error_code: event.error_code || null,
        error_message: event.error_message || null,
    };
    if (entry.insert_outcome === 'success') {
        // Only log successes at debug level
        if (process.env.SLUG_DEBUG) console.log(`[slug-log] ${JSON.stringify(entry)}`);
    } else {
        console.warn(`[slug-log] ${JSON.stringify(entry)}`);
    }
    return entry;
}

/**
 * Batch pre-flight collision detection.
 * Generates slugs for all entries and reports any in-batch collisions.
 * 
 * @param {Array<{name: string, disambiguator?: string, entityType?: string}>} entries
 * @returns {{ entries: Array, collisions: Array<{slug: string, indices: number[]}> }}
 */
function batchGenerateSlugs(entries) {
    const slugMap = new Map();
    const result = entries.map((entry, i) => {
        const slug = generateCanonicalSlug(
            entry.name,
            entry.disambiguator || '',
            entry.entityType || ''
        );
        const existing = slugMap.get(slug) || [];
        existing.push(i);
        slugMap.set(slug, existing);
        return { ...entry, slug };
    });

    const collisions = Array.from(slugMap.entries())
        .filter(([, indices]) => indices.length > 1)
        .map(([slug, indices]) => ({ slug, indices }));

    if (collisions.length > 0) {
        console.warn(`[slug-guard] ${collisions.length} slug collisions detected in batch of ${entries.length}`);
        for (const c of collisions) {
            console.warn(`  slug="${c.slug}" appears ${c.indices.length} times (indices: ${c.indices.join(', ')})`);
        }
    }

    return { entries: result, collisions };
}

module.exports = { generateCanonicalSlug, generateSimpleSlug, generateCitySlug, batchGenerateSlugs, logSlugEvent };
