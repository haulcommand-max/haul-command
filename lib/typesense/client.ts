/**
 * Typesense client configuration.
 * Used for both indexing (admin) and searching.
 * 
 * Phase 1: typesense_install_and_sync
 */
import Typesense from 'typesense';
import type { DirectorySurfaceView } from '@/lib/directory/server-query';

// Admin client — used for indexing, collection management
export function getTypesenseAdmin() {
    return new Typesense.Client({
        nodes: [{
            host: process.env.TYPESENSE_HOST || 'localhost',
            port: parseInt(process.env.TYPESENSE_PORT || '8108', 10),
            protocol: process.env.TYPESENSE_PROTOCOL || 'https',
        }],
        apiKey: process.env.TYPESENSE_ADMIN_KEY || process.env.TYPESENSE_ADMIN_API_KEY || process.env.TYPESENSE_API_KEY || '',
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
        apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || process.env.TYPESENSE_API_KEY_SEARCH || process.env.TYPESENSE_API_KEY || '',
        connectionTimeoutSeconds: 3,
        retryIntervalSeconds: 0.1,
        numRetries: 2,
    });
}

// Collection name
export const OPERATORS_COLLECTION = 'hc_operators';

export const DIRECTORY_SURFACE_COLLECTION_BY_VIEW: Record<DirectorySurfaceView, string> = {
    v_directory_operators: 'hc_operators',
    v_directory_support_locations: 'hc_support_locations',
    v_directory_services: 'hc_services',
    v_directory_brokers: 'hc_brokers',
    v_directory_carriers: 'hc_carriers',
    v_directory_infrastructure: 'hc_infrastructure',
    v_directory_authorities: 'hc_authorities',
};

export const DIRECTORY_SURFACE_COLLECTIONS = Object.values(DIRECTORY_SURFACE_COLLECTION_BY_VIEW);

const DIRECTORY_SURFACE_FIELDS = [
    { name: 'id', type: 'string' as const },
    { name: 'source_view', type: 'string' as const, facet: true },
    { name: 'canonical_entity_id', type: 'string' as const, optional: true, facet: true },
    { name: 'contact_id', type: 'string' as const, optional: true },
    { name: 'entity_family', type: 'string' as const, optional: true, facet: true },
    { name: 'entity_subtype', type: 'string' as const, optional: true, facet: true },
    { name: 'company_name', type: 'string' as const, optional: true },
    { name: 'company', type: 'string' as const, optional: true },
    { name: 'name', type: 'string' as const, optional: true },
    { name: 'bio', type: 'string' as const, optional: true },
    { name: 'search_text', type: 'string' as const, optional: true },
    { name: 'city', type: 'string' as const, optional: true, facet: true },
    { name: 'state', type: 'string' as const, optional: true, facet: true },
    { name: 'city_inferred', type: 'string' as const, optional: true, facet: true },
    { name: 'state_inferred', type: 'string' as const, optional: true, facet: true },
    { name: 'country_code', type: 'string' as const, optional: true, facet: true },
    { name: 'claim_status', type: 'string' as const, optional: true, facet: true },
    { name: 'verification_status', type: 'string' as const, optional: true, facet: true },
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
    { name: 'rank_score', type: 'float' as const, optional: true },
    { name: 'confidence_score', type: 'float' as const, optional: true },
    { name: 'directory_quality_score', type: 'float' as const, optional: true },
    { name: 'lat', type: 'float' as const, optional: true },
    { name: 'lng', type: 'float' as const, optional: true },
    { name: 'location', type: 'geopoint' as const, optional: true },
    { name: 'years_experience', type: 'int32' as const, optional: true },
    { name: 'updated_at', type: 'int64' as const, optional: true },
];

export const DIRECTORY_SURFACE_SCHEMAS = DIRECTORY_SURFACE_COLLECTIONS.map((name) => ({
    name,
    fields: DIRECTORY_SURFACE_FIELDS,
    default_sorting_field: 'updated_at',
    token_separators: ['-', '_'],
}));

