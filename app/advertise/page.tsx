import type { Metadata } from 'next';
import Link from 'next/link';
import SelfServeAdBuyer from '@/components/ads/SelfServeAdBuyer';
import AdGridPartnerSignup from '@/components/ads/AdGridPartnerSignup';
export const metadata: Metadata = {
    title: 'Advertise on Haul Command | Reach Heavy Haul Operators & Carriers',
    description: 'Reach 50,000+ verified pilot car operators, heavy haul carriers, and brokers. Territory sponsorships, corridor placements, self-serve campaigns, and enterprise packages. Start free.',
    alternates: {
        canonical: 'https://www.haulcommand.com/advertise',
    },
    openGraph: {
        title: 'Advertise on Haul Command',
        description: 'The most targeted advertising platform for the heavy haul and oversize transport industry.',
        url: 'https://www.haulcommand.com/advertise',
    },
};

// JSON-LD schema for rich snippet capture
const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Advertise on Haul Command',
    description: 'Heavy haul industry advertising — territory sponsorships, corridor placements, self-serve CPC campaigns.',
    url: 'https://www.haulcommand.com/advertise',
    mainEntity: {
        '@type': 'Service',
        name: 'Haul Command Advertising',
        serviceType: 'Digital Advertising',
        provider: {
            '@type': 'Organization',
            name: 'Haul Command',
            url: 'https://www.haulcommand.com',
        },
        offers: [
            { '@type': 'Offer', name: 'Territory Sponsor', price: '299', priceCurrency: 'USD', description: 'Exclusive territory ownership across all state pages and near-me results.' },
            { '@type': 'Offer', name: 'Corridor Sponsor', price: '199', priceCurrency: 'USD', description: 'Exclusive placement on a named heavy haul corridor page (I-35, I-10, etc.).' },
            { '@type': 'Offer', name: 'Self-Serve CPC Campaign', price: '0.75', priceCurrency: 'USD', description: 'Pay-per-click campaigns starting at $0.75/click. Geo-targeted to state or corridor.' },
        ],
    },
};

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'Who sees ads on Haul Command?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Your ads reach verified pilot car operators, heavy haul carriers, brokers, and dispatchers searching for escort services, equipment, training, and other logistics services. The audience is entirely industry-specific — no general consumer traffic.',
            },
        },
        {
            '@type': 'Question',
            name: 'What is a Territory Sponsor on Haul Command?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'A Territory Sponsor holds the exclusive advertising position for an entire US state or country. Your business appears first on all directory pages, near-me search results, and corridor search results within that territory. Only one Territory Sponsor per state.',
            },
        },
        {
            '@type': 'Question',
            name: 'How are Haul Command ads different from Google Ads?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Haul Command ads reach people actively searching for heavy haul logistics services — not general internet audiences. Every user is industry-verified. Conversion rates for relevant businesses (operators, training providers, insurers, equipment suppliers) are significantly higher than generic platforms.',
            },
        },
    ],
};

const AD_PRODUCTS = [
    {
        id: 'territory',
        icon: '🗺️',
        tag: 'Most Popular',
        tagColor: 'bg-hc-gold-500 text-black',
        name: 'Territory Sponsor',
        price: '$299/mo',
        note: 'Per state',
        description: 'Own an entire state. Your business appears first across every directory page, near-me search, and corridor result in your territory.',
        features: [
            'Exclusive — only one sponsor per state',
            'Top placement in all state directory results',
            'Sponsor badge on all state near-me pages',
            'Monthly impressions and lead report',
        ],
        cta: 'Claim Your Territory',
        href: '/advertise/territory',
        highlight: true,
    },
    {
        id: 'corridor',
        icon: '🛣️',
        tag: 'High Intent',
        tagColor: 'bg-blue-500 text-white',
        name: 'Corridor Sponsor',
        price: '$199/mo',
        note: 'Per corridor',
        description: 'Become the exclusive sponsor of a named corridor — I-35, I-10, Texas Triangle, and more. Reach operators and carriers actively planning moves on your route.',
        features: [
            'Exclusive — one sponsor per corridor',
            'Hero placement on corridor intelligence page',
            'Featured in corridor-related blog content',
            'Corridor alert emails stamped with your name',
        ],
        cta: 'Choose a Corridor',
        href: '/advertise/corridor',
        highlight: false,
    },
    {
        id: 'cpc',
        icon: '⚡',
        tag: 'Self-Serve',
        tagColor: 'bg-green-500 text-white',
        name: 'Targeted CPC Campaign',
        price: '$0.75+/click',
        note: 'You control the budget',
        description: 'Launch a geo-targeted pay-per-click campaign in minutes. Set your state, corridor, or city target. Pay only when operators click.',
        features: [
            'Start in under 5 minutes',
            'No minimum spend',
            'Geo-target by state, corridor, or city',
            'Real-time performance dashboard',
        ],
        cta: 'Launch a Campaign',
        href: '/advertise/buy',
        highlight: false,
    },
    {
        id: 'enterprise',
        icon: '🏢',
        tag: 'Enterprise',
        tagColor: 'bg-purple-600 text-white',
        name: 'Enterprise & Custom',
        price: 'Custom',
        note: 'Port, training, data portal placements',
        description: 'Port sponsorships ($499/mo), training page placements ($249/mo), data portal sponsorships ($999/mo), and custom multi-territory packages for large accounts.',
        features: [
            'Port sponsor placements (TWIC operator traffic)',
            'Training page exclusive sponsorships',
            'Push campaign delivery ($0.05/send)',
            'Insurance and equipment referral programs',
        ],
        cta: 'Talk to Sales',
        href: '/advertise/enterprise',
        highlight: false,
    },
];

