'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState } from 'react';

/* ══════════════════════════════════════════════════════
   HAUL COMMAND — PRICING PAGE
   Aligned to live Stripe products:
     Basic  → $29/mo | $278/yr
     Pro    → $79/mo | $758/yr
     Elite  → $199/mo | $1,908/yr
     Broker → $149/mo | $1,430/yr
     Add-ons: Load Boost $14, Corridor Sponsor $199/mo
   ══════════════════════════════════════════════════════ */

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Get discovered by brokers',
    monthlyPrice: 29,
    annualPrice: 278,
    highlighted: false,
    features: [
      'Verified badge on your profile',
      'Appear in broker search results',
      '5 AI queries per day',
      'Standard directory listing',
      'Lead credits included',
      'Direct contact visibility',
    ],
    cta: 'Start Basic',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Stand out and win more loads',
    monthlyPrice: 79,
    annualPrice: 758,
    highlighted: true,
    badge: 'Most Popular',
    features: [
      'Everything in Basic, plus:',
      '50 AI queries per day',
      'Priority placement in search',
      'Proximity boost to nearby loads',
      '50 lead credits per month',
      'Fast Responder badge eligibility',
    ],
    cta: 'Go Pro',
  },
  {
    id: 'elite',
    name: 'Corridor Elite',
    tagline: 'Dominate your corridors',
    monthlyPrice: 199,
    annualPrice: 1908,
    highlighted: false,
    features: [
      'Everything in Pro, plus:',
      '200 AI queries per day',
      'Priority dispatch access',
      'GPS 15-second ping rate',
      'Corridor takeover badges',
      '500 lead credits per month',
    ],
    cta: 'Go Elite',
  },
];

const BROKER_PLAN = {
  id: 'broker',
  name: 'Broker Seat',
  tagline: 'Post loads, find coverage, move freight',
  monthlyPrice: 149,
  annualPrice: 1430,
  features: [
    'Post unlimited loads',
    '10 boost credits per month',
    'Smart Match AI access',
    'Priority dispatch queue',
    'Sponsored directory slot',
    'Dedicated account support',
  ],
  cta: 'Get Broker Access',
};

const ADDONS = [
  {
    name: 'Load Boost',
    price: '$14',
    period: 'per boost',
    description: 'Push to top of feed for 24 hours',
    href: '/api/stripe/boost',
    icon: '🚀',
  },
  {
    name: 'Corridor Sponsor',
    price: '$199',
    period: '/month',
    description: 'Premium placement on corridor pages',
    icon: '⭐',
  },
  {
    name: 'Directory Featured',
    price: '$99',
    period: '/month',
    description: 'Top placement in your state directory',
    icon: '📍',
  },
];

