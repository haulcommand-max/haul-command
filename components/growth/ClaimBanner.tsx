'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, ChevronRight, Star, TrendingUp, CheckCircle } from 'lucide-react';
import { track } from '@/lib/telemetry';

/* ──────────────────────────────────────────────────── */
/*  Claim Banner                                         */
/*  Shown on unclaimed directory listings                 */
/*  Links to claim flow → verification → richer profile   */
/* ──────────────────────────────────────────────────── */

interface ClaimBannerProps {
    listingId: string;
    listingName: string;
    variant?: 'inline' | 'card' | 'sticky';
}

export default function ClaimBanner({
    listingId,
    listingName,
    variant = 'inline',
}: ClaimBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const claimUrl = `/claim?listing=${listingId}`;

    const handleClick = () => {
        track('claim_cta_shown' as any, {
            entity_type: 'listing',
            entity_id: listingId,
            metadata: { variant, listing_name: listingName },
        });
    };

    if (variant === 'sticky') {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 to-orange-600 border-t border-amber-500/50 shadow-2xl animate-in slide-in-from-bottom duration-500">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
                    <Shield className="w-6 h-6 text-white shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold truncate">
                            Is this your business?
                        </p>
                        <p className="text-amber-100/80 text-xs">
                            Claim &amp; verify to unlock premium features
                        </p>
                    </div>
                    <Link
                        href={claimUrl}
                        onClick={handleClick}
                        className="shrink-0 px-5 py-2 bg-white hover:bg-slate-50 text-amber-700 font-bold text-sm rounded-lg transition-colors shadow-md"
                    >
                        Claim Now
                    </Link>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-amber-100/60 hover:text-white text-xs shrink-0 transition-colors"
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Is this your business?</h3>
                        <p className="text-sm text-slate-400">Claim this listing to manage your profile</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Verified badge + rank boost</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                        <Star className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Receive reviews + ratings</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                        <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Appear higher in search</span>
                    </div>
                </div>

                <Link
                    href={claimUrl}
                    onClick={handleClick}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors text-sm group"
                >
                    Claim This Listing
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>
        );
    }

    // Default: inline
    return (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
            <Shield className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="flex-1 text-sm text-slate-300">
                <span className="font-semibold text-white">Is this your business?</span>{' '}
                Claim to verify, update details, and boost your rank.
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
