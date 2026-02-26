import React from 'react';
import { supabaseServer } from '@/lib/supabase/server';
import { ShoppingCart, Star, ShieldCheck, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Outfitters | Haul Command',
    description: 'Pro-grade pilot car equipment, amber light bars, DOT banners, and height poles dropshipped directly to you.'
};

export default async function GearStorePage() {
    const supabase = supabaseServer();

    // Fetch active products
    const { data: products } = await supabase
        .from('store_products')
        .select('*')
        .eq('is_active', true)
        .order('price_usd', { ascending: false });

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Hero Section */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-amber-500/10 blur-[120px] rounded-full point-events-none" />

                <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full mb-8">
                        <ShoppingCart className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-bold text-slate-300 tracking-widest uppercase">Outfitters</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6">
                        Pro-Grade Equipment.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Zero Bullshit.</span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
                        Stop buying cheap gear that breaks mid-escort. We've curated the exact height poles, light bars, and safety tools used by Elite-tier operators.
                    </p>

                    <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-300">
                        <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> DOT Compliant</div>
                        <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Fast Shipping</div>
                        <div className="flex items-center gap-2"><Star className="w-5 h-5 text-blue-500" /> Operator Tested</div>
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-6xl mx-auto px-6 pb-32">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products?.map((product) => (
                        <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all group flex flex-col">
                            {/* Product Image Placeholder */}
                            <div className="h-64 bg-slate-950 w-full relative p-6 flex flex-col items-center justify-center border-b border-slate-800">
                                <span className="text-6xl group-hover:scale-110 transition-transform duration-500 delay-75">
                                    {product.category === 'height_poles' ? '📏' :
                                        product.category === 'light_bars' ? '🚨' : '🚩'}
                                </span>
                                {product.fulfillment_type === 'internal_fba' && (
                                    <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500/20 text-amber-500 text-xs font-black uppercase tracking-widest rounded-full">
                                        HC EXCLUSIVE
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="p-8 flex flex-col flex-1">
                                <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{product.title}</h3>
                                <p className="text-slate-400 mb-8 flex-1">{product.description}</p>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="text-2xl font-black text-amber-500">
                                        ${product.price_usd}
                                    </div>

                                    {product.fulfillment_type === 'amazon_affiliate' ? (
                                        <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2">
                                            View Amazon <ExternalLink className="w-4 h-4" />
                                        </a>
                                    ) : (
                                        <button className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-colors flex items-center gap-2">
                                            Add to Cart <ArrowRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {products?.length === 0 && (
                    <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800">
                        <h3 className="text-2xl font-bold text-white mb-2">Store is restocking...</h3>
                        <p className="text-slate-400">Our first batch of Outfitters gear sold out. Check back soon.</p>
                    </div>
                )}
            </div>

            {/* Become Elite CTA */}
            <div className="max-w-6xl mx-auto px-6 mb-32">
                <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-10 md:p-16 text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />

                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 relative z-10">Verified Elite Status</h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8 relative z-10">
                        Want your profile to rank first in the Haul Command Directory? Upgrade to Verified Elite to secure a gold badge, custom outbound link, and top-page placement in your primary territory.
                    </p>

                    <button className="relative z-10 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-sm tracking-widest rounded-2xl transition-transform hover:scale-105 shadow-xl shadow-amber-500/20">
                        Upgrade for $99/mo
                    </button>
                </div>
            </div>
        </div>
    );
}

