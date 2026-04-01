'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Shield, Zap, Crown, ArrowRight, Loader2, CheckCircle, MapPin } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Product {
    id: string;
    product_key: string;
    name: string;
    amount: number;
    currency: string;
    duration_days: number;
}

const PRODUCT_ICONS: Record<string, React.ReactNode> = {
    'city_sponsor_basic': <MapPin className="w-6 h-6 text-blue-400" />,
    'city_sponsor_premium': <Crown className="w-6 h-6 text-amber-400" />,
    'corridor_sponsor': <Zap className="w-6 h-6 text-emerald-400" />,
};

const PRODUCT_HIGHLIGHTS: Record<string, string[]> = {
    'city_sponsor_basic': ['Your logo on city page', 'Priority listing', '30-day placement'],
    'city_sponsor_premium': ['Hero banner placement', 'Direct call CTA', 'Lead analytics dashboard', '30-day placement'],
    'corridor_sponsor': ['Full corridor coverage', 'Premium banner + map pin', 'Leaderboard integration', 'Lead analytics + alerts'],
};

function SponsorCheckoutInner() {
    const searchParams = useSearchParams();
    const cityParam = searchParams.get('city') || '';
    const preselectedProduct = searchParams.get('product') || '';

    const [products, setProducts] = useState<Product[]>([]);
    const [selectedKey, setSelectedKey] = useState(preselectedProduct || 'city_sponsor_basic');
    const [geoKey, setGeoKey] = useState(cityParam);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadProducts() {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('sponsorship_products')
                .select('*')
                .order('amount', { ascending: true });

            if (!error && data) setProducts(data);
            setLoading(false);
        }
        loadProducts();
    }, []);

    const selectedProduct = products.find(p => p.product_key === selectedKey);

    async function handleCheckout() {
        if (!selectedProduct || !geoKey.trim()) {
            setError('Please enter a city or corridor name.');
            return;
        }
        setSubmitting(true);
        setError('');

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/auth/login?redirect=/sponsor/checkout';
                return;
            }

            // Create order in DB
            const { data: order, error: orderErr } = await supabase
                .from('sponsorship_orders')
                .insert({
                    user_id: user.id,
                    product_key: selectedProduct.product_key,
                    geo_key: geoKey.trim(),
                    status: 'pending',
                })
                .select('id')
                .single();

            if (orderErr) throw orderErr;

            // Call edge function to create Stripe checkout session
            const { data: session, error: stripeErr } = await supabase.functions.invoke('hc_webhook_stripe', {
                body: {
                    action: 'create_checkout',
                    order_id: order.id,
                    product_key: selectedProduct.product_key,
                    amount: selectedProduct.amount,
                    currency: selectedProduct.currency,
                    geo_key: geoKey.trim(),
                },
            });

            if (stripeErr) throw stripeErr;

            if (session?.checkout_url) {
                window.location.href = session.checkout_url;
            } else {
                // Fallback: go to success page (for demo without Stripe keys)
                window.location.href = `/sponsor/success?order_id=${order.id}`;
            }
        } catch (e: any) {
            setError(e.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#050508] text-white">
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-4">
                        <Shield className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Sponsor a Market</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                        Own Your Territory
                    </h1>
                    <p className="text-slate-400 mt-4 max-w-lg mx-auto">
                        Get exclusive placement on Haul Command's highest-traffic pages. Brokers and carriers see you <strong className="text-white">first</strong>.
                    </p>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-4 mb-10">
                        {products.map(p => (
                            <button
                                key={p.product_key}
                                onClick={() => setSelectedKey(p.product_key)}
                                className={`p-6 rounded-2xl border text-left transition-all ${selectedKey === p.product_key
                                    ? 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/10'
                                    : 'border-white/10 bg-[#0a0a0f] hover:border-white/20'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    {PRODUCT_ICONS[p.product_key] || <Shield className="w-6 h-6 text-slate-400" />}
                                    <span className="font-bold text-lg">{p.name}</span>
                                </div>
                                <div className="text-3xl font-black text-white mb-1">
                                    ${p.amount}<span className="text-base font-medium text-slate-500">/mo</span>
                                </div>
                                <div className="text-xs text-slate-500 mb-4">{p.duration_days}-day placement</div>
                                <ul className="space-y-2">
                                    {(PRODUCT_HIGHLIGHTS[p.product_key] || []).map((h, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                            </button>
                        ))}
                    </div>
                )}

                {/* Geo Key Input */}
                <div className="max-w-md mx-auto mb-8">
                    <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
                        City or Corridor to Sponsor
                    </label>
                    <input
                        type="text"
                        value={geoKey}
                        onChange={(e) => setGeoKey(e.target.value)}
                        placeholder="e.g. Houston, TX or I-10 Corridor"
                        className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="max-w-md mx-auto mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                        {error}
                    </div>
                )}

                {/* CTA */}
                <div className="text-center">
                    <button
                        onClick={handleCheckout}
                        disabled={submitting || !selectedProduct}
                        className="inline-flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-lg px-8 py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                    >
                        {submitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                        ) : (
                            <>Claim This Territory <ArrowRight className="w-5 h-5" /></>
                        )}
                    </button>
                    <p className="text-xs text-slate-500 mt-3">Secure checkout via Stripe. Cancel anytime.</p>
                </div>
            </div>
        </div>
    );
}

export default function SponsorCheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>}>
            <SponsorCheckoutInner />
        </Suspense>
    );
}
