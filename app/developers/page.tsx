import type { Metadata } from 'next';
import Link from 'next/link';
import { SandboxSignupForm } from './SandboxSignupForm';

export const metadata: Metadata = {
    title: 'Haul Command Developer API | Heavy Haul Logistics Intelligence API',
    description: 'Access verified pilot car operator data, corridor intelligence, rate benchmarks, and coverage scores via API. Sandbox keys are free. 100 calls/day with no credit card required.',
    alternates: { canonical: 'https://www.haulcommand.com/developers' },
    openGraph: {
        title: 'Haul Command Developer API',
        description: 'Programmatic access to heavy haul intelligence data across 120 countries.',
        url: 'https://www.haulcommand.com/developers',
    },
};

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'What data does the Haul Command API provide?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'The Haul Command API provides access to verified pilot car operator profiles, corridor demand and supply intelligence, escort rate benchmarks, coverage confidence scores, and glossary term definitions. Enterprise tiers add real-time feeds and webhook delivery.',
            },
        },
        {
            '@type': 'Question',
            name: 'Is there a free API tier?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. The sandbox tier is permanently free with 100 API calls per day, access to the operator search endpoint (limited fields), and no credit card required. Apply for a sandbox key on this page.',
            },
        },
        {
            '@type': 'Question',
            name: 'What are the rate limits for the Haul Command API?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Sandbox: 100 calls/day. Developer ($99/mo): 10,000 calls/day. Enterprise (custom pricing): Unlimited calls governed by SLA. All tiers have per-second limits to prevent burst abuse.',
            },
        },
    ],
};

const API_TIERS = [
    {
        name: 'Sandbox',
        price: 'Free',
        note: 'No credit card',
        highlight: false,
        rateLimit: '100 calls/day',
        endpoints: ['GET /v1/operators/search (limited fields)'],
        features: [
            'Operators search endpoint',
            'Glossary definitions',
            '100 calls/day',
            'JSON responses',
            'No SLA',
        ],
        missing: ['Coverage confidence', 'Rate benchmarks', 'Corridor data', 'Webhooks', 'Support'],
        cta: 'Get Sandbox Key',
        ctaAnchor: '#sandbox-form',
        ctaClass: 'bg-white/10 border border-white/20 text-white hover:bg-white/15',
    },
    {
        name: 'Developer',
        price: '$99/mo',
        note: 'Cancel anytime',
        highlight: true,
        rateLimit: '10,000 calls/day',
        endpoints: ['All read endpoints'],
        features: [
            'All read endpoints',
            'Coverage confidence scores',
            'Rate benchmarks by corridor',
            'Corridor demand + supply data',
            '10,000 calls/day',
            'Webhook support (8 events)',
            'Email support (48h SLA)',
        ],
        missing: ['Real-time feeds', 'White-label', 'Dedicated account manager'],
        cta: 'Start Developer Trial',
        ctaAnchor: '#sandbox-form',
        ctaClass: 'bg-hc-gold-500 text-black hover:bg-hc-gold-400',
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        note: 'From $499/mo',
        highlight: false,
        rateLimit: 'Unlimited (SLA)',
        endpoints: ['All endpoints + real-time feeds'],
        features: [
            'Everything in Developer',
            'Unlimited calls (governed by SLA)',
            'Real-time corridor liquidity feeds',
            'Operator availability webhooks',
            'White-label data delivery',
            'Custom endpoint scoping',
            'Dedicated account manager',
            'Uptime SLA (99.9%)',
        ],
        missing: [],
        cta: 'Talk to Enterprise Sales',
        ctaAnchor: '/advertise/enterprise',
        ctaClass: 'border border-white/20 text-white hover:bg-white/5',
    },
];

const ENDPOINT_CATALOG = [
    { method: 'GET', path: '/v1/operators/search', tier: 'Sandbox+', desc: 'Search verified operators by geo, equipment, or corridor' },
    { method: 'GET', path: '/v1/operators/:id', tier: 'Sandbox+', desc: 'Fetch a single operator profile (limited fields on sandbox)' },
    { method: 'GET', path: '/v1/corridors/:slug', tier: 'Developer+', desc: 'Corridor demand, supply, and rate intelligence' },
    { method: 'GET', path: '/v1/rates/:corridor', tier: 'Developer+', desc: 'Rate benchmarks (p25/p50/p75/p90) for a corridor' },
    { method: 'GET', path: '/v1/coverage/:geo', tier: 'Developer+', desc: 'Coverage confidence score for a geo (county, state, country)' },
    { method: 'GET', path: '/v1/glossary/:slug', tier: 'Sandbox+', desc: 'Heavy haul glossary term definition and synonyms' },
    { method: 'POST', path: '/v1/webhooks/subscribe', tier: 'Developer+', desc: 'Subscribe to corridor and availability event streams' },
    { method: 'GET', path: '/v1/feeds/corridor-liquidity', tier: 'Enterprise', desc: 'Real-time corridor liquidity feed (streaming)' },
];