const AUDIENCE_STATS = [
    { stat: '50,000+', label: 'Verified heavy haul professionals' },
    { stat: '120', label: 'Countries in the Haul Command network' },
    { stat: '85%', label: 'Of users are decision-makers or buyers' },
    { stat: '$4,200', label: 'Avg monthly revenue per verified operator' },
];

export default function AdvertisePage() {
    return (
        <>
            {/* Schemas */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <div className="min-h-screen bg-[#0B0B0C] text-white">

                {/* ── Hero ── */}
                <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-br from-[#0B0B0C] via-[#11141a] to-[#0B0B0C]">
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(ellipse at 60% 0%, #D4A72480 0%, transparent 70%)' }} />
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-hc-gold-400 mb-6">
                            Haul Command Advertising
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
                            Reach the People Moving{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-hc-gold-400 to-amber-300">
                                Heavy Haul
                            </span>
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
                            50,000+ verified pilot car operators, carriers, and brokers in 120 countries.
                            Not general consumers — industry professionals with real purchasing decisions.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link href="/advertise/buy"
                                className="inline-flex items-center justify-center px-8 py-4 bg-hc-gold-500 text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-hc-gold-400 transition-all hover:shadow-[0_0_30px_rgba(212,167,36,0.3)]">
                                Launch a Campaign
                            </Link>
                            <Link href="/advertise/territory"
                                className="inline-flex items-center justify-center px-8 py-4 bg-white/5 border border-white/20 text-white font-semibold text-sm rounded-xl hover:bg-white/10 transition-all">
                                View Territory Availability
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── Audience Stats ── */}
                <section className="border-b border-white/5 bg-[#0f1115]">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            {AUDIENCE_STATS.map(({ stat, label }) => (
                                <div key={label}>
                                    <div className="text-3xl font-extrabold text-hc-gold-400 mb-1">{stat}</div>
                                    <div className="text-sm text-gray-400">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Product Cards ── */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-3">Choose Your Advertising Format</h2>
                        <p className="text-gray-400 max-w-xl mx-auto">From self-serve CPC campaigns to exclusive territory ownership. Every product is built for heavy haul, not generic traffic.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {AD_PRODUCTS.map(product => (
                            <div key={product.id}
                                className={`relative rounded-2xl border p-8 flex flex-col gap-6 transition-all ${product.highlight
                                        ? 'border-hc-gold-500/50 bg-gradient-to-br from-hc-gold-500/5 to-transparent'
                                        : 'border-white/10 bg-[#121214] hover:border-white/20'
                                    }`}>
                                {product.tag && (
                                    <span className={`absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full ${product.tagColor}`}>
                                        {product.tag}
                                    </span>
                                )}

                                <div>
                                    <div className="text-3xl mb-3">{product.icon}</div>
                                    <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
                                    <div className="flex items-baseline gap-2 mb-3">
                                        <span className="text-2xl font-extrabold text-hc-gold-400">{product.price}</span>
                                        <span className="text-sm text-gray-500">{product.note}</span>
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed">{product.description}</p>
                                </div>

                                <ul className="space-y-2">
                                    {product.features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                                            <span className="text-hc-gold-400 mt-0.5 flex-shrink-0">✓</span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <Link href={product.href}
                                    className={`mt-auto inline-flex items-center justify-center w-full py-3 rounded-xl font-semibold text-sm transition-all ${product.highlight
                                            ? 'bg-hc-gold-500 text-black hover:bg-hc-gold-400'
                                            : 'border border-white/20 text-white hover:bg-white/5'
                                        }`}>
                                    {product.cta} →
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Why Advertise Here ── */}
                <section className="border-t border-white/5 bg-[#0f1115]">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                        <h2 className="text-3xl font-bold text-white text-center mb-12">Why Haul Command Advertising Works</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: '🎯',
                                    title: 'Zero audience waste',
                                    body: 'Every visitor to Haul Command is in the heavy haul industry. No general audience dilution. Your budget reaches people who actually buy what you sell.',
                                },
                                {
                                    icon: '🔒',
                                    title: 'Verified professionals only',
                                    body: 'Operators are verified with insurance and certification checks. Brokers and carriers are authenticated. You are reaching decision-makers, not browsers.',
                                },
                                {
                                    icon: '📍',
                                    title: 'Intent-matched placement',
                                    body: 'Territory and corridor sponsorships are shown when carriers are actively planning a move in your geo. The intent signal is as strong as it gets.',
                                },
                                {
                                    icon: '📊',
                                    title: 'Transparent reporting',
                                    body: 'Real-time dashboards show impressions, clicks, and lead attributions. See exactly what your spend is generating. No black boxes.',
                                },
                                {
                                    icon: '⚡',
                                    title: 'Start in 5 minutes',
                                    body: 'Self-serve campaigns go live immediately. Territory and corridor sponsorships activate the same business day. No lengthy onboarding.',
                                },
                                {
                                    icon: '🌍',
                                    title: '120-country reach',
                                    body: 'Haul Command operates in 120 countries. For training providers, insurers, and equipment suppliers with global footprints, no other platform offers this reach.',
                                },
                            ].map(({ icon, title, body }) => (
                                <div key={title} className="space-y-2">
                                    <div className="text-2xl">{icon}</div>
                                    <h3 className="font-bold text-white">{title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">Advertising FAQ</h2>
                    <div className="space-y-6">
                        {[
                            {
                                q: 'Who sees ads on Haul Command?',
                                a: 'Verified pilot car operators, heavy haul carriers, brokers, and dispatchers searching for escort services, equipment, training, and logistics support. The audience is 100% industry-specific.',
                            },
                            {
                                q: 'What is a Territory Sponsor?',
                                a: 'A Territory Sponsor holds the exclusive advertising position for an entire US state or country. Your business appears first on all directory pages, near-me search results, and corridor search results within that territory. Only one sponsor per state.',
                            },
                            {
                                q: 'How are Haul Command ads different from Google Ads?',
                                a: 'Haul Command ads reach people actively searching for heavy haul logistics services — not general internet audiences. Every user is industry-verified. Conversion rates for relevant businesses are significantly higher than generic platforms.',
                            },
                            {
                                q: 'Can I target by specific corridor or state?',
                                a: 'Yes. Self-serve CPC campaigns support geo-targeting by state, city, or corridor. Territory and corridor sponsorships are inherently geo-exclusive — you own the placement for that geo.',
                            },
                            {
                                q: 'Is there a minimum spend?',
                                a: 'Self-serve CPC campaigns have no minimum spend. Territory and corridor sponsorships are flat monthly fees with no impression minimums. Enterprise and push campaigns have small minimums — contact us for details.',
                            },
                        ].map(({ q, a }) => (
                            <div key={q} className="border border-white/10 rounded-xl p-6">
                                <h3 className="font-bold text-white mb-2">{q}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Quick Self-Serve Buyer ── */}
                <section className="border-t border-white/5">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <h2 className="text-2xl font-bold text-white text-center mb-4">Quick Buy — Launch in 5 Minutes</h2>
                        <p className="text-gray-400 text-center mb-8 text-sm">Upload your banner, pick your geo, and go live. $50/week starting.</p>
                        <SelfServeAdBuyer />
                    </div>
                </section>

                {/* ── Partner Signup Wizard ── */}
                <section className="border-t border-white/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <h2 className="text-2xl font-bold text-white text-center mb-4">Enterprise Partner Application</h2>
                        <p className="text-gray-400 text-center mb-8 text-sm">Apply for territory, corridor, or custom sponsorship packages.</p>
                        <AdGridPartnerSignup />
                    </div>
                </section>

                {/* ── Bottom CTA ── */}
                <section className="border-t border-white/5">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">Ready to reach heavy haul professionals?</h2>
                        <p className="text-gray-400 mb-8">Start with a self-serve campaign today, or talk to our team about a territory or corridor sponsorship package.</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link href="/advertise/buy"
                                className="inline-flex items-center justify-center px-8 py-4 bg-hc-gold-500 text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-hc-gold-400 transition-all">
                                Launch a Campaign — Free
                            </Link>
                            <Link href="/advertise/enterprise"
                                className="inline-flex items-center justify-center px-8 py-4 border border-white/20 text-white font-semibold text-sm rounded-xl hover:bg-white/5 transition-all">
                                Enterprise & Custom Packages
                            </Link>
                        </div>
                        <p className="text-xs text-gray-500 mt-6">
                            Questions? <Link href="mailto:ads@haulcommand.com" className="text-gray-400 underline">ads@haulcommand.com</Link>
                        </p>
                    </div>
                </section>

                {/* ── Cross-links ── */}
                <div className="border-t border-white/5 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 justify-center">
                        <Link href="/directory" className="hover:text-white transition-colors">Browse the Directory</Link>
                        <span>·</span>
                        <Link href="/corridors" className="hover:text-white transition-colors">Corridor Intelligence</Link>
                        <span>·</span>
                        <Link href="/data" className="hover:text-white transition-colors">Data Marketplace</Link>
                        <span>·</span>
                        <Link href="/claim" className="hover:text-white transition-colors">Claim Your Profile</Link>
                        <span>·</span>
                        <Link href="/pricing" className="hover:text-white transition-colors">Subscription Pricing</Link>
                    </div>
                </div>

            </div>
        </>
    );
}
