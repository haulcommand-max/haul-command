// ============================================================
// Dub — Short Links, QR Attribution, Referral Tracking
// Use for: QR codes, claim links, referral links, sponsor tracking
// ============================================================

const DUB_API_KEY = process.env.DUB_API_KEY || '';
const DUB_WORKSPACE = process.env.DUB_WORKSPACE_SLUG || 'haulcommand';
const DUB_API_URL = 'https://api.dub.co';

interface CreateLinkOptions {
    url: string;
    key?: string; // custom short path
    domain?: string; // e.g., go.haulcommand.com
    tag?: string;
    externalId?: string;
    utm?: {
        source?: string;
        medium?: string;
        campaign?: string;
        term?: string;
        content?: string;
    };
}

interface DubLink {
    id: string;
    shortLink: string;
    url: string;
    clicks: number;
    qrCode: string;
}

// ── Create a tracked short link ──
export async function createLink(opts: CreateLinkOptions): Promise<DubLink | null> {
    if (!DUB_API_KEY) {
        console.warn('[Dub] No API key — skipping link creation');
        return null;
    }

    const body: Record<string, unknown> = {
        url: opts.url,
        domain: opts.domain || 'go.haulcommand.com',
        ...(opts.key ? { key: opts.key } : {}),
        ...(opts.tag ? { tagIds: [opts.tag] } : {}),
        ...(opts.externalId ? { externalId: opts.externalId } : {}),
    };

    // UTM params
    if (opts.utm) {
        Object.entries(opts.utm).forEach(([k, v]) => {
            if (v) body[`utm_${k}`] = v;
        });
    }

    const res = await fetch(`${DUB_API_URL}/links?workspaceId=${DUB_WORKSPACE}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DUB_API_KEY}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        console.error('[Dub] Link creation failed:', res.statusText);
        return null;
    }

    return res.json();
}

// ── Pre-built link generators ──
export const HaulLinks = {
    /** Create a claim link for outreach */
    claimLink: (surfaceId: string, source: string) =>
        createLink({
            url: `https://haulcommand.com/claim/${surfaceId}`,
            tag: 'claim',
            externalId: `claim-${surfaceId}`,
            utm: { source, medium: 'outreach', campaign: 'claim_flow' },
        }),

    /** Create a referral link */
    referralLink: (referrerId: string) =>
        createLink({
            url: `https://haulcommand.com/join?ref=${referrerId}`,
            tag: 'referral',
            externalId: `ref-${referrerId}`,
            utm: { source: 'referral', medium: 'share', campaign: 'referral_program' },
        }),

    /** Create a QR code link for physical materials */
    qrLink: (surfaceId: string, placement: string) =>
        createLink({
            url: `https://haulcommand.com/surface/${surfaceId}`,
            tag: 'qr',
            externalId: `qr-${surfaceId}-${placement}`,
            utm: { source: 'qr', medium: 'offline', campaign: placement },
        }),

    /** Create a corridor campaign attribution link */
    corridorLink: (corridorId: string, sponsorId: string) =>
        createLink({
            url: `https://haulcommand.com/corridors/${corridorId}`,
            tag: 'sponsor',
            externalId: `corridor-${corridorId}-${sponsorId}`,
            utm: { source: 'sponsor', medium: 'corridor', campaign: `sponsor_${sponsorId}` },
        }),

    /** Create a sponsor tracking link */
    sponsorLink: (sponsorId: string, targetUrl: string) =>
        createLink({
            url: targetUrl,
            tag: 'sponsor_click',
            externalId: `sponsor-${sponsorId}`,
            utm: { source: 'adgrid', medium: 'sponsored', campaign: `adgrid_${sponsorId}` },
        }),
};
