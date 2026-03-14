// ============================================================
// Typesense — Sync Pipeline
// Full + incremental sync from Supabase → Typesense
// ============================================================

import { getTypesenseAdmin, OPERATORS_COLLECTION, OPERATORS_SCHEMA, operatorToDocument } from '@/lib/typesense/client';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';
import { isEnabled } from '@/lib/feature-flags';

const BATCH_SIZE = 250;

/**
 * Ensure the operators collection exists with the correct schema.
 */
export async function ensureCollection(): Promise<boolean> {
    if (!isEnabled('TYPESENSE')) return false;
    const client = getTypesenseAdmin();
    try {
        await client.collections(OPERATORS_COLLECTION).retrieve();
        return true;
    } catch {
        try {
            await client.collections().create(OPERATORS_SCHEMA);
            console.log('[Typesense] Created operators collection');
            return true;
        } catch (err) {
            console.error('[Typesense] Failed to create collection:', err);
            return false;
        }
    }
}

/**
 * Full sync: pull all operators from Supabase and index them.
 */
export async function fullSync(): Promise<{ indexed: number; errors: number }> {
    if (!isEnabled('TYPESENSE')) return { indexed: 0, errors: 0 };

    const supabase = getSupabaseAdmin();
    const client = getTypesenseAdmin();
    await ensureCollection();

    let indexed = 0;
    let errors = 0;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const { data: operators, error } = await supabase
            .from('operator_profiles')
            .select('*')
            .range(offset, offset + BATCH_SIZE - 1)
            .order('updated_at', { ascending: false });

        if (error || !operators?.length) {
            hasMore = false;
            break;
        }

        const docs = operators.map(operatorToDocument);

        try {
            const results = await client
                .collections(OPERATORS_COLLECTION)
                .documents()
                .import(docs, { action: 'upsert' });

            const successes = results.filter((r: any) => r.success).length;
            const fails = results.filter((r: any) => !r.success).length;
            indexed += successes;
            errors += fails;
        } catch (err) {
            console.error('[Typesense] Batch import error:', err);
            errors += docs.length;
        }

        offset += BATCH_SIZE;
        hasMore = operators.length === BATCH_SIZE;
    }

    console.log(`[Typesense] Full sync complete: ${indexed} indexed, ${errors} errors`);
    return { indexed, errors };
}

/**
 * Incremental sync: index operators updated since a given timestamp.
 */
export async function incrementalSync(since: string): Promise<{ indexed: number; errors: number }> {
    if (!isEnabled('TYPESENSE')) return { indexed: 0, errors: 0 };

    const supabase = getSupabaseAdmin();
    const client = getTypesenseAdmin();
    await ensureCollection();

    const { data: operators, error } = await supabase
        .from('operator_profiles')
        .select('*')
        .gte('updated_at', since)
        .order('updated_at', { ascending: false })
        .limit(1000);

    if (error || !operators?.length) {
        return { indexed: 0, errors: 0 };
    }

    const docs = operators.map(operatorToDocument);

    try {
        const results = await client
            .collections(OPERATORS_COLLECTION)
            .documents()
            .import(docs, { action: 'upsert' });

        const indexed = results.filter((r: any) => r.success).length;
        const errors = results.filter((r: any) => !r.success).length;

        console.log(`[Typesense] Incremental sync: ${indexed} indexed, ${errors} errors`);
        return { indexed, errors };
    } catch (err) {
        console.error('[Typesense] Incremental sync error:', err);
        return { indexed: 0, errors: docs.length };
    }
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
        const doc = operatorToDocument(operator);
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
    if (options?.state) filterParts.push(`service_states:=${options.state}`);
    if (options?.category) filterParts.push(`service_categories:=${options.category}`);

    const searchParams: any = {
        q: query || '*',
        query_by: 'company_name,bio,city,state',
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
