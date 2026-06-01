"use client";

import React, { useEffect, useState } from 'react';

type AdPlacement = {
    id: string;
    campaign_id?: string;
    creative_id?: string;
    creative_url?: string;
    image_url?: string;
    click_url?: string;
    cta_url?: string;
    headline?: string;
    sponsor_name?: string;
    advertiser_name?: string;
    format: 'banner' | 'sidebar' | 'inline';
};

export default function AdSlot({
    placement,
    geoKey,
    pageType = 'directory',
    format = 'banner',
}: {
    placement: string;
    geoKey?: string;
    pageType?: string;
    format?: 'banner' | 'sidebar' | 'inline';
}) {
    const [ad, setAd] = useState<AdPlacement | null>(null);

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const params = new URLSearchParams({ placement, format });
                if (geoKey) params.set('geo', geoKey);
                if (pageType) params.set('page', pageType);

                const res = await fetch(`/api/ads/serve?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    const served = Array.isArray(data) ? data[0] : data?.ad ?? data;
                    if (served?.creative_url || served?.image_url) setAd(served);
                }
            } catch {
                // Fail silently — ads are non-critical
            }
        };
        fetchAd();
    }, [placement, geoKey, pageType, format]);

    if (!ad) return null; // No ad = no render. Never show empty slots.

    const imageUrl = ad.creative_url ?? ad.image_url;
    const clickUrl = ad.click_url ?? ad.cta_url ?? '#';
    const sponsorName = ad.sponsor_name ?? ad.advertiser_name ?? ad.headline ?? 'Haul Command';

    const styles: Record<string, React.CSSProperties> = {
        banner: {
            width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: '1.5rem',
            border: '1px solid rgba(255,255,255,0.06)', position: 'relative',
        },
        sidebar: {
            width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: '1rem',
            border: '1px solid rgba(255,255,255,0.06)', position: 'relative',
        },
        inline: {
            width: '100%', borderRadius: 10, overflow: 'hidden', margin: '1rem 0',
            border: '1px solid rgba(255,255,255,0.06)', position: 'relative',
        },
    };

    return (
        <a
            href={clickUrl}
            target="_blank"
            rel="noopener sponsored"
            style={{ display: 'block', textDecoration: 'none', ...styles[format] }}
            onClick={() => {
                // Track click — fire and forget
                if (!ad.campaign_id || ad.campaign_id === 'house') return;

                fetch('/api/ads/click', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        campaign_id: ad.campaign_id,
                        creative_id: ad.creative_id,
                        placement_id: placement,
                        country_code: geoKey,
                    }),
                }).catch(() => { });
            }}
        >
            <img
                src={imageUrl}
                alt={`Sponsored by ${sponsorName}`}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                loading="lazy"
            />
            <div style={{
                position: 'absolute', bottom: 4, right: 8,
                fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 1, pointerEvents: 'none',
            }}>
                Sponsored
            </div>
        </a>
    );
}
