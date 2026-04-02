"use client";

import React, { useEffect, useState } from 'react';
import { getMarketModeConfig, type MarketModeConfig } from '@/lib/ads/market-mode';
import Link from 'next/link';
import { Lock, ShieldAlert, Sparkles, MapPin } from 'lucide-react';

interface MarketGateProps {
    countryCode: string;
    surface: string;
    children: React.ReactNode;
    fallbackLabel?: string;
    overrideConfig?: Partial<MarketModeConfig>;
}

export function MarketGate({
    countryCode,
    surface,
    children,
    fallbackLabel,
}: MarketGateProps) {
    const [config, setConfig] = useState<MarketModeConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Evaluate market mode rules for this jurisdiction
        const resolvedConfig = getMarketModeConfig(countryCode.toUpperCase());
        setConfig(resolvedConfig);
        setLoading(false);
    }, [countryCode]);

    if (loading) {
        return <div className="animate-pulse bg-white/5 rounded-xl h-64 w-full" />;
    }

    if (!config) return <>{children}</>;

    // If surface is active in this mode, let it render normally
    if (config.surfaces_active.includes(surface)) {
        return <>{children}</>;
    }

    // ── Gated State UI (Seed or Dormant) ──
    const isSeed = config.mode === 'seed';
    const ctaText = config.cta_type === 'claim_waitlist' 
        ? `Join the ${fallbackLabel || countryCode} Waitlist` 
        : `Request ${fallbackLabel || countryCode} Coverage`;

    return (
        <div className="relative border border-white/5 bg-[#0a0a0a] rounded-2xl overflow-hidden mt-6">
            <div className="absolute inset-0 bg-hc-gold-500/5 blur-3xl opacity-20 pointer-events-none" />
            
            {/* The obfuscated children grid (shows proof of structure without giving away value) */}
            <div className="absolute inset-0 opacity-10 blur-[8px] pointer-events-none saturate-0" aria-hidden="true">
                <div className="p-8 grid grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white/20 h-24 rounded-lg" />
                    ))}
                </div>
            </div>

            <div className="relative z-10 p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[360px]">
                {isSeed ? (
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mb-6 ring-1 ring-amber-500/50">
                        <Sparkles size={28} />
                    </div>
                ) : (
                    <div className="w-16 h-16 rounded-full bg-white/10 text-gray-400 flex items-center justify-center mb-6 ring-1 ring-white/20">
                        <MapPin size={28} />
                    </div>
                )}

                <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4 tracking-tight">
                    {isSeed 
                        ? `Seeding Operators in ${fallbackLabel || countryCode.toUpperCase()}`
                        : `${fallbackLabel || countryCode.toUpperCase()} Dispatch is Dormant`}
                </h3>

                <p className="text-gray-400 max-w-lg mx-auto mb-8 text-base">
                    {isSeed 
                        ? 'We are currently seating the first early-access pilot cars and escort vehicles for this jurisdiction. Lock in your territory now before the grid goes live to the public.'
                        : 'We have not yet launched active dispatch routing for this jurisdiction. Search capability is currently restricted.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    {config.no_dead_end_behavior.show_waitlist && (
                        <Link 
                            href={`/claim?country=${countryCode}`}
                            className={`px-8 py-3.5 rounded-xl font-bold transition-all ${
                                isSeed 
                                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                  : 'bg-white text-black hover:bg-gray-200'
                            }`}
                        >
                            {ctaText}
                        </Link>
                    )}

                    {config.no_dead_end_behavior.show_sponsor_interest_capture && (
                        <Link 
                            href={`/sponsor?country=${countryCode}`}
                            className="px-8 py-3.5 border border-white/20 hover:border-white/40 text-white rounded-xl font-bold transition-all hover:bg-white/5 flex items-center justify-center gap-2"
                        >
                            <ShieldAlert size={18} />
                            Expedite Unlocking
                        </Link>
                    )}
                </div>

                <div className="mt-8 text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                    <Lock size={12} />
                    Directory access restricted
                </div>
            </div>
        </div>
    );
}
