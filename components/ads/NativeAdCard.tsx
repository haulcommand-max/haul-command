'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAdImpression } from './useAdImpression';
import { safeUUID } from '@/lib/identity/uid';
import type { ServedAd } from '@/lib/ads/adrank';

/* SSR-safe sessionStorage helper */
function ssGet(key: string): string {
    if (typeof window === 'undefined') return '';
    try { return sessionStorage.getItem(key) || ''; } catch { return ''; }
}
function ssSet(key: string, val: string) {
    if (typeof window === 'undefined') return;
    try { sessionStorage.setItem(key, val); } catch { /* quota / private browsing */ }
}

/* ═══════════════════════════════════════════════════════════
   HOUSE ADS — Client-side fallback for empty ad inventory
   These run free until paid campaigns are active.
   Rotated deterministically per-surface to avoid repetition.
   ═══════════════════════════════════════════════════════════ */
const HOUSE_ADS: Omit<ServedAd, 'impression_token' | 'ad_rank' | 'price_model'>[] = [
    {
        ad_id: 'house-001', campaign_id: 'house', creative_id: 'house-001',
        headline: 'Claim Your Operator Profile',
        body: 'Stand out to brokers who search your corridor. Verified profiles get 5× more job requests.',
        cta_text: 'Claim Now — Free',
        cta_url: '/claim',
        image_url: '/ads/claim-profile.png', creative_type: 'native',
    },
    {
        ad_id: 'house-002', campaign_id: 'house', creative_id: 'house-002',
        headline: 'Need an Escort? Post Your Load',
        body: 'Connect with verified pilot car operators across 48 states. Fill open escort slots fast.',
        cta_text: 'Post a Load',
        cta_url: '/loads/post',
        image_url: '/ads/before-after.png', creative_type: 'native',
    },
    {
        ad_id: 'house-003', campaign_id: 'house', creative_id: 'house-003',
        headline: 'Route IQ — Free Complexity Scoring',
        body: 'Know your permit requirements, escort needs, and chokepoints before you book.',
        cta_text: 'Try Route IQ',
        cta_url: '/tools/route-iq',
        image_url: null, creative_type: 'native',
    },
    {
        ad_id: 'house-004', campaign_id: 'house', creative_id: 'house-004',
        headline: 'Get the Verified Badge ✓',
        body: 'Operators with verification earn 3× more trust and faster booking. Upload docs to qualify.',
        cta_text: 'Get Verified',
        cta_url: '/onboarding',
        image_url: '/ads/equipment-showcase.png', creative_type: 'native',
    },
    {
        ad_id: 'house-005', campaign_id: 'house', creative_id: 'house-005',
        headline: 'State Escort Rules Just Changed ⚠️',
        body: "Don't get fined. Check height, width, and escort rules for all 50 states instantly.",
        cta_text: 'Check Requirements',
        cta_url: '/tools/state-requirements',
        image_url: '/ads/compliance-alert.png', creative_type: 'native',
    },
    {
        ad_id: 'house-006', campaign_id: 'house', creative_id: 'house-006',
        headline: 'Join 1,247+ Operators on the Network',
        body: 'The fastest-growing pilot car platform in North America. Free to list, free to search.',
        cta_text: 'Join the Network',
        cta_url: '/onboarding',
        image_url: '/ads/social-proof.png', creative_type: 'native',
    },
    {
        ad_id: 'house-007', campaign_id: 'house', creative_id: 'house-007',
        headline: 'What Should You Charge?',
        body: 'Check real-time escort rates for any corridor. Stop guessing, start earning market rate.',
        cta_text: 'Rate Lookup',
        cta_url: '/tools/rate-lookup',
        image_url: null, creative_type: 'native',
    },
    {
        ad_id: 'house-008', campaign_id: 'house', creative_id: 'house-008',
        headline: 'Pilot Car Gear & Equipment',
        body: 'Flags, signs, amber lights, height poles — everything an escort needs, vetted and reviewed.',
        cta_text: 'Browse Gear',
        cta_url: '/gear',
        image_url: null, creative_type: 'native',
    },
    // ── 5 Targeted Industry Partner House Ads ──────────────────
    {
        ad_id: 'house-equip', campaign_id: 'house', creative_id: 'house-equip',
        headline: 'Shop CB Radios, Light Bars & Pilot Car Gear',
        body: 'Everything you need for FHWA-compliant escort operations. Reviewed by working operators.',
        cta_text: 'Shop Gear →',
        cta_url: '/gear',
        image_url: null, creative_type: 'native',
    },
    {
        ad_id: 'house-insurance', campaign_id: 'house', creative_id: 'house-insurance',
        headline: 'Get Pilot Car Insurance in 10 Minutes',
        body: 'Commercial auto + escort liability coverage. Instant quotes, next-day binding.',
        cta_text: 'Get a Quote →',
        cta_url: '/insurance',
        image_url: null, creative_type: 'native',
    },
    {
        ad_id: 'house-permits', campaign_id: 'house', creative_id: 'house-permits',
        headline: 'Instant Oversize Permits — All 50 States',
        body: 'Skip the paperwork. Get single-trip and annual OS/OW permits filed in minutes.',
        cta_text: 'Get Permits →',
        cta_url: '/tools/permit-calculator',
        image_url: null, creative_type: 'native',
    },
    {
        ad_id: 'house-training', campaign_id: 'house', creative_id: 'house-training',
        headline: 'Get Certified — State Pilot Car Courses',
        body: 'Online and in-person certification courses. Required in 38+ states. Start today.',
        cta_text: 'View Courses →',
        cta_url: '/training',
        image_url: null, creative_type: 'native',
    },
    {
        ad_id: 'house-copilot', campaign_id: 'house', creative_id: 'house-copilot',
        headline: 'Ask Any Compliance Question — Free',
        body: 'AI-powered escort regulation answers for all 50 states. Height poles, width limits, night bans.',
        cta_text: 'Try Copilot →',
        cta_url: '/tools/compliance-copilot',
        image_url: null, creative_type: 'native',
    },
];

