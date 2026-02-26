'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAdImpression } from './useAdImpression';
import type { ServedAd } from '@/lib/ads/adrank';

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
    const [viewerKey, setViewerKey] = useState('');

    // Generate stable session/viewer IDs
    useEffect(() => {
        const storedKey = sessionStorage.getItem('hc_viewer_key') || crypto.randomUUID();
        sessionStorage.setItem('hc_viewer_key', storedKey);
        setViewerKey(storedKey);
    }, []);

    // Fetch ad using serve_ad_ranked
    useEffect(() => {
        if (!viewerKey) return;
        async function fetchAd() {
            try {
                const supabase = createClient();
                const sid = sessionId || sessionStorage.getItem('hc_session_id') || crypto.randomUUID();
                sessionStorage.setItem('hc_session_id', sid);

                const { data } = await supabase.rpc('serve_ad_ranked', {
                    p_surface: surface,
                    p_viewer_key: viewerKey,
                    p_session_id: sid,
                    p_geo_hash: null,
                    p_context: {},
                    p_limit: 1,
                });
                if (data?.ads?.[0]) setAd(data.ads[0]);
            } catch {
                // No ad to show — fail silently
            }
        }
        fetchAd();
    }, [surface, viewerKey, sessionId]);

    // Impression confirmation via dwell tracking
    const { ref } = useAdImpression({
        impressionToken: ad?.impression_token || null,
        sessionId: sessionId || sessionStorage.getItem('hc_session_id') || '',
    });

    // Click handler — uses production record_ad_click RPC
    const handleClick = useCallback(async () => {
        if (!ad) return;
        try {
            const supabase = createClient();
            const sid = sessionId || sessionStorage.getItem('hc_session_id') || '';
            await supabase.rpc('record_ad_click', {
                p_impression_token: ad.impression_token,
                p_session_id: sid,
            });
        } catch {
            // Click tracking failure shouldn't block navigation
        }
        window.open(ad.cta_url, '_blank', 'noopener');
    }, [ad, sessionId]);

    if (!ad) return null;

    // ── Directory Variant (Card) ──
    if (variant === 'directory') {
        return (
            <div ref={ref} className={`group relative border border-hc-border rounded-2xl p-5 bg-hc-surface hover:bg-hc-elevated transition-all cursor-pointer ${className}`} onClick={handleClick}>
                <div className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold text-hc-subtle bg-hc-elevated rounded-full border border-hc-border">
                    Sponsored
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
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-hc-text text-sm truncate group-hover:text-hc-gold-500">{ad.headline}</h4>
                        <span className="shrink-0 px-1.5 py-0.5 text-[8px] font-bold text-hc-subtle bg-hc-elevated rounded border border-hc-border">Ad</span>
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
            <div className="text-[9px] font-bold text-hc-subtle mb-2 uppercase tracking-wider">Sponsored</div>
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
