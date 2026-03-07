// ============================================================
// Documenso — Digital Signatures & Verification Documents
// Use for: operator/broker agreements, claim attestations, compliance
// ============================================================

const DOCUMENSO_API_KEY = process.env.DOCUMENSO_API_KEY || '';
const DOCUMENSO_API_URL = process.env.DOCUMENSO_API_URL || 'https://app.documenso.com/api/v1';

interface SignerInput {
    name: string;
    email: string;
    role?: 'SIGNER' | 'VIEWER' | 'APPROVER';
}

interface CreateDocumentOptions {
    title: string;
    templateId?: string;
    signers: SignerInput[];
    metadata?: Record<string, string>;
    externalId?: string;
}

interface DocumentResult {
    id: string;
    status: string;
    signingUrl?: string;
}

// ── Create a document for signing ──
export async function createDocument(opts: CreateDocumentOptions): Promise<DocumentResult | null> {
    if (!DOCUMENSO_API_KEY) {
        console.warn('[Documenso] No API key — skipping document creation');
        return null;
    }

    const res = await fetch(`${DOCUMENSO_API_URL}/documents`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DOCUMENSO_API_KEY}`,
        },
        body: JSON.stringify({
            title: opts.title,
            ...(opts.templateId ? { templateId: opts.templateId } : {}),
            recipients: opts.signers.map(s => ({
                name: s.name,
                email: s.email,
                role: s.role || 'SIGNER',
            })),
            meta: {
                ...opts.metadata,
                ...(opts.externalId ? { externalId: opts.externalId } : {}),
            },
        }),
    });

    if (!res.ok) {
        console.error('[Documenso] Document creation failed:', res.statusText);
        return null;
    }

    return res.json();
}

// ── Pre-built document generators ──
export const HaulDocs = {
    /** Operator claim attestation */
    claimAttestation: (operatorName: string, operatorEmail: string, surfaceId: string) =>
        createDocument({
            title: `HAUL COMMAND — Claim Attestation — ${operatorName}`,
            signers: [{ name: operatorName, email: operatorEmail }],
            metadata: { type: 'claim_attestation', surfaceId },
            externalId: `claim-${surfaceId}`,
        }),

    /** Operator service agreement */
    operatorAgreement: (operatorName: string, operatorEmail: string, entityId: string) =>
        createDocument({
            title: `HAUL COMMAND — Operator Service Agreement — ${operatorName}`,
            signers: [{ name: operatorName, email: operatorEmail }],
            metadata: { type: 'operator_agreement', entityId },
            externalId: `op-agree-${entityId}`,
        }),

    /** Broker terms agreement */
    brokerAgreement: (brokerName: string, brokerEmail: string, companyId: string) =>
        createDocument({
            title: `HAUL COMMAND — Broker Agreement — ${brokerName}`,
            signers: [{ name: brokerName, email: brokerEmail }],
            metadata: { type: 'broker_agreement', companyId },
            externalId: `broker-agree-${companyId}`,
        }),

    /** Sponsor/Advertiser agreement */
    sponsorAgreement: (sponsorName: string, sponsorEmail: string, campaignId: string) =>
        createDocument({
            title: `HAUL COMMAND — Sponsor Agreement — ${sponsorName}`,
            signers: [{ name: sponsorName, email: sponsorEmail }],
            metadata: { type: 'sponsor_agreement', campaignId },
            externalId: `sponsor-agree-${campaignId}`,
        }),

    /** Compliance verification packet */
    compliancePacket: (operatorName: string, operatorEmail: string, docIds: string[]) =>
        createDocument({
            title: `HAUL COMMAND — Compliance Verification — ${operatorName}`,
            signers: [{ name: operatorName, email: operatorEmail }],
            metadata: { type: 'compliance_packet', documents: docIds.join(',') },
            externalId: `compliance-${Date.now()}`,
        }),
};
