import type { Metadata } from 'next';
import Link from 'next/link';
import { ESCORT_SUBSCRIPTION_TIERS, BROKER_SUBSCRIPTION_TIERS } from '@/lib/monetization/monetization-engine';

export const metadata: Metadata = {
    title: 'Haul Command Pricing | Pilot Car Operator & Carrier Plans',
    description: 'Transparent pricing for all Haul Command plans. Free forever for basic listings. Pro starts at $29/month for operators and $99/month for brokers. Enterprise and sponsor plans available.',
    alternates: {
        canonical: 'https://www.haulcommand.com/pricing',
    },
};

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'How much does Haul Command cost?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Haul Command is free to claim your profile and appear in search. Operator Pro plans start at $29/month. Broker Business plans start at $99/month. Enterprise plans start at $499/month. All plans include a 14-day free trial.',
            },
        },
        {
            '@type': 'Question',
            name: 'Is there a free pilot car operator plan?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Free pilot car operator accounts include a basic directory listing, standard profile, 1 operating region, and up to 5 lead alerts per month. The free plan is permanent — no credit card required to claim your profile.',
            },
        },
        {
            '@type': 'Question',
            name: 'What is included in the Haul Command Elite plan?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Elite ($79/month) includes a verified and certified badge, top listing placement, unlimited operating regions, priority lead matching, advanced analytics, route intelligence, competitor insights, API read access, and dedicated support.',
            },
        },
    ],
};


const SPONSOR_HIGHLIGHTS = [
    { name: 'Territory Sponsor', price: '$299/mo', note: 'Exclusive per state', href: '/advertise/territory' },
    { name: 'Corridor Sponsor', price: '$199/mo', note: 'Exclusive per corridor', href: '/advertise/corridor' },
    { name: 'Port Sponsor', price: '$499/mo', note: 'Exclusive per port', href: '/advertise/enterprise' },
    { name: 'Self-Serve CPC', price: '$0.75+/click', note: 'No minimum budget', href: '/advertise/buy' },
];

