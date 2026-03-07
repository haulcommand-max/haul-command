'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Zap, Crown, Shield, Rocket, ArrowRight, Loader2, Globe } from 'lucide-react';

interface Plan {
    tier: string;
    platform: string;
    name: string;
    tagline: string;
    base_price_usd: number;
    localized_price_usd: number;
    lookup_key: string;
    features: string[];
    limits: Record<string, number | string>;
    highlight: boolean;
}

interface PricingData {
    country_code: string;
    ppp_multiplier: number;
    directory?: Plan[];
    mobile?: Plan[];
}

const TIER_ICONS: Record<string, React.ReactNode> = {
    free: <Shield className="w-7 h-7 text-slate-400" />,
    pro: <Zap className="w-7 h-7 text-blue-400" />,
    elite: <Crown className="w-7 h-7 text-amber-400" />,
    enterprise: <Rocket className="w-7 h-7 text-purple-400" />,
};

const TIER_GRADIENTS: Record<string, string> = {
    free: 'from-slate-500/10 to-slate-600/5',
    pro: 'from-blue-500/10 to-cyan-500/5',
    elite: 'from-amber-500/10 to-orange-500/5',
    enterprise: 'from-purple-500/10 to-pink-500/5',
};

const TIER_BORDERS: Record<string, string> = {
    free: 'border-white/10',
    pro: 'border-blue-500/30',
    elite: 'border-amber-500/30',
    enterprise: 'border-purple-500/30',
};

export default function PricingPage() {
    const [data, setData] = useState<PricingData | null>(null);
    const [tab, setTab] = useState<'directory' | 'mobile'>('directory');
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/subscriptions/plans?country=US');
                const json = await res.json();
                setData(json);
            } catch (e) {
                console.error('Failed to load plans:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function handleSubscribe(lookupKey: string) {
        setCheckoutLoading(lookupKey);
        try {
            const res = await fetch('/api/subscriptions/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lookup_key: lookupKey,
                    country_code: data?.country_code || 'US',
                }),
            });
            const json = await res.json();
            if (json.checkout_url) {
                window.location.href = json.checkout_url;
            } else if (json.error) {
                alert(json.error);
            }
        } catch (e) {
            alert('Something went wrong. Please try again.');
        } finally {
            setCheckoutLoading(null);
        }
    }

    const plans = tab === 'directory' ? data?.directory : data?.mobile;

    return (
        <div className="min-h-screen bg-[#050508] text-white">
            <div className="max-w-7xl mx-auto px-4 py-16">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-4">
                        <Globe className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
                            Available in 57 Countries
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
                        Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Edge</span>
                    </h1>
                    <p className="text-slate-400 max-w-xl mx-auto text-lg">
                        From getting discovered to dominating corridors. Every tier unlocks more loads, more visibility, more revenue.
                    </p>
                </div>

                {/* Tab Toggle */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex bg-white/5 border border-white/10 rounded-2xl p-1">
                        <button
                            onClick={() => setTab('directory')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'directory'
                                ? 'bg-white/10 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            🖥 Directory Plans
                        </button>
                        <button
                            onClick={() => setTab('mobile')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'mobile'
                                ? 'bg-white/10 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            📱 Mobile App Plans
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {(plans || []).map(plan => (
                            <div
                                key={plan.lookup_key}
                                className={`relative rounded-3xl border p-6 transition-all hover:scale-[1.02] hover:shadow-2xl bg-gradient-to-b ${TIER_GRADIENTS[plan.tier] || TIER_GRADIENTS.free
                                    } ${TIER_BORDERS[plan.tier] || TIER_BORDERS.free}`}
                            >
                                {/* Highlight badge */}
                                {plan.highlight && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-lg">
                                        Most Popular
                                    </div>
                                )}

                                {/* Icon + Name */}
                                <div className="flex items-center gap-3 mb-3 mt-1">
                                    {TIER_ICONS[plan.tier] || TIER_ICONS.free}
                                    <div>
                                        <div className="font-bold text-lg">{plan.name}</div>
                                        <div className="text-xs text-slate-400">{plan.tagline}</div>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="mb-5">
                                    {plan.localized_price_usd === 0 ? (
                                        <div className="text-3xl font-black">Free</div>
                                    ) : (
                                        <div className="flex items-end gap-1">
                                            <span className="text-4xl font-black">${plan.localized_price_usd}</span>
                                            <span className="text-sm text-slate-500 pb-1">/mo</span>
                                        </div>
                                    )}
                                    {plan.base_price_usd !== plan.localized_price_usd && plan.base_price_usd > 0 && (
                                        <div className="text-xs text-slate-500 mt-1 line-through">
                                            ${plan.base_price_usd}/mo (US price)
                                        </div>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-2.5 mb-6">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                {plan.tier === 'free' ? (
                                    <button className="w-full py-3 rounded-xl border border-white/10 text-sm font-bold text-slate-400 hover:text-white hover:border-white/20 transition-all">
                                        Get Started Free
                                    </button>
                                ) : plan.tier === 'enterprise' ? (
                                    <a
                                        href="/contact?plan=enterprise"
                                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold hover:opacity-90 transition-all"
                                    >
                                        Contact Sales <ArrowRight className="w-4 h-4" />
                                    </a>
                                ) : (
                                    <button
                                        onClick={() => handleSubscribe(plan.lookup_key)}
                                        disabled={checkoutLoading === plan.lookup_key}
                                        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${plan.highlight
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-90 shadow-lg shadow-amber-500/20'
                                            : 'bg-white/10 text-white hover:bg-white/15'
                                            }`}
                                    >
                                        {checkoutLoading === plan.lookup_key ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                        ) : (
                                            <>Subscribe <ArrowRight className="w-4 h-4" /></>
                                        )}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Trust bar */}
                <div className="mt-16 text-center">
                    <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" /> Secure checkout via Stripe
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" /> Cancel anytime
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" /> Pricing adjusted for your region
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
