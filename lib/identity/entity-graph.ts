/**
 * HAUL COMMAND — Deterministic Identity Graph
 * 
 * Generates stable, reproducible IDs for real-world entities so the same
 * broker / operator / phone / corridor always gets the same ID regardless
 * of which source ingested it.
 * 
 * Rule: NEVER generate a random ID for real-world entities.
 * entity_id = sha256(entity_type + ":" + canonical_key)
 */

// ─── Phone Canonicalization ───────────────────────────────────────────────────
export function canonPhone(raw: string): string {
    const cleaned = raw.trim().replace(/[^\d+]/g, '');
    const digits = cleaned.replace(/\D/g, '');

    // US/CA: 10 digits without country code
    if (!cleaned.startsWith('+') && digits.length === 10) {
        return '+1' + digits;
    }
    // US/CA: 11 digits starting with 1
    if (!cleaned.startsWith('+') && digits.length === 11 && digits.startsWith('1')) {
        return '+' + digits;
    }
    // Already has +
    if (cleaned.startsWith('+')) {
        return cleaned;
    }
    // Default: prefix with +
    return '+' + digits;
}

// ─── Company Canonicalization ─────────────────────────────────────────────────
export function canonCompany(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ');
}

// ─── Corridor Canonicalization ────────────────────────────────────────────────
export function canonCorridor(country: string, highway: string, from: string, to: string): string {
    const parts = [
        country.toLowerCase().trim(),
        highway.toLowerCase().replace(/\s+/g, '-').trim(),
        from.toLowerCase().replace(/\s+/g, '-').trim(),
        to.toLowerCase().replace(/\s+/g, '-').trim(),
    ];
    return parts.join('|');
}

// ─── Operator Canonicalization ────────────────────────────────────────────────
export function canonOperator(country: string, identifier: string, identifierType: 'dot' | 'mc' | 'phone' | 'name'): string {
    return `${country.toLowerCase()}|${identifierType}:${identifier.toLowerCase().trim()}`;
}

// ─── SHA-256 Hash (works in browser + Node) ───────────────────────────────────
export async function sha256Hex(input: string): Promise<string> {
    // Web Crypto API (browser + modern Node 20+)
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
        const enc = new TextEncoder().encode(input);
        const digest = await crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(digest))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Node.js fallback
    const { createHash } = await import('crypto');
    return createHash('sha256').update(input).digest('hex');
}

// ─── Deterministic Entity ID ──────────────────────────────────────────────────
export type EntityType =
    | 'phone'
    | 'company'
    | 'person'
    | 'broker'
    | 'operator'
    | 'corridor'
    | 'surface'
    | 'port'
    | 'load';

export async function makeEntityId(entityType: EntityType, canonicalKey: string): Promise<string> {
    return sha256Hex(`${entityType}:${canonicalKey}`);
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────
export async function phoneEntityId(rawPhone: string): Promise<string> {
    return makeEntityId('phone', canonPhone(rawPhone));
}

export async function companyEntityId(companyName: string, city: string, state: string, country: string): Promise<string> {
    const key = `${canonCompany(companyName)}|${city.toLowerCase().trim()}|${state.toLowerCase().trim()}|${country.toLowerCase().trim()}`;
    return makeEntityId('company', key);
}

export async function corridorEntityId(country: string, highway: string, from: string, to: string): Promise<string> {
    return makeEntityId('corridor', canonCorridor(country, highway, from, to));
}