// Ads weighted higher for operators vs brokers
const OPERATOR_ADS = ['house-001', 'house-003', 'house-004', 'house-equip', 'house-insurance', 'house-training', 'house-copilot'];
const BROKER_ADS = ['house-002', 'house-005', 'house-006', 'house-007', 'house-permits'];

/** Pick a weighted house ad based on surface + placement + user role */
function pickHouseAd(surface: string, placementId: string, userRole?: string): ServedAd {
    // Build weighted pool based on role
    let pool = HOUSE_ADS;
    if (userRole === 'operator' || userRole === 'escort') {
        pool = HOUSE_ADS.filter(a => OPERATOR_ADS.includes(a.ad_id)).concat(
            HOUSE_ADS.filter(a => OPERATOR_ADS.includes(a.ad_id)).slice(0, 3) // Double weight
        );
    } else if (userRole === 'broker') {
        pool = HOUSE_ADS.filter(a => BROKER_ADS.includes(a.ad_id)).concat(
            HOUSE_ADS.filter(a => BROKER_ADS.includes(a.ad_id)).slice(0, 3)
        );
    }
    if (pool.length === 0) pool = HOUSE_ADS;

    // Add time-based rotation (changes every 5 minutes)
    const timeSlot = Math.floor(Date.now() / 300000);
    let hash = timeSlot;
    const key = surface + placementId;
    for (let i = 0; i < key.length; i++) {
        hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % pool.length;
    return {
        ...pool[idx],
        impression_token: `house_${pool[idx].ad_id}_${timeSlot}`,
        ad_rank: 0,
        price_model: 'house',
    };
}

interface NativeAdCardProps {
    placementId: string;
    surface: string;
    variant?: 'directory' | 'inline' | 'sidebar';
    userRole?: string;
    jurisdiction?: string;
    sessionId?: string;
    className?: string;
}

export function NativeAdCard({
    placementId,
    surface,
    variant = 'directory',
    userRole,
    jurisdiction,
    sessionId,
    className = '',
}: NativeAdCardProps) {
    const [ad, setAd] = useState<ServedAd | null>(null);
    const [isHouseAd, setIsHouseAd] = useState(false);
    const [viewerKey, setViewerKey] = useState('');
    const [sid, setSid] = useState('');

    // Deterministic house ad for this slot (stable across re-renders)
    const fallbackAd = useMemo(() => pickHouseAd(surface, placementId, userRole), [surface, placementId, userRole]);

    // Generate stable session/viewer IDs (client-only)
    useEffect(() => {
        const storedKey = ssGet('hc_viewer_key') || safeUUID();
        ssSet('hc_viewer_key', storedKey);
        setViewerKey(storedKey);

        const storedSid = sessionId || ssGet('hc_session_id') || safeUUID();
        ssSet('hc_session_id', storedSid);
        setSid(storedSid);
    }, [sessionId]);

    // Fetch ad from production serve_ad_ranked RPC
    useEffect(() => {
        if (!viewerKey || !sid) return;
        async function fetchAd() {
            try {
                const supabase = createClient();
                const { data, error } = await supabase.rpc('serve_ad_ranked', {
                    p_surface: surface,
                    p_viewer_key: viewerKey,
                    p_session_id: sid,
                    p_geo_hash: null,
                    p_context: {},
                    p_limit: 1,
                });
                if (!error && data?.ads?.[0]) {
                    const served = data.ads[0];
                    setAd(served);
                    // Detect house ads from the RPC response
                    setIsHouseAd(served.campaign_id === 'house' || served.price_model === 'house');
                    return;
                }
            } catch {
                // RPC unreachable — use client-side fallback
            }
            // Fallback: client-side house ad (only if RPC itself failed)
            setAd(fallbackAd);
            setIsHouseAd(true);
        }
        fetchAd();
    }, [surface, viewerKey, sid, fallbackAd]);

    // Track impressions — now for ALL ads including house
    const { ref } = useAdImpression({
        impressionToken: ad?.impression_token || null,
        sessionId: sid,
    });

    // Click handler — track ALL ads (house + paid)
    const handleClick = useCallback(async () => {
        if (!ad) return;

        try {
            const supabase = createClient();
            if (isHouseAd) {
                // Track house ad clicks in adgrid_events
                supabase.from('adgrid_events').insert({
                    event_type: 'click',
                    ad_id: ad.ad_id,
                    creative_id: ad.creative_id,
                    surface,
                    session_id: sid,
                    metadata: { placement_id: placementId, cta_url: ad.cta_url },
                }).then(() => {});
            } else if (ad.impression_token) {
                await supabase.rpc('record_ad_click', {
                    p_impression_token: ad.impression_token,
                    p_session_id: sid,
                });
            }
        } catch {
            // Click tracking failure shouldn't block navigation
        }

        // House ads: internal navigation. Paid ads: new tab.
        if (isHouseAd) {
            window.location.href = ad.cta_url;
        } else {
            window.open(ad.cta_url, '_blank', 'noopener');
        }
    }, [ad, sid, isHouseAd]);

    if (!ad) return null;

    const sponsorLabel = isHouseAd ? 'Haul Command' : 'Sponsored';
    const badgeLabel = isHouseAd ? 'Free Tool' : 'Ad';

    // ── Directory Variant (Card) ──
    if (variant === 'directory') {
        return (
            <div ref={ref} className={`group relative border border-hc-border rounded-2xl p-5 bg-hc-surface hover:bg-hc-elevated transition-all cursor-pointer ${className}`} onClick={handleClick}>
                <div className="absolute top-4 right-4 ad-sponsored-badge">
                    {sponsorLabel}
                </div>
                {ad.image_url && (
                    <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-hc-elevated">
                        <img src={ad.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                )}
                <h4 className="font-bold text-hc-text text-sm mb-1 group-hover:text-hc-gold-500 transition-colors">{ad.headline}</h4>
                {ad.body && <p className="text-xs text-hc-muted mb-3 line-clamp-2">{ad.body}</p>}
                <span className="inline-block px-3 py-1.5 bg-hc-gold-500/10 text-hc-gold-500 text-xs font-bold rounded-lg border border-hc-gold-500/20 group-hover:bg-hc-gold-500/20">
                    {ad.cta_text}
                </span>
            </div>
        );
    }

    // ── Inline Variant (Load Board Row) ──
    if (variant === 'inline') {
        return (
            <div ref={ref} className={`group flex items-center gap-4 p-4 border border-hc-border rounded-xl bg-hc-surface hover:bg-hc-elevated transition-all cursor-pointer ${className}`} onClick={handleClick}>
                {ad.image_url && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-hc-elevated">
                        <img src={ad.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="ad-sponsored-badge shrink-0">{badgeLabel}</span>
                        <h4 className="font-bold text-hc-text text-sm truncate group-hover:text-hc-gold-500">{ad.headline}</h4>
                    </div>
                    {ad.body && <p className="text-xs text-hc-muted truncate">{ad.body}</p>}
                </div>
                <span className="shrink-0 px-3 py-1.5 text-xs font-bold text-hc-gold-500 bg-hc-gold-500/10 rounded-lg border border-hc-gold-500/20">
                    {ad.cta_text}
                </span>
            </div>
        );
    }

    // ── Sidebar Variant ──
    return (
        <div ref={ref} className={`border border-hc-border rounded-xl p-4 bg-hc-surface hover:bg-hc-elevated transition-all cursor-pointer ${className}`} onClick={handleClick}>
            <div className="text-[9px] font-bold text-hc-subtle mb-2 uppercase tracking-wider">{sponsorLabel}</div>
            {ad.image_url && (
                <div className="w-full h-24 rounded-lg overflow-hidden mb-3 bg-hc-elevated">
                    <img src={ad.image_url} alt="" className="w-full h-full object-cover" />
                </div>
            )}
            <h4 className="font-bold text-hc-text text-xs mb-1">{ad.headline}</h4>
            {ad.body && <p className="text-[10px] text-hc-muted mb-2 line-clamp-3">{ad.body}</p>}
            <span className="inline-block px-2 py-1 text-[10px] font-bold text-hc-gold-500 bg-hc-gold-500/10 rounded border border-hc-gold-500/20">
                {ad.cta_text}
            </span>
        </div>
    );
}
