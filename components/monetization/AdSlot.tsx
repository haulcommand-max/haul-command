"use client";

import React, { useEffect, useState } from 'react';

type AdPlacement = {
    id: string;
    creative_url: string;
    click_url: string;
    sponsor_name: string;
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
                    if (data?.creative_url) setAd(data);
                }
            } catch {
                // Fail silently — ads are non-critical
            }
        };
        fetchAd();
    }, [placement, geoKey, pageType, format]);

    if (!ad) return null; // No ad = no render. Never show empty slots.

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
            href={ad.click_url}
            target="_blank"
            rel="noopener sponsored"
            style={{ display: 'block', textDecoration: 'none', ...styles[format] }}
            onClick={() => {
                // Track click — fire and forget
                fetch(`/api/ads/click?id=${ad.id}`, { method: 'POST' }).catch(() => { });
            }}
        >
            <img
                src={ad.creative_url}
                alt={`Sponsored by ${ad.sponsor_name}`}
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