export default function DevelopersPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <div className="min-h-screen bg-[#0B0B0C] text-white">

                {/* ── Hero ── */}
                <section className="border-b border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-25 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(ellipse at 70% 0%, #3b82f640 0%, transparent 65%)' }} />
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative z-10">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 mb-6">
                                Developer API
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-5 leading-[1.1]">
                                Heavy Haul Intelligence{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                                    via API
                                </span>
                            </h1>
                            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                                Programmatic access to 50,000+ verified operator profiles, corridor demand data,
                                escort rate benchmarks, and coverage confidence scores across 120 countries.
                                Sandbox keys are free — no credit card required.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <a href="#sandbox-form"
                                    className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all">
                                    Get a Free Sandbox Key
                                </a>
                                <Link href="/developers/documentation"
                                    className="inline-flex items-center justify-center px-8 py-4 border border-white/20 text-white font-semibold text-sm rounded-xl hover:bg-white/5 transition-all">
                                    View Documentation →
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Quick stats ── */}
                <section className="border-b border-white/5 bg-[#0f1115]">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            {[
                                { stat: '50K+', label: 'Verified operator profiles' },
                                { stat: '120', label: 'Countries covered' },
                                { stat: '~50ms', label: 'Median API response time' },
                                { stat: '99.9%', label: 'Uptime (Enterprise SLA)' },
                            ].map(({ stat, label }) => (
                                <div key={label}>
                                    <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 mb-1">{stat}</div>
                                    <div className="text-xs sm:text-sm text-gray-400">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Pricing tiers ── */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">API Pricing</h2>
                    <p className="text-gray-400 text-sm text-center mb-10">Start free. Upgrade when you need more.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {API_TIERS.map(tier => (
                            <div key={tier.name}
                                className={`rounded-2xl border p-7 flex flex-col gap-5 ${tier.highlight
                                    ? 'border-blue-500/40 bg-gradient-to-br from-blue-500/5 to-transparent'
                                    : 'border-white/10 bg-[#121214]'
                                    }`}>

                                <div>
                                    {tier.highlight && (
                                        <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Most popular</div>
                                    )}
                                    <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                                    <div className="flex items-baseline gap-1.5 mb-1">
                                        <span className="text-3xl font-extrabold text-white">{tier.price}</span>
                                        {tier.note && <span className="text-xs text-gray-500">{tier.note}</span>}
                                    </div>
                                    <div className="text-xs text-gray-500">{tier.rateLimit}</div>
                                </div>

                                <ul className="space-y-2 flex-1">
                                    {tier.features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                                            <span className="text-blue-400 mt-0.5 flex-shrink-0">✓</span>
                                            {f}
                                        </li>
                                    ))}
                                    {tier.missing.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                                            <span className="mt-0.5 flex-shrink-0">✗</span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {tier.ctaAnchor.startsWith('/') ? (
                                    <Link href={tier.ctaAnchor}
                                        className={`text-center py-3 rounded-xl text-sm font-semibold transition-all ${tier.ctaClass}`}>
                                        {tier.cta}
                                    </Link>
                                ) : (
                                    <a href={tier.ctaAnchor}
                                        className={`text-center py-3 rounded-xl text-sm font-semibold transition-all ${tier.ctaClass}`}>
                                        {tier.cta}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Endpoint catalog ── */}
                <section className="border-t border-white/5 bg-[#0f1115]">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                        <h2 className="text-xl font-bold text-white mb-2">Available Endpoints</h2>
                        <p className="text-sm text-gray-400 mb-8">Full reference at <Link href="/developers/documentation" className="text-blue-400 hover:text-blue-300 underline transition-colors">/developers/documentation</Link></p>

                        <div className="space-y-2">
                            {ENDPOINT_CATALOG.map(ep => (
                                <div key={ep.path}
                                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-[#121214] border border-white/5 rounded-xl px-5 py-3 hover:border-white/10 transition-all">
                                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded w-fit ${ep.method === 'GET' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                        {ep.method}
                                    </span>
                                    <span className="font-mono text-sm text-gray-200 flex-1">{ep.path}</span>
                                    <span className="text-xs text-gray-500 hidden sm:block">{ep.desc}</span>
                                    <span className={`text-xs font-semibold shrink-0 ${ep.tier === 'Sandbox+' ? 'text-gray-400' : ep.tier === 'Developer+' ? 'text-blue-400' : 'text-purple-400'}`}>
                                        {ep.tier}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Sandbox signup form ── */}
                <section id="sandbox-form" className="max-w-xl mx-auto px-4 sm:px-6 py-16">
                    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent p-8">
                        <h2 className="text-2xl font-bold text-white mb-2 text-center">Get Your Free Sandbox Key</h2>
                        <p className="text-sm text-gray-400 text-center mb-6">
                            100 calls/day. Operators + glossary endpoints. No credit card. API key delivered to your email within 5 minutes.
                        </p>
                        <SandboxSignupForm />
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="border-t border-white/5 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                    <h2 className="text-xl font-bold text-white text-center mb-8">API FAQ</h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: 'What data does the Haul Command API provide?',
                                a: 'Verified pilot car operator profiles, corridor demand and supply intelligence, escort rate benchmarks, coverage confidence scores, and glossary term definitions. Enterprise tiers add real-time feeds and webhook delivery.',
                            },
                            {
                                q: 'Is there a free API tier?',
                                a: 'Yes. The sandbox tier is permanently free with 100 API calls per day, operator search endpoint access (limited fields), and no credit card required.',
                            },
                            {
                                q: 'What are the rate limits?',
                                a: 'Sandbox: 100 calls/day. Developer ($99/mo): 10,000 calls/day. Enterprise (custom): unlimited, governed by SLA.',
                            },
                            {
                                q: 'Do you have SDKs or client libraries?',
                                a: 'TypeScript and Python SDKs are in development. REST + JSON is available now. Postman collection available in the documentation.',
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
                        <Link href="/developers/documentation" className="hover:text-white transition-colors">Documentation</Link>
                        <span>·</span>
                        <Link href="/data" className="hover:text-white transition-colors">Data Marketplace</Link>
                        <span>·</span>
                        <Link href="/pricing" className="hover:text-white transition-colors">All Pricing</Link>
                        <span>·</span>
                        <Link href="/advertise" className="hover:text-white transition-colors">Advertise</Link>
                        <span>·</span>
                        <Link href="/claim" className="hover:text-white transition-colors">Claim Your Profile</Link>
                    </div>
                </div>
            </div>
        </>
    );
}
