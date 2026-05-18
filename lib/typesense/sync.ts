// ============================================================
// Typesense — Sync Pipeline
// Full + incremental sync from Supabase → Typesense
// ============================================================

import {
    DIRECTORY_SURFACE_SCHEMAS,
    DIRECTORY_TYPESENSE_QUERY_BY,
    getDirectorySurfaceCollection,
    getTypesenseAdmin,
    OPERATORS_COLLECTION,
    surfaceRowToDocument,
} from '@/lib/typesense/client';
import {
    buildDirectoryFallbackFilterPlan,
} from '@/lib/directory/server-query';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';
import { isEnabled } from '@/lib/feature-flags';

const BATCH_SIZE = 250;

/**
 * Ensure the directory surface collections exist with the correct schema.
 */
export async function ensureCollection(): Promise<boolean> {
    if (!isEnabled('TYPESENSE')) return false;
    const client = getTypesenseAdmin();
    let ready = true;

    for (const schema of DIRECTORY_SURFACE_SCHEMAS) {
        let existing: any = null;
        try {
            existing = await client.collections(schema.name).retrieve();
        } catch {
            try {
                await client.collections().create(schema);
                console.log(`[Typesense] Created directory collection: ${schema.name}`);
                continue;
            } catch (err) {
                console.error(`[Typesense] Failed to create collection ${schema.name}:`, err);
                ready = false;
                continue;
            }
        }

        const existingFields = new Set((existing.fields ?? []).map((field: any) => field.name));
        const missingFields = schema.fields.filter((field) => !existingFields.has(field.name));
        if (missingFields.length > 0) {
            try {
                await client.collections(schema.name).update({ fields: missingFields });
                console.log(`[Typesense] Updated ${schema.name} with ${missingFields.length} missing field(s)`);
            } catch (err) {
                console.error(`[Typesense] Failed to update collection ${schema.name}:`, err);
                ready = false;
            }
        }
    }

    return ready;
}

/**
 * Full sync: pull all public directory surfaces from Supabase and index them.
 */
export async function fullSync(): Promise<{ indexed: number; errors: number }> {
    if (!isEnabled('TYPESENSE')) return { indexed: 0, errors: 0 };

    const supabase = getSupabaseAdmin();
    const client = getTypesenseAdmin();
    await ensureCollection();

    let indexed = 0;
    let errors = 0;
    for (const surface of buildDirectoryFallbackFilterPlan({}).surfaceViews) {
        const collection = getDirectorySurfaceCollection(surface);
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            const { data: rows, error } = await supabase
                .from(surface)
                .select('*')
                .range(offset, offset + BATCH_SIZE - 1)
                .order('updated_at', { ascending: false });

            if (error || !rows?.length) {
                if (error) {
                    console.error(`[Typesense] Supabase ${surface} sync query failed:`, error.message);
                    errors += BATCH_SIZE;
                }
                hasMore = false;
                break;
            }

            const docs = rows.map((row) => surfaceRowToDocument(row, surface)).filter((doc) => doc.id);

            try {
                const results = await client
                    .collections(collection)
                    .documents()
                    .import(docs, { action: 'upsert' });

                const successes = results.filter((r: any) => r.success).length;
                const fails = results.filter((r: any) => !r.success).length;
                indexed += successes;
                errors += fails;
            } catch (err) {
                console.error(`[Typesense] ${collection} batch import error:`, err);
                errors += docs.length;
            }

            offset += BATCH_SIZE;
            hasMore = rows.length === BATCH_SIZE;
        }
    }

    console.log(`[Typesense] Full sync complete: ${indexed} indexed, ${errors} errors`);
    return { indexed, errors };
}

/**
 * Incremental sync: index directory surface rows updated since a given timestamp.
 */
