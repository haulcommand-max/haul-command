import type { Metadata } from 'next';
import Link from 'next/link';
import { DATA_PRODUCT_CATALOG } from '@/lib/monetization/data-product-engine';

export const metadata: Metadata = {
    title: 'Haul Command Data Marketplace | Heavy Haul Intelligence & Market Reports',
    description: 'Access corridor demand snapshots, rate benchmarks, operator density maps, and market intelligence reports. Powered by real platform data across 120 countries. Self-serve purchase from $9.',
    alternates: {
        canonical: 'https://www.haulcommand.com/data',
    },
};

const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Haul Command Data Marketplace',
    description: 'Heavy haul market intelligence products: corridor demand data, rate benchmarks, operator density maps, and enterprise intelligence feeds.',
    url: 'https://www.haulcommand.com/data',
};

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'What data does Haul Command sell?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Haul Command sells corridor demand snapshots, rate benchmark reports, operator density maps, market intelligence reports, competitor tracking, export CSVs, and enterprise API access. All data is sourced from real platform activity across 120 countries.',
            },
        },
        {
            '@type': 'Question',
            name: 'How accurate is Haul Command market data?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Haul Command data is sourced directly from platform activity — live operator availability, real escort requests, verified claim data, and search demand signals. Rates and benchmarks are updated daily for US corridors and weekly for global markets.',
            },
        },
        {
            '@type': 'Question',
            name: 'Can I get Haul Command data via API?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Haul Command offers a developer API with sandbox access (free, 100 calls/day), a developer tier ($99/month, 10K calls/day), and enterprise tiers with custom SLAs. Visit /developers to apply for an API key.',
            },
        },
    ],
};

// Product type icons and colors
const PRODUCT_UI: Record<string, { icon: string; color: string; badge?: string }> = {
    corridor_snapshot:      { icon: '🛣️', color: 'from-blue-500/10',    badge: 'Real-time' },
    market_report:          { icon: '📊', color: 'from-purple-500/10',  badge: 'Daily refresh' },
    rate_benchmark:         { icon: '💰', color: 'from-green-500/10',   badge: 'Best value' },
    competitor_tracking:    { icon: '🔍', color: 'from-orange-500/10',  badge: 'Subscription' },
    claim_gap_report:       { icon: '📍', color: 'from-cyan-500/10',    badge: '$9 one-time' },
    csv_export:             { icon: '📥', color: 'from-gray-500/10',    badge: 'Metered' },
    api_access:             { icon: '🔌', color: 'from-pink-500/10',    badge: 'Enterprise' },
    alert_subscription:     { icon: '🔔', color: 'from-yellow-500/10', badge: 'Included Pro' },
    enterprise_feed:        { icon: '🏢', color: 'from-red-500/10',     badge: 'Enterprise' },
};

function formatPrice(product: typeof DATA_PRODUCT_CATALOG[number]): string {
    if (product.price_usd === 0) return product.purchase_type === 'metered' ? '$4.99/export (free tier)' : 'Included with Pro';
    if (product.purchase_type === 'subscription') return `$${product.price_usd}/mo`;
    if (product.purchase_type === 'one_time') return `$${product.price_usd}`;
    if (product.purchase_type === 'metered') return `$${product.price_usd}/use`;
    return `$${product.price_usd}`;
}

