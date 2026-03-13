/**
 * canonical-slug.ts
 * 
 * Single source of truth for slug generation across all Haul Command ingestion paths.
 * 
 * Rules:
 *  1. Lowercase, strip non-alphanumeric (keep hyphens), collapse whitespace to hyphens
 *  2. Append 8-char hash suffix derived from (name + region + entity_type) for uniqueness
 *  3. Max 120 chars total (slug regex in resolve API allows up to 120)
 *  4. If a collision is detected at insert time, the DB unique index blocks it.
 *     The caller must retry with a longer hash or manual disambiguation.
 *
 * Usage:
 *   import { generateCanonicalSlug, generateSlugWithCollisionRetry } from '@/lib/utils/canonical-slug';
 *   const slug = generateCanonicalSlug("Gulf Coast Movers", "TX", "pilot_car_operator");
 *   // → "gulf-coast-movers-33b68115"
 */

import { createHash } from 'crypto';

/**
 * Core slug generation. Deterministic: same inputs → same slug.
 * 
 * @param name - Entity display name
 * @param disambiguator - Region code, city, or other disambiguating string
 * @param entityType - Entity type (pilot_car_operator, port, etc.)
 * @param hashLength - Length of the hex suffix (default: 8)
 * @returns Canonical slug with hash suffix
 */
export function generateCanonicalSlug(
    name: string,
    disambiguator: string = '',
    entityType: string = '',
    hashLength: number = 8
): string {
    // Step 1: Normalize the base slug
    const base = name
        .toLowerCase()
        .replace(/&/g, 'and')                    // & → and
        .replace(/[''\u2019]/g, '')               // apostrophes → nothing
        .replace(/[^a-z0-9\s-]/g, '')             // strip everything except letters, digits, spaces, hyphens
        .replace(/\s+/g, '-')                     // collapse spaces to hyphens
        .replace(/-+/g, '-')                      // collapse multiple hyphens
        .replace(/^-|-$/g, '')                    // trim leading/trailing hyphens
        .substring(0, 100);                       // max base length

    // Step 2: Generate deterministic hash suffix for uniqueness
    const hashInput = `${name.trim()}::${disambiguator.trim()}::${entityType.trim()}`.toLowerCase();
    const hash = createHash('sha256').update(hashInput).digest('hex').substring(0, hashLength);

    // Step 3: Combine
    return `${base}-${hash}`.substring(0, 120);
}

/**
 * Generate a slug for entities that are expected to be globally unique
 * by name alone (ports, cities, etc.). No hash suffix added.
 * 
 * Only use this for well-known entities where name collision is near impossible.
 */
export function generateSimpleSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[''\u2019]/g, '')
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
 */
export function generateCitySlug(city: string): string {
    if (!city) return '';
    return city
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[''\u2019]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);
}

/**
 * Retry-aware slug generation for Supabase inserts.
 * If the first slug collides (unique constraint violation), tries with increasing hash length.
 * 
 * @param supabase - Supabase client
 * @param table - Target table name
 * @param record - Full record to insert (slug will be overwritten)
 * @param name - Entity name for slug generation
 * @param disambiguator - Disambiguating string (region, city, etc.)
 * @param entityType - Entity type string
 * @returns The inserted record with final slug, or throws on exhaustion
 */
export async function insertWithSlugRetry(
    supabase: any,
    table: string,
    record: Record<string, any>,
    name: string,
    disambiguator: string = '',
    entityType: string = '',
    maxRetries: number = 3
): Promise<{ data: any; slug: string }> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const hashLength = 8 + (attempt * 4); // 8, 12, 16, 20
        const slug = generateCanonicalSlug(name, disambiguator, entityType, hashLength);

        const { data, error } = await supabase
            .from(table)
            .insert({ ...record, slug })
            .select('id, slug')
            .single();

        if (!error) {
            return { data, slug };
        }

        // 23505 = unique_violation (Postgres)
        if (error.code === '23505' && attempt < maxRetries) {
            console.warn(`[slug-guard] Collision on slug="${slug}" (attempt ${attempt + 1}/${maxRetries + 1}). Retrying with longer hash.`);
            continue;
        }

        // Non-collision error or exhausted retries
        console.error(`[slug-guard] Insert failed for slug="${slug}":`, error);
        throw new Error(`Slug insert failed after ${attempt + 1} attempts: ${error.message}`);
    }

    // Should not reach here
    throw new Error('Slug insert exhausted all retries');
}

/**
 * Batch slug generation with collision detection.
 * For use in ingestion scripts that need to detect duplicates before DB insert.
 * 
 * @param entries - Array of { name, disambiguator, entityType }
 * @returns Array of entries with .slug added, and a collisions array
 */
export function batchGenerateSlugs(
    entries: Array<{ name: string; disambiguator?: string; entityType?: string; [key: string]: any }>
): { entries: Array<any & { slug: string }>; collisions: Array<{ slug: string; indices: number[] }> } {
    const slugMap = new Map<string, number[]>();
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
        .filter(([_, indices]) => indices.length > 1)
        .map(([slug, indices]) => ({ slug, indices }));

    if (collisions.length > 0) {
        console.warn(`[slug-guard] ${collisions.length} slug collisions detected in batch of ${entries.length}`);
        for (const c of collisions) {
            console.warn(`  slug="${c.slug}" appears ${c.indices.length} times (indices: ${c.indices.join(', ')})`);
        }
    }

    return { entries: result, collisions };
}