export default function PricingPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <div className="min-h-screen bg-[#0B0B0C] text-white">

                {/* ── Hero ── */}
                <section className="border-b border-white/5 text-center py-20 sm:py-24 px-4">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-hc-gold-400 mb-6">
                        Transparent Pricing
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Simple Pricing for Heavy Haul
                    </h1>
                    <p className="text-lg text-gray-400 max-w-xl mx-auto mb-2">
                        Free to start. Upgrade when you are ready to grow. No hidden fees.
                    </p>
                    <p className="text-sm text-gray-500">All paid plans include a 14-day free trial.</p>
                </section>

                {/* ── Operator Plans ── */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h2 className="text-xl font-bold text-white mb-1">Pilot Car Operators & Escort Services</h2>
                    <p className="text-sm text-gray-400 mb-8">Get verified, get found, get dispatched.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {ESCORT_SUBSCRIPTION_TIERS.map((tier, i) => (
                            <div key={tier.name}
                                className={`rounded-2xl border p-8 flex flex-col gap-5 ${i === 1
                                    ? 'border-hc-gold-500/50 bg-gradient-to-br from-hc-gold-500/5 to-transparent ring-1 ring-hc-gold-500/20'
                                    : 'border-white/10 bg-[#121214]'
                                    }`}>
                                {i === 1 && (
                                    <div className="absolute -mt-12">
                                        <span className="bg-hc-gold-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                            Most Popular
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-white text-lg mb-1">{tier.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-3">
                                        <span className="text-3xl font-extrabold text-white">
                                            {tier.price === 0 ? 'Free' : `$${tier.price}`}
                                        </span>
                                        {tier.price > 0 && <span className="text-gray-500 text-sm">/month</span>}
                                    </div>
                                </div>
                                <ul className="space-y-2 flex-1">
                                    {tier.features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                                            <span className="text-hc-gold-400 mt-0.5 flex-shrink-0">✓</span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                {tier.limits && (
                                    <div className="border-t border-white/5 pt-4 space-y-1">
                                        {Object.entries(tier.limits).map(([key, val]) => (
                                            <div key={key} className="flex justify-between text-xs text-gray-500">
                                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                <span className={val === -1 ? 'text-hc-gold-400 font-bold' : 'text-gray-400'}>
                                                    {val === -1 ? 'Unlimited' : val}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Link href={tier.price === 0 ? '/claim' : '/onboarding'}
                                    className={`inline-flex items-center justify-center w-full py-3 rounded-xl font-semibold text-sm transition-all ${i === 1
                                        ? 'bg-hc-gold-500 text-black hover:bg-hc-gold-400'
                                        : 'border border-white/20 text-white hover:bg-white/5'
                                        }`}>
                                    {tier.price === 0 ? 'Claim Your Profile — Free' : `Start ${tier.name} Trial`}
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Broker/Carrier Plans ── */}
                <section className="border-t border-white/5 bg-[#0f1115]">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <h2 className="text-xl font-bold text-white mb-1">Brokers, Carriers & Dispatchers</h2>
                        <p className="text-sm text-gray-400 mb-8">Find coverage, manage routes, access corridor intelligence.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {BROKER_SUBSCRIPTION_TIERS.map((tier, i) => (
                                <div key={tier.name}
                                    className={`rounded-2xl border p-8 flex flex-col gap-5 ${i === 1
                                        ? 'border-blue-500/50 bg-gradient-to-br from-blue-500/5 to-transparent'
                                        : 'border-white/10 bg-[#121214]'
                                        }`}>
                                    <div>
                                        <h3 className="font-bold text-white text-lg mb-1">{tier.name}</h3>
                                        <div className="flex items-baseline gap-1 mb-3">
                                            <span className="text-3xl font-extrabold text-white">
                                                {tier.price === 0 ? 'Free' : `$${tier.price}`}
                                            </span>
                                            {tier.price > 0 && <span className="text-gray-500 text-sm">/month</span>}
                                        </div>
                                    </div>
                                    <ul className="space-y-2 flex-1">
                                        {tier.features.map(f => (
                                            <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                                                <span className="text-blue-400 mt-0.5 flex-shrink-0">✓</span>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    {tier.limits && (
                                        <div className="border-t border-white/5 pt-4 space-y-1">
                                            {Object.entries(tier.limits).map(([key, val]) => (
                                                <div key={key} className="flex justify-between text-xs text-gray-500">
                                                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                    <span className={val === -1 ? 'text-blue-400 font-bold' : 'text-gray-400'}>
                                                        {val === -1 ? 'Unlimited' : val}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Link href={tier.price === 0 ? '/directory' : '/onboarding?type=broker'}
                                        className={`inline-flex items-center justify-center w-full py-3 rounded-xl font-semibold text-sm transition-all ${i === 1
                                            ? 'bg-blue-600 text-white hover:bg-blue-500'
                                            : 'border border-white/20 text-white hover:bg-white/5'
                                            }`}>
                                        {tier.price === 0 ? 'Search Free' : `Start ${tier.name} Trial`}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Sponsor / Advertiser Highlight ── */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h2 className="text-xl font-bold text-white mb-1">Sponsor & Advertiser Plans</h2>
                    <p className="text-sm text-gray-400 mb-8">For training providers, insurers, equipment suppliers, and businesses reaching the heavy haul industry.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {SPONSOR_HIGHLIGHTS.map(({ name, price, note, href }) => (
                            <Link key={name} href={href}
                                className="border border-white/10 rounded-xl p-5 bg-[#121214] hover:border-white/20 transition-all group">
                                <div className="text-lg font-bold text-white mb-1 group-hover:text-hc-gold-400 transition-colors">{price}</div>
                                <div className="text-sm font-semibold text-gray-300 mb-0.5">{name}</div>
                                <div className="text-xs text-gray-500">{note}</div>
                            </Link>
                        ))}
                    </div>
                    <div className="mt-4">
                        <Link href="/advertise" className="text-sm text-hc-gold-400 hover:text-hc-gold-300 transition-colors">
                            View all advertising options →
                        </Link>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="border-t border-white/5 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">Pricing FAQ</h2>
                    <div className="space-y-5">
                        {[
                            {
                                q: 'How much does Haul Command cost?',
                                a: 'Haul Command is free to claim your profile and appear in search. Operator Pro plans start at $29/month. Broker Business plans start at $99/month. Enterprise plans start at $499/month. All paid plans include a 14-day free trial.',
                            },
                            {
                                q: 'Is there a free pilot car operator plan?',
                                a: 'Yes. Free accounts include a basic directory listing, standard profile, 1 operating region, and up to 5 lead alerts per month. Permanently free — no credit card required.',
                            },
                            {
                                q: 'What is included in the Elite plan?',
                                a: 'Elite ($79/month) includes verified + certified badge, top listing placement, unlimited operating regions, priority lead matching, advanced analytics, route intelligence, API read access, and dedicated support.',
                            },
                            {
                                q: 'Can I cancel anytime?',
                                a: 'Yes. Cancel anytime from your dashboard. Your subscription remains active until the end of your billing period. No cancellation fees.',
                            },
                            {
                                q: 'Do you offer annual pricing?',
                                a: 'Annual plans include 2 months free (equivalent to 17% off). Contact billing@haulcommand.com or manage in your dashboard after subscribing.',
                            },
                        ].map(({ q, a }) => (
                            <div key={q} className="border border-white/10 rounded-xl p-5">
                                <h3 className="font-semibold text-white mb-1.5 text-sm">{q}</h3>
                                <p className="text-xs text-gray-400 leading-relaxed">{a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Bottom CTA ── */}
                <section className="border-t border-white/5 text-center py-16 px-4">
                    <h2 className="text-2xl font-bold text-white mb-3">Start free. Upgrade when you win.</h2>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm">Claim your profile now at no cost. Upgrade to Pro when you start receiving leads and want to accelerate.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/claim"
                            className="inline-flex items-center justify-center px-8 py-4 bg-hc-gold-500 text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-hc-gold-400 transition-all">
                            Claim Your Free Profile
                        </Link>
                        <Link href="/advertise"
                            className="inline-flex items-center justify-center px-8 py-4 border border-white/20 text-white font-semibold text-sm rounded-xl hover:bg-white/5 transition-all">
                            Advertise on Haul Command
                        </Link>
                    </div>
                </section>

            </div>
        </>
    );
}