export const DIRECTORY_TYPESENSE_QUERY_BY = [
    'company_name',
    'company',
    'name',
    'search_text',
    'city',
    'state',
    'city_inferred',
    'state_inferred',
    'entity_subtype',
].join(',');

export function getDirectorySurfaceCollection(surfaceView: DirectorySurfaceView): string {
    return DIRECTORY_SURFACE_COLLECTION_BY_VIEW[surfaceView];
}

function stringValue(value: unknown): string {
    return value == null ? '' : String(value);
}

function numberValue(value: unknown): number | undefined {
    if (value == null || value === '') return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
}

function epochSeconds(value: unknown): number {
    if (value == null || value === '') return Math.floor(Date.now() / 1000);
    const timestamp = new Date(String(value)).getTime();
    return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : Math.floor(Date.now() / 1000);
}

function stringArrayValue(value: unknown): string[] {
    return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

export function surfaceRowToDocument(row: Record<string, unknown>, sourceView: DirectorySurfaceView) {
    const id = stringValue(row.canonical_entity_id || row.contact_id || row.id || row.slug);
    const companyName = stringValue(row.company || row.company_name || row.business_name || row.name);
    const city = stringValue(row.city_inferred || row.city || row.locality);
    const state = stringValue(row.state_inferred || row.state || row.region_code || row.admin1_code);
    const lat = numberValue(row.latitude || row.lat);
    const lng = numberValue(row.longitude || row.lng);
    const rankScore = numberValue(row.rank_score) ?? numberValue(row.reputation_score) ?? 0;
    const completeness = Math.round(numberValue(row.completion_pct) ?? numberValue(row.profile_completeness) ?? 0);

    return {
        id,
        source_view: sourceView,
        canonical_entity_id: stringValue(row.canonical_entity_id),
        contact_id: stringValue(row.contact_id || row.id),
        entity_family: stringValue(row.entity_family),
        entity_subtype: stringValue(row.entity_subtype),
        company_name: companyName,
        company: stringValue(row.company || companyName),
        name: stringValue(row.name || companyName),
        bio: stringValue(row.bio || row.description),
        search_text: [
            companyName,
            row.entity_family,
            row.entity_subtype,
            city,
            state,
            row.country_code,
        ].filter(Boolean).join(' '),
        city,
        state,
        city_inferred: city,
        state_inferred: state,
        country_code: stringValue(row.country_code),
        claim_status: stringValue(row.claim_status),
        verification_status: stringValue(row.verification_status),
        role_subtypes: stringArrayValue(row.role_subtypes),
        service_categories: stringArrayValue(row.service_categories),
        service_states: stringArrayValue(row.service_states),
        service_corridors: stringArrayValue(row.service_corridors),
        has_height_pole: Boolean(row.has_height_pole),
        dispatch_ready: Boolean(row.dispatch_ready),
        availability_status: stringValue(row.availability_status || 'offline'),
        trust_tier: stringValue(row.trust_tier || row.claim_status || 'unclaimed'),
        completion_pct: completeness,
        reputation_score: Math.round(numberValue(row.reputation_score) ?? rankScore),
        is_seeded: Boolean(row.is_seeded),
        is_claimed: row.is_claimed == null ? row.claim_status === 'claimed' : Boolean(row.is_claimed),
        avatar_url: stringValue(row.avatar_url),
        rank_score: rankScore,
        confidence_score: numberValue(row.confidence_score) ?? 0,
        directory_quality_score: numberValue(row.directory_quality_score) ?? 0,
        lat,
        lng,
        location: lat != null && lng != null ? [lat, lng] : undefined,
        years_experience: Math.round(numberValue(row.years_experience) ?? 0),
        updated_at: epochSeconds(row.updated_at),
    };
}

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
