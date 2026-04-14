// ============================================================
// Dub — Short Links, QR Attribution, Referral Tracking
// Use for: QR codes, claim links, referral links, sponsor tracking
// Feature flag: DUB
// ============================================================

import { isEnabled } from '@/lib/feature-flags';

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
    if (!isEnabled('DUB') || !DUB_API_KEY) {
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

    /** Create a tracked AdGrid campaign link with variant + zone attribution */
    adGridLink: (campaignId: string, destinationUrl: string, zone: string, variant: string, country: string) =>
        createLink({
            url: destinationUrl,
            tag: 'adgrid',
            externalId: `adgrid-${campaignId}-${variant}`,
            utm: { source: 'adgrid', medium: zone, campaign: campaignId, content: variant },
        }),
};

// ── AdGrid analytics retrieval ──
export async function getAdGridAnalytics(externalId: string) {
    if (!DUB_API_KEY) return null;
    try {
        const res = await fetch(
            `${DUB_API_URL}/links?workspaceId=${DUB_WORKSPACE}&externalId=${externalId}`,
            { headers: { Authorization: `Bearer ${DUB_API_KEY}` } },
        );
        if (!res.ok) return null;
        const link = await res.json();
        if (!link?.id) return null;

        const analyticsRes = await fetch(
            `${DUB_API_URL}/analytics?workspaceId=${DUB_WORKSPACE}&linkId=${link.id}&groupBy=countries`,
            { headers: { Authorization: `Bearer ${DUB_API_KEY}` } },
        );
        return analyticsRes.ok ? analyticsRes.json() : null;
    } catch {
        return null;
    }
}