export default function DataMarketplacePage() {
    const products = DATA_PRODUCT_CATALOG.filter(p => p.active);
    const selfServeProducts = products.filter(p => p.tier_required !== 'enterprise');
    const enterpriseProducts = products.filter(p => p.tier_required === 'enterprise');

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <div className="min-h-screen bg-[#0B0B0C] text-white">

                {/* ── Hero ── */}
                <section className="relative overflow-hidden border-b border-white/5">
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(ellipse at 30% 0%, #3b82f680 0%, transparent 70%)' }} />
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 relative z-10">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 mb-6">
                                Intelligence Marketplace
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-[1.1]">
                                Heavy Haul Market{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                                    Intelligence
                                </span>
                            </h1>
                            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                                Corridor demand data, rate benchmarks, operator density maps, and market intelligence across 120 countries.
                                Powered by real platform activity — not surveys, not estimates.
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1.5"><span className="text-blue-400">●</span> Real platform data</span>
                                <span className="flex items-center gap-1.5"><span className="text-blue-400">●</span> 120 countries</span>
                                <span className="flex items-center gap-1.5"><span className="text-blue-400">●</span> Updated daily</span>
                                <span className="flex items-center gap-1.5"><span className="text-blue-400">●</span> Self-serve from $9</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Self-Serve Products ── */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h2 className="text-2xl font-bold text-white mb-2">Self-Serve Data Products</h2>
                    <p className="text-gray-400 mb-8 text-sm">Purchase instantly. No sales call required for these products.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {selfServeProducts.map(product => {
                            const ui = PRODUCT_UI[product.type] ?? { icon: '📦', color: 'from-gray-500/10' };
                            return (
                                <div key={product.id}
                                    className={`relative bg-gradient-to-br ${ui.color} to-[#121214] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:border-white/20 transition-all group`}>

                                    {ui.badge && (
                                        <span className="absolute top-4 right-4 text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full text-gray-300">
                                            {ui.badge}
                                        </span>
                                    )}

                                    <div>
                                        <div className="text-2xl mb-3">{ui.icon}</div>
                                        <h3 className="font-bold text-white mb-1">{product.name}</h3>
                                        <p className="text-xs text-gray-400 leading-relaxed">{product.description}</p>
                                    </div>

                                    {/* Preview fields shown */}
                                    <div className="border border-white/5 rounded-lg p-3 bg-black/20">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Preview fields</div>
                                        <div className="flex flex-wrap gap-1">
                                            {product.preview_fields.map(f => (
                                                <span key={f} className="text-xs bg-white/5 text-gray-300 px-2 py-0.5 rounded">{f.replace(/_/g, ' ')}</span>
                                            ))}
                                            <span className="text-xs text-gray-500 px-2 py-0.5">+{product.full_fields.length - product.preview_fields.length} locked</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-lg font-extrabold text-white">{formatPrice(product)}</span>
                                        <Link href={`/data/${product.id}`}
                                            className="text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                                            View details →
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── Enterprise Products ── */}
                <section className="border-t border-white/5 bg-[#0f1115]">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <h2 className="text-2xl font-bold text-white mb-2">Enterprise Intelligence Feeds</h2>
                        <p className="text-gray-400 mb-8 text-sm">For logistics companies, insurers, fleet managers, and enterprise buyers. Contact required for setup.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {enterpriseProducts.map(product => {
                                const ui = PRODUCT_UI[product.type] ?? { icon: '🏢', color: 'from-gray-500/10' };
                                return (
                                    <div key={product.id}
                                        className="border border-white/10 rounded-2xl p-6 bg-[#121214] hover:border-white/20 transition-all">
                                        <div className="text-2xl mb-3">{ui.icon}</div>
                                        <h3 className="font-bold text-white mb-1">{product.name}</h3>
                                        <p className="text-sm text-gray-400 mb-4 leading-relaxed">{product.description}</p>
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {product.country_scope.map(c => (
                                                <span key={c} className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded">{c}</span>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-extrabold text-white">{formatPrice(product)}</span>
                                            <Link href="/data/corridor-intelligence"
                                                className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                                                Request access →
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ── Developer API CTA ── */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/10 border border-blue-500/20 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Need programmatic access?</h2>
                            <p className="text-gray-300 max-w-lg">The Haul Command API gives developers direct access to operator data, corridor intelligence, rate benchmarks, and coverage confidence scores. Sandbox keys are free.</p>
                        </div>
                        <div className="flex flex-col gap-3 shrink-0">
                            <Link href="/developers"
                                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-500 transition-all whitespace-nowrap">
                                Get a Sandbox API Key
                            </Link>
                            <Link href="/developers/pricing"
                                className="text-center text-sm text-gray-400 hover:text-white transition-colors">
                                View API pricing →
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="border-t border-white/5 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">Data Marketplace FAQ</h2>
                    <div className="space-y-5">
                        {[
                            {
                                q: 'What data does Haul Command sell?',
                                a: 'Corridor demand snapshots, rate benchmark reports, operator density maps, market intelligence reports, competitor tracking, export CSVs, and enterprise API access. All sourced from real platform activity across 120 countries.',
                            },
                            {
                                q: 'How accurate is Haul Command market data?',
                                a: 'Data is sourced from real platform activity — live operator availability, verified escort requests, claim events, and search demand signals. Rates and benchmarks are updated daily for US corridors, weekly for global markets.',
                            },
                            {
                                q: 'Can I get data via API?',
                                a: 'Yes. Sandbox access is free (100 calls/day). Developer tier ($99/mo) gives 10K calls/day and all read endpoints. Enterprise tier includes custom SLAs, real-time feeds, and white-label options.',
                            },
                            {
                                q: 'What is the corridor intelligence enterprise feed?',
                                a: 'A weekly CSV or live API feed with corridor liquidity scores, shortage zone flags, rate benchmarks by state, and operator density data. Sold to logistics planners, fleet managers, and insurance underwriters.',
                            },
                        ].map(({ q, a }) => (
                            <div key={q} className="border border-white/10 rounded-xl p-5">
                                <h3 className="font-semibold text-white mb-1.5 text-sm">{q}</h3>
                                <p className="text-xs text-gray-400 leading-relaxed">{a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Cross-links ── */}
                <div className="border-t border-white/5 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 justify-center">
                        <Link href="/developers" className="hover:text-white transition-colors">Developer API</Link>
                        <span>·</span>
                        <Link href="/corridors" className="hover:text-white transition-colors">Corridor Intelligence</Link>
                        <span>·</span>
                        <Link href="/directory" className="hover:text-white transition-colors">Operator Directory</Link>
                        <span>·</span>
                        <Link href="/advertise" className="hover:text-white transition-colors">Advertise</Link>
                        <span>·</span>
                        <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                    </div>
                </div>

            </div>
        </>
    );
}
