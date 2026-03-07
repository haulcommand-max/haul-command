/**
 * Evidence Vault — Persistent Edition (FP-C1)
 *
 * Purpose: Auditability + Trust + Monetizable Data Provenance.
 * Stores *where* we got data, *when*, and a snapshot.
 *
 * FIXED: Previously used in-memory array → data lost on every deploy/restart.
 * Now persists to Supabase (evidence_vault_records) with in-memory fallback.
 */

import { createClient } from '@supabase/supabase-js';
import { safeUUID } from '@/lib/identity/uid';

export type EvidenceRecord = {
    id: string;
    entityId: string;
    fieldName: string; // e.g., 'phone', 'insurance_expiry'
    value: any;
    sourceUrl: string;
    fetchTimestampISO: string;
    contentHash: string;
    snapshotPointer?: string; // S3 path or IPFS hash
    confidenceScore: number;
    verificationMethod: 'SCRAPE_MATCH' | 'USER_SUBMISSION' | 'GOV_API' | 'MANUAL_DEPUTY';
};

// ═══════════════════════════════════════════════════════════════
// ADMIN CLIENT
// ═══════════════════════════════════════════════════════════════

function getAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null; // Graceful fallback if env vars missing
    return createClient(url, key, { auth: { persistSession: false } });
}

// ═══════════════════════════════════════════════════════════════
// WRITE — Log evidence to persistent store
// ═══════════════════════════════════════════════════════════════

/**
 * Log an evidence record. Persists to Supabase first,
 * falls back to in-memory array if DB unavailable.
 */
export async function logEvidence(record: Omit<EvidenceRecord, 'id'>): Promise<string> {
    const id = generateId();
    const full: EvidenceRecord = { ...record, id };

    const sb = getAdmin();
    if (sb) {
        const { error } = await sb.from('evidence_vault_records').insert({
            id,
            entity_id: record.entityId,
            field_name: record.fieldName,
            value: record.value,
            source_url: record.sourceUrl,
            fetch_timestamp: record.fetchTimestampISO,
            content_hash: record.contentHash,
            snapshot_pointer: record.snapshotPointer ?? null,
            confidence_score: record.confidenceScore,
            verification_method: record.verificationMethod,
        });

        if (error) {
            console.warn('[EvidenceVault] DB write failed, using memory fallback:', error.message);
            memoryFallback.push(full);
        }
    } else {
        memoryFallback.push(full);
    }

    return id;
}

// ═══════════════════════════════════════════════════════════════
// READ — Retrieve evidence for an entity + field
// ═══════════════════════════════════════════════════════════════

/**
 * Get evidence records for a specific entity and field.
 * Reads from Supabase, merges with any in-memory fallback records.
 */
export async function getEvidence(entityId: string, fieldName: string): Promise<EvidenceRecord[]> {
    const results: EvidenceRecord[] = [];

    const sb = getAdmin();
    if (sb) {
        const { data, error } = await sb
            .from('evidence_vault_records')
            .select('*')
            .eq('entity_id', entityId)
            .eq('field_name', fieldName)
            .order('fetch_timestamp', { ascending: false })
            .limit(50);

        if (!error && data) {
            for (const row of data) {
                results.push({
                    id: row.id,
                    entityId: row.entity_id,
                    fieldName: row.field_name,
                    value: row.value,
                    sourceUrl: row.source_url,
                    fetchTimestampISO: row.fetch_timestamp,
                    contentHash: row.content_hash,
                    snapshotPointer: row.snapshot_pointer,
                    confidenceScore: row.confidence_score,
                    verificationMethod: row.verification_method,
                });
            }
        }
    }

    // Merge in-memory fallback records (deduped by id)
    const existingIds = new Set(results.map(r => r.id));
    for (const mem of memoryFallback) {
        if (mem.entityId === entityId && mem.fieldName === fieldName && !existingIds.has(mem.id)) {
            results.push(mem);
        }
    }

    return results.sort((a, b) => b.fetchTimestampISO.localeCompare(a.fetchTimestampISO));
}

// ═══════════════════════════════════════════════════════════════
// SEARCH — Get all evidence for an entity (all fields)
// ═══════════════════════════════════════════════════════════════

export async function getEntityEvidence(entityId: string): Promise<EvidenceRecord[]> {
    const results: EvidenceRecord[] = [];

    const sb = getAdmin();
    if (sb) {
        const { data, error } = await sb
            .from('evidence_vault_records')
            .select('*')
            .eq('entity_id', entityId)
            .order('fetch_timestamp', { ascending: false })
            .limit(100);

        if (!error && data) {
            for (const row of data) {
                results.push({
                    id: row.id,
                    entityId: row.entity_id,
                    fieldName: row.field_name,
                    value: row.value,
                    sourceUrl: row.source_url,
                    fetchTimestampISO: row.fetch_timestamp,
                    contentHash: row.content_hash,
                    snapshotPointer: row.snapshot_pointer,
                    confidenceScore: row.confidence_score,
                    verificationMethod: row.verification_method,
                });
            }
        }
    }

    // Merge memory fallback
    const existingIds = new Set(results.map(r => r.id));
    for (const mem of memoryFallback) {
        if (mem.entityId === entityId && !existingIds.has(mem.id)) {
            results.push(mem);
        }
    }

    return results.sort((a, b) => b.fetchTimestampISO.localeCompare(a.fetchTimestampISO));
}

// ═══════════════════════════════════════════════════════════════
// BACKFILL — Flush in-memory records to DB
// ═══════════════════════════════════════════════════════════════

/**
 * Flush any in-memory fallback records to the database.
 * Call this periodically or on graceful shutdown.
 */
export async function flushMemoryToDb(): Promise<number> {
    if (memoryFallback.length === 0) return 0;

    const sb = getAdmin();
    if (!sb) return 0;

    let flushed = 0;
    const toFlush = [...memoryFallback];

    for (const record of toFlush) {
        const { error } = await sb.from('evidence_vault_records').upsert({
            id: record.id,
            entity_id: record.entityId,
            field_name: record.fieldName,
            value: record.value,
            source_url: record.sourceUrl,
            fetch_timestamp: record.fetchTimestampISO,
            content_hash: record.contentHash,
            snapshot_pointer: record.snapshotPointer ?? null,
            confidence_score: record.confidenceScore,
            verification_method: record.verificationMethod,
        }, { onConflict: 'id' });

        if (!error) {
            flushed++;
            const idx = memoryFallback.indexOf(record);
            if (idx >= 0) memoryFallback.splice(idx, 1);
        }
    }

    return flushed;
}

// ═══════════════════════════════════════════════════════════════
// INTERNALS
// ═══════════════════════════════════════════════════════════════

/** In-memory fallback for when DB is unavailable */
const memoryFallback: EvidenceRecord[] = [];

function generateId(): string {
    return safeUUID();
}