const COMPARISON_FEATURES = [
  { feature: 'Directory Listing', free: true, basic: true, pro: true, elite: true, broker: true },
  { feature: 'Contact Info Visible', free: true, basic: true, pro: true, elite: true, broker: true },
  { feature: 'Verified Badge', free: false, basic: true, pro: true, elite: true, broker: true },
  { feature: 'Broker Search Results', free: false, basic: true, pro: true, elite: true, broker: true },
  { feature: 'AI Queries/Day', free: '0', basic: '5', pro: '50', elite: '200', broker: '50' },
  { feature: 'Lead Credits/Month', free: '0', basic: '10', pro: '50', elite: '500', broker: 'Unlimited' },
  { feature: 'Priority Placement', free: false, basic: false, pro: true, elite: true, broker: true },
  { feature: 'Proximity Boost', free: false, basic: false, pro: true, elite: true, broker: false },
  { feature: 'Priority Dispatch', free: false, basic: false, pro: false, elite: true, broker: true },
  { feature: 'Corridor Takeover', free: false, basic: false, pro: false, elite: true, broker: false },
  { feature: 'GPS 15s Ping Rate', free: false, basic: false, pro: false, elite: true, broker: false },
  { feature: 'Post Loads', free: false, basic: false, pro: false, elite: false, broker: true },
  { feature: 'Smart Match AI', free: false, basic: false, pro: false, elite: false, broker: true },
  { feature: 'Boost Credits/Month', free: '0', basic: '0', pro: '2', elite: '5', broker: '10' },
  { feature: 'Priority Support', free: false, basic: false, pro: true, elite: true, broker: true },
];

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. All plans are cancel-anytime with no long-term contracts. Annual plans are non-refundable but you keep access for the full year.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards, debit cards, and ACH bank transfers through our secure Stripe payment platform.',
  },
  {
    q: 'Is there a free trial?',
    a: 'You can claim and verify your listing for free with no credit card required. Premium features are available immediately upon subscribing.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Absolutely. Upgrade or downgrade at any time. When upgrading, you\'ll be prorated for the remainder of your billing cycle.',
  },
  {
    q: 'Do you offer fleet pricing?',
    a: 'Yes. For fleets of 5+ operators, contact us for custom enterprise pricing with volume discounts and dedicated account management.',
  },
  {
    q: 'What\'s the difference between Pro and Elite?',
    a: 'Elite gives you 4x the AI queries, priority dispatch access, 15-second GPS updates, corridor takeover badges, and 10x the lead credits. It\'s for operators who want to dominate their routes.',
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function getPrice(plan: { monthlyPrice: number; annualPrice: number }) {
    if (isAnnual) {
      const monthly = Math.round(plan.annualPrice / 12);
      return { display: `$${monthly}`, period: '/mo', billed: `$${plan.annualPrice.toLocaleString()} billed annually` };
    }
    return { display: `$${plan.monthlyPrice}`, period: '/mo', billed: 'Billed monthly' };
  }

  function getCheckoutUrl(planId: string) {
    const interval = isAnnual ? 'year' : 'month';
    return `/api/stripe/checkout?plan=${planId}&interval=${interval}`;
  }

  function renderCheck(val: boolean | string) {
    if (typeof val === 'string') return <span className="text-white font-semibold text-xs">{val}</span>;
    return val ? <span className="text-green-400">✓</span> : <span className="text-gray-700">—</span>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow overflow-x-hidden">
        {/* Social Proof */}
        <div className="w-full border-b border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              7,335 operators tracked
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:flex items-center gap-1.5">
              🛡️ Escrow protected
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:flex items-center gap-1.5">
              🌍 57 countries
            </span>
          </div>
        </div>

        {/* Hero */}
        <section className="py-12 sm:py-20 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
              Invest in Your <span className="text-accent">Visibility</span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-8">
              Brokers are searching for operators in your corridors right now.
              Get found, get verified, get paid.
            </p>

            {/* Annual/Monthly Toggle */}
            <div className="inline-flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-full px-2 py-1.5">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  !isAnnual
                    ? 'bg-accent text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  isAnnual
                    ? 'bg-accent text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Annual
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isAnnual ? 'bg-black/20 text-black' : 'bg-green-500/20 text-green-400'
                }`}>
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Cards — Operators */}
        <section className="px-4 pb-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const price = getPrice(plan);
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-[1px] transition-all ${
                    plan.highlighted
                      ? 'bg-gradient-to-b from-accent/60 via-accent/20 to-accent/5 shadow-[0_0_40px_rgba(245,159,10,0.15)]'
                      : 'bg-white/[0.06]'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-accent text-black text-xs font-black px-4 py-1 rounded-full shadow-lg">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="rounded-2xl p-6 sm:p-8 h-full flex flex-col bg-[#0a0a0a]">
                    <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                    <p className="text-gray-500 text-xs mb-6">{plan.tagline}</p>

                    <div className="mb-6">
                      <span className="text-4xl font-black text-white">{price.display}</span>
                      <span className="text-gray-500 text-sm ml-1">{price.period}</span>
                      <p className="text-gray-600 text-[10px] mt-1">{price.billed}</p>
                      {isAnnual && (
                        <p className="text-green-400 text-xs mt-1">
                          Save ${plan.monthlyPrice * 12 - plan.annualPrice}/yr
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <span className={`mt-0.5 text-xs ${
                            f.startsWith('Everything') ? 'text-accent' : 'text-green-400'
                          }`}>
                            {f.startsWith('Everything') ? '⭐' : '✓'}
                          </span>
                          <span className={`${
                            f.startsWith('Everything') ? 'text-accent font-semibold' : 'text-gray-300'
                          }`}>
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={getCheckoutUrl(plan.id)}
                      className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${
                        plan.highlighted
                          ? 'bg-accent text-black hover:bg-yellow-500 shadow-lg shadow-accent/20'
                          : 'bg-white/[0.06] text-white border border-white/[0.1] hover:border-accent/30 hover:bg-accent/[0.05]'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Broker Plan */}
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-4">
                    <span className="text-blue-400 text-xs font-bold">FOR BROKERS</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">{BROKER_PLAN.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{BROKER_PLAN.tagline}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-black text-white">
                      ${isAnnual ? Math.round(BROKER_PLAN.annualPrice / 12) : BROKER_PLAN.monthlyPrice}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">/mo</span>
                    {isAnnual && (
                      <span className="text-green-400 text-xs ml-2">
                        Save ${BROKER_PLAN.monthlyPrice * 12 - BROKER_PLAN.annualPrice}/yr
                      </span>
                    )}
                  </div>
                  <Link
                    href={getCheckoutUrl('broker')}
                    className="inline-block bg-blue-500 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-400 transition-colors"
                  >
                    {BROKER_PLAN.cta}
                  </Link>
                </div>
                <ul className="space-y-3">
                  {BROKER_PLAN.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="text-blue-400 mt-0.5 text-xs">✓</span>
                      <span className="text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Add-ons */}
        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter text-center mb-8">
              Power <span className="text-accent">Add-ons</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {ADDONS.map((addon, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 transition-all">
                  <span className="text-2xl mb-3 block">{addon.icon}</span>
                  <h3 className="text-white font-bold text-sm mb-1">{addon.name}</h3>
                  <p className="text-gray-500 text-xs mb-3">{addon.description}</p>
                  <p className="text-accent font-black text-lg">
                    {addon.price}<span className="text-gray-500 text-xs font-normal ml-1">{addon.period}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter text-center mb-8">
              Compare <span className="text-accent">Plans</span>
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left text-gray-400 font-medium py-4 px-4 sm:px-6">Feature</th>
                    <th className="text-center text-gray-400 font-medium py-4 px-3 w-16">Free</th>
                    <th className="text-center text-gray-400 font-medium py-4 px-3 w-16">Basic</th>
                    <th className="text-center text-accent font-bold py-4 px-3 w-16 bg-accent/[0.03]">Pro</th>
                    <th className="text-center text-gray-400 font-medium py-4 px-3 w-16">Elite</th>
                    <th className="text-center text-blue-400 font-medium py-4 px-3 w-16">Broker</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_FEATURES.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 text-gray-300">{row.feature}</td>
                      <td className="py-3.5 px-3 text-center">{renderCheck(row.free)}</td>
                      <td className="py-3.5 px-3 text-center">{renderCheck(row.basic)}</td>
                      <td className="py-3.5 px-3 text-center bg-accent/[0.03]">{typeof row.pro === 'string' ? <span className="text-accent font-bold text-xs">{row.pro}</span> : row.pro ? <span className="text-accent font-bold">✓</span> : <span className="text-gray-700">—</span>}</td>
                      <td className="py-3.5 px-3 text-center">{renderCheck(row.elite)}</td>
                      <td className="py-3.5 px-3 text-center">{renderCheck(row.broker)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 pb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter text-center mb-8">
              Frequently Asked <span className="text-accent">Questions</span>
            </h2>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="text-white font-semibold text-sm pr-4">{faq.q}</span>
                    <span className={`text-accent text-lg transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed border-t border-white/[0.04] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-4 pb-16">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter mb-3">
              Ready to Get Found?
            </h2>
            <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
              Join thousands of operators who&apos;ve claimed their profiles.
              Start free, upgrade when you&apos;re ready.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/claim"
                className="bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors"
              >
                Claim Your Free Listing
              </Link>
              <Link
                href="/directory"
                className="text-gray-400 hover:text-white px-6 py-3 text-sm font-medium transition-colors"
              >
                Browse Directory →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
