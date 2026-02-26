
/**
 * Evidence Vault
 * Purpose: Auditability + Trust + Monetizable Data Provenance.
 * Stores *where* we got data, *when*, and a snapshot.
 */

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

// Simulated store
const VAULT: EvidenceRecord[] = [];

export function logEvidence(record: Omit<EvidenceRecord, 'id'>) {
    const newRecord = {
        ...record,
        id: generateId()
    };
    VAULT.push(newRecord);
    return newRecord.id;
}

export function getEvidence(entityId: string, fieldName: string): EvidenceRecord[] {
    return VAULT.filter(r => r.entityId === entityId && r.fieldName === fieldName)
        .sort((a, b) => b.fetchTimestampISO.localeCompare(a.fetchTimestampISO));
}

function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}