export async function incrementalSync(since: string): Promise<{ indexed: number; errors: number }> {
    if (!isEnabled('TYPESENSE')) return { indexed: 0, errors: 0 };

    const supabase = getSupabaseAdmin();
    const client = getTypesenseAdmin();
    await ensureCollection();

    let indexed = 0;
    let errors = 0;

    for (const surface of buildDirectoryFallbackFilterPlan({}).surfaceViews) {
        const collection = getDirectorySurfaceCollection(surface);
        const { data: rows, error } = await supabase
            .from(surface)
            .select('*')
            .gte('updated_at', since)
            .order('updated_at', { ascending: false })
            .limit(1000);

        if (error || !rows?.length) {
            if (error) console.error(`[Typesense] ${surface} incremental query failed:`, error.message);
            continue;
        }

        const docs = rows.map((row) => surfaceRowToDocument(row, surface)).filter((doc) => doc.id);

        try {
            const results = await client
                .collections(collection)
                .documents()
                .import(docs, { action: 'upsert' });

            indexed += results.filter((r: any) => r.success).length;
            errors += results.filter((r: any) => !r.success).length;
        } catch (err) {
            console.error(`[Typesense] ${collection} incremental sync error:`, err);
            errors += docs.length;
        }
    }

    console.log(`[Typesense] Incremental sync: ${indexed} indexed, ${errors} errors`);
    return { indexed, errors };
}

/**
 * Delete a single operator from the index.
 */
export async function removeOperator(operatorId: string): Promise<boolean> {
    if (!isEnabled('TYPESENSE')) return false;
    const client = getTypesenseAdmin();
    try {
        await client.collections(OPERATORS_COLLECTION).documents(operatorId).delete();
        return true;
    } catch {
        return false;
    }
}

/**
 * Index a single operator (upsert).
 */
export async function indexOperator(operator: Record<string, unknown>): Promise<boolean> {
    if (!isEnabled('TYPESENSE')) return false;
    const client = getTypesenseAdmin();
    try {
        const doc = surfaceRowToDocument(operator, 'v_directory_operators');
        await client.collections(OPERATORS_COLLECTION).documents().upsert(doc);
        return true;
    } catch (err) {
        console.error('[Typesense] Index operator error:', err);
        return false;
    }
}

/**
 * Search operators.
 */
export async function searchOperators(query: string, options?: {
    country?: string;
    state?: string;
    category?: string;
    geoLat?: number;
    geoLng?: number;
    geoRadiusKm?: number;
    page?: number;
    perPage?: number;
}) {
    if (!isEnabled('TYPESENSE')) return { hits: [], found: 0 };
    const client = getTypesenseAdmin();

    const filterParts: string[] = [];
    if (options?.country) filterParts.push(`country_code:=${options.country}`);
    if (options?.state) filterParts.push(`state:=${options.state}`);
    if (options?.category) filterParts.push(`entity_subtype:=${options.category}`);

    const searchParams: any = {
        q: query || '*',
        query_by: DIRECTORY_TYPESENSE_QUERY_BY,
        filter_by: filterParts.join(' && ') || undefined,
        sort_by: options?.geoLat && options?.geoLng
            ? `location(${options.geoLat},${options.geoLng}):asc`
            : 'reputation_score:desc',
        page: options?.page || 1,
        per_page: options?.perPage || 20,
        highlight_full_fields: 'company_name,bio',
    };

    if (options?.geoLat && options?.geoLng && options?.geoRadiusKm) {
        searchParams.filter_by = [
            searchParams.filter_by,
            `location:(${options.geoLat},${options.geoLng},${options.geoRadiusKm} km)`
        ].filter(Boolean).join(' && ');
    }

    // Clean undefined values
    Object.keys(searchParams).forEach(k => {
        if (searchParams[k] === undefined) delete searchParams[k];
    });

    try {
        const result = await client
            .collections(OPERATORS_COLLECTION)
            .documents()
            .search(searchParams);

        return {
            hits: result.hits || [],
            found: result.found || 0,
            page: result.page,
            facets: result.facet_counts,
        };
    } catch (err) {
        console.error('[Typesense] Search error:', err);
        return { hits: [], found: 0 };
    }
}
