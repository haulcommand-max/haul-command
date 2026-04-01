'use client';

/**
 * ClaimPressureEngine — Unified claim conversion system
 * 
 * Merges and upgrades:
 *   - ClaimBanner (growth/) → passive CTA
 *   - ClaimValueContrast (directory/) → before/after comparison
 *   - StickyClaimBar (directory/) → scroll-triggered sticky
 *   - ProfileClaimSidebar → sidebar CTA
 * 
 * Into ONE component with multiple variants, driven by real market data.
 * Shows claim pressure signals from '/api/market/heartbeat' to create urgency.
 * 
 * Variants:
 *   - "banner"  → Inline banner with market truth
 *   - "card"    → Full card with value comparison + market signals
 *   - "sticky"  → Bottom sticky bar (mobile-first)
 *   - "inline"  → Compact inline nudge
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, ChevronRight, Star, TrendingUp, CheckCircle, Clock, Users, Zap, X } from 'lucide-react';
import { track } from '@/lib/telemetry';

interface ClaimPressureProps {
    listingId: string;
    listingName: string;
    variant?: 'banner' | 'card' | 'sticky' | 'inline';
    /** State code for live market data */
    state?: string;
    /** Show the value contrast (unclaimed vs claimed) */
    showValueContrast?: boolean;
    className?: string;
}

interface MarketSignal {
    activeLoads: number;
    verifiedOperators: number;
    mode: string;
}

// Claim value items — what you unlock
const CLAIM_VALUES = [
    { icon: CheckCircle, label: 'Verified badge + trust boost', color: '#22C55E' },
    { icon: Star, label: 'Receive ratings & reviews', color: '#F59E0B' },
    { icon: TrendingUp, label: 'Higher search ranking', color: '#3B82F6' },
    { icon: Users, label: 'Dispatch matching eligible', color: '#8B5CF6' },
    { icon: Zap, label: 'Real-time availability status', color: '#14B8A6' },
    { icon: Clock, label: 'Lead routing & notifications', color: '#EC4899' },
];

