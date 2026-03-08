/**
 * Typesense client configuration.
 * Used for both indexing (admin) and searching.
 * 
 * Phase 1: typesense_install_and_sync
 */
import Typesense from 'typesense';

// Admin client — used for indexing, collection management
export function getTypesenseAdmin() {
    return new Typesense.Client({
        nodes: [{
            host: process.env.TYPESENSE_HOST || 'localhost',
            port: parseInt(process.env.TYPESENSE_PORT || '8108', 10),
            protocol: process.env.TYPESENSE_PROTOCOL || 'https',
        }],
        apiKey: process.env.TYPESENSE_ADMIN_KEY || '',
        connectionTimeoutSeconds: 5,
        retryIntervalSeconds: 0.1,
        numRetries: 3,
    });
}

// Search client — safe for client-side use (search-only key)
export function getTypesenseSearch() {
    return new Typesense.Client({
        nodes: [{
            host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || process.env.TYPESENSE_HOST || 'localhost',
            port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT || process.env.TYPESENSE_PORT || '8108', 10),
            protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || process.env.TYPESENSE_PROTOCOL || 'https',
        }],
        apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || '',
        connectionTimeoutSeconds: 3,
        retryIntervalSeconds: 0.1,
        numRetries: 2,
    });
}

// Collection name
export const OPERATORS_COLLECTION = 'operators';

// Schema for the operators collection
export const OPERATORS_SCHEMA = {
    name: OPERATORS_COLLECTION,
    fields: [
        { name: 'id', type: 'string' as const },
        { name: 'company_name', type: 'string' as const, facet: false },
        { name: 'bio', type: 'string' as const, optional: true },
        { name: 'city', type: 'string' as const, optional: true, facet: true },
        { name: 'state', type: 'string' as const, optional: true, facet: true },
        { name: 'country_code', type: 'string' as const, optional: true, facet: true },
        { name: 'role_subtypes', type: 'string[]' as const, optional: true, facet: true },
        { name: 'service_categories', type: 'string[]' as const, optional: true, facet: true },
        { name: 'service_states', type: 'string[]' as const, optional: true, facet: true },
        { name: 'service_corridors', type: 'string[]' as const, optional: true, facet: true },
        { name: 'has_height_pole', type: 'bool' as const, optional: true, facet: true },
        { name: 'dispatch_ready', type: 'bool' as const, optional: true, facet: true },
        { name: 'availability_status', type: 'string' as const, optional: true, facet: true },
        { name: 'trust_tier', type: 'string' as const, optional: true, facet: true },
        { name: 'completion_pct', type: 'int32' as const, optional: true },
        { name: 'reputation_score', type: 'int32' as const, optional: true },
        { name: 'is_seeded', type: 'bool' as const, optional: true, facet: true },
        { name: 'is_claimed', type: 'bool' as const, optional: true, facet: true },
        { name: 'avatar_url', type: 'string' as const, optional: true },
        { name: 'lat', type: 'float' as const, optional: true },
        { name: 'lng', type: 'float' as const, optional: true },
        { name: 'location', type: 'geopoint' as const, optional: true },
        { name: 'years_experience', type: 'int32' as const, optional: true },
        { name: 'updated_at', type: 'int64' as const, optional: true },
    ],
    default_sorting_field: 'updated_at',
    token_separators: ['-', '_'],
};

// Convert a Supabase operator row to a Typesense document
export function operatorToDocument(op: Record<string, unknown>) {
    return {
        id: String(op.id),
        company_name: String(op.company_name || op.business_name || ''),
        bio: String(op.bio || ''),
        city: String(op.city || ''),
        state: String(op.state || ''),
        country_code: String(op.country_code || ''),
        role_subtypes: Array.isArray(op.role_subtypes) ? op.role_subtypes : [],
        service_categories: Array.isArray(op.service_categories) ? op.service_categories : [],
        service_states: Array.isArray(op.service_states) ? op.service_states : [],
        service_corridors: Array.isArray(op.service_corridors) ? op.service_corridors : [],
        has_height_pole: Boolean(op.has_height_pole),
        dispatch_ready: Boolean(op.dispatch_ready),
        availability_status: String(op.availability_status || 'offline'),
        trust_tier: String(op.trust_tier || 'unclaimed'),
        completion_pct: Number(op.completion_pct || 0),
        reputation_score: Number(op.reputation_score || 0),
        is_seeded: Boolean(op.is_seeded),
        is_claimed: !Boolean(op.is_seeded),
        avatar_url: String(op.avatar_url || ''),
        lat: Number(op.latitude || op.lat || 0),
        lng: Number(op.longitude || op.lng || 0),
        location: (op.latitude || op.lat) && (op.longitude || op.lng)
            ? [Number(op.latitude || op.lat), Number(op.longitude || op.lng)]
            : undefined,
        years_experience: Number(op.years_experience || 0),
        updated_at: op.updated_at ? Math.floor(new Date(String(op.updated_at)).getTime() / 1000) : Math.floor(Date.now() / 1000),
    };
}