export function ClaimPressureEngine({
    listingId,
    listingName,
    variant = 'card',
    state,
    showValueContrast = true,
    className = '',
}: ClaimPressureProps) {
    const [dismissed, setDismissed] = useState(false);
    const [marketSignal, setMarketSignal] = useState<MarketSignal | null>(null);
    const [stickyVisible, setStickyVisible] = useState(false);

    const claimUrl = `/claim?listing=${listingId}`;

    // Fetch live market signals for urgency
    useEffect(() => {
        if (!state) return;
        fetch(`/api/market/heartbeat?state=${state}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) {
                    setMarketSignal({
                        activeLoads: data.activeLoads || 0,
                        verifiedOperators: data.verifiedOperators || 0,
                        mode: data.mode || 'seeding',
                    });
                }
            })
            .catch(() => {});
    }, [state]);

    // Sticky visibility on scroll
    useEffect(() => {
        if (variant !== 'sticky') return;
        const handler = () => setStickyVisible(window.scrollY > 400);
        window.addEventListener('scroll', handler, { passive: true });
        handler();
        return () => window.removeEventListener('scroll', handler);
    }, [variant]);

    const handleClick = () => {
        track('claim_pressure_clicked' as any, {
            entity_type: 'listing',
            entity_id: listingId,
            metadata: { variant, listing_name: listingName, has_market_signal: !!marketSignal },
        });
    };

    if (dismissed) return null;

    // Market urgency copy
    const urgencyCopy = marketSignal
        ? marketSignal.mode === 'live'
            ? `${marketSignal.activeLoads} active loads in your area. Verified operators get contacted first.`
            : marketSignal.mode === 'seeding'
                ? `${marketSignal.verifiedOperators} operators claimed in your market. Don't fall behind.`
                : `Operators in your area are getting verified. Claim yours before someone else does.`
        : 'Verify to unlock premium features and get found by brokers.';

    /* ───── INLINE VARIANT ───── */
    if (variant === 'inline') {
        return (
            <div className={`flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 ${className}`}>
                <Shield className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="flex-1 text-sm text-slate-300">
                    <span className="font-semibold text-white">Is this your business?</span>{' '}
                    {urgencyCopy}
                </p>
                <Link
                    href={claimUrl}
                    onClick={handleClick}
                    className="shrink-0 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs rounded-lg transition-colors"
                >
                    Claim →
                </Link>
            </div>
        );
    }

    /* ───── BANNER VARIANT ───── */
    if (variant === 'banner') {
        return (
            <div className={`bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-5 ${className}`}>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-bold text-white">Is this your business?</h3>
                        <p className="text-sm text-slate-400 mt-1">{urgencyCopy}</p>
                        {marketSignal && (
                            <div className="flex gap-4 mt-3 text-xs text-slate-500">
                                {marketSignal.activeLoads > 0 && (
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        {marketSignal.activeLoads} active loads
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    {marketSignal.verifiedOperators} verified
                                </span>
                            </div>
                        )}
                        <Link
                            href={claimUrl}
                            onClick={handleClick}
                            className="inline-flex items-center gap-2 mt-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2.5 rounded-lg transition-colors text-sm group"
                        >
                            Claim This Listing
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    /* ───── STICKY VARIANT (mobile-first) ───── */
    if (variant === 'sticky') {
        return (
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
                    stickyVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                }`}
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div
                    className="flex items-center justify-between gap-3 px-4 py-3"
                    style={{
                        background: 'rgba(9,11,17,0.97)',
                        borderTop: '1px solid rgba(241,169,27,0.25)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-white">Claim {listingName}</div>
                        <div className="text-[10px] text-white/40">
                            {marketSignal && marketSignal.activeLoads > 0
                                ? `${marketSignal.activeLoads} loads active · Free verification`
                                : 'Free · Verified in 24 hrs'}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={claimUrl}
                            onClick={handleClick}
                            className="px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider text-black"
                            style={{ background: '#F1A91B' }}
                        >
                            Claim
                        </Link>
                        <button
                            onClick={() => setDismissed(true)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white transition-colors"
                            style={{ background: 'rgba(255,255,255,0.05)' }}
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ───── CARD VARIANT (full power) ───── */
    return (
        <div className={`bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl overflow-hidden ${className}`}>
            {/* Header */}
            <div className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Claim This Listing</h3>
                        <p className="text-xs text-slate-400">{urgencyCopy}</p>
                    </div>
                </div>

                {/* Market pressure signals */}
                {marketSignal && (
                    <div className="flex gap-3 mt-4">
                        {marketSignal.activeLoads > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/15 rounded-lg">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                                </span>
                                <span className="text-[11px] font-bold text-emerald-400">{marketSignal.activeLoads} live loads</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/15 rounded-lg">
                            <Users className="w-3 h-3 text-amber-400" />
                            <span className="text-[11px] font-bold text-amber-400">{marketSignal.verifiedOperators} claimed</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Value comparison */}
            {showValueContrast && (
                <div className="px-6 pb-4">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">
                        What you unlock
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {CLAIM_VALUES.map(({ icon: Icon, label, color }) => (
                            <div key={label} className="flex items-center gap-2 text-sm text-slate-300">
                                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                                <span className="text-xs">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CTA */}
            <div className="p-6 pt-3 border-t border-white/5">
                <Link
                    href={claimUrl}
                    onClick={handleClick}
                    className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-xl transition-colors text-sm group"
                >
                    <Shield className="w-4 h-4" />
                    Claim This Listing
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <p className="text-center text-[10px] text-white/25 mt-3 uppercase tracking-wider font-semibold">
                    Free · Takes 2 minutes · No credit card
                </p>
            </div>
        </div>
    );
}

export default ClaimPressureEngine;
