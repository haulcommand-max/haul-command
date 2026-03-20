'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState } from 'react';

/* ══════════════════════════════════════════════════════
   HAUL COMMAND — PRICING PAGE
   Dark theme, Command Black bg, gold accents
   Three tiers + comparison table + FAQ
   ══════════════════════════════════════════════════════ */

const PLANS = [
  {
    id: 'verified',
    name: 'Verified Operator',
    tagline: 'Establish trust & visibility',
    monthlyPrice: null,
    annualPrice: 149,
    priceLabel: '$149/yr',
    isAnnualOnly: true,
    highlighted: false,
    features: [
      'Verified badge on your profile',
      'Appear in broker search results',
      'Claim your corridor rank',
      'Basic profile analytics',
      'Direct contact visibility',
      'Priority over unclaimed listings',
    ],
    cta: 'Get Verified',
    stripeLink: '/api/stripe/checkout?plan=verified&interval=year',
  },
  {
    id: 'pro',
    name: 'Pro Operator',
    tagline: 'Maximum visibility & leads',
    monthlyPrice: 99,
    annualPrice: 990,
    priceLabel: '$99/mo',
    isAnnualOnly: false,
    highlighted: true,
    badge: 'Most Popular',
    features: [
      'Everything in Verified, plus:',
      'Priority load alerts in your corridors',
      'Escrow-protected payments',
      'Monthly profile boost credits',
      'Corridor analytics dashboard',
      'Fast Responder badge eligibility',
    ],
    cta: 'Go Pro',
    stripeLink: '/api/stripe/checkout?plan=pro',
  },
  {
    id: 'brand_defense',
    name: 'Brand Defense',
    tagline: 'Protect your reputation',
    monthlyPrice: 49,
    annualPrice: 490,
    priceLabel: '$49/mo',
    isAnnualOnly: false,
    highlighted: false,
    features: [
      'Lock your name in the directory',
      'Suppress competitor ads on your profile',
      'Featured placement in your state',
      'Review & rating management',
      'Custom profile branding',
      'Priority support channel',
    ],
    cta: 'Defend Your Brand',
    stripeLink: '/api/stripe/checkout?plan=brand_defense',
  },
];

const COMPARISON_FEATURES = [
  { feature: 'Directory Listing', free: true, verified: true, pro: true, brand: true },
  { feature: 'Contact Information Visible', free: true, verified: true, pro: true, brand: true },
  { feature: 'Verified Badge', free: false, verified: true, pro: true, brand: true },
  { feature: 'Broker Search Visibility', free: false, verified: true, pro: true, brand: true },
  { feature: 'Corridor Rank Claim', free: false, verified: true, pro: true, brand: false },
  { feature: 'Priority Load Alerts', free: false, verified: false, pro: true, brand: false },
  { feature: 'Escrow Payments', free: false, verified: false, pro: true, brand: false },
  { feature: 'Profile Boost Credits', free: false, verified: false, pro: true, brand: false },
  { feature: 'Corridor Analytics', free: false, verified: false, pro: true, brand: false },
  { feature: 'Fast Responder Badge', free: false, verified: false, pro: true, brand: false },
  { feature: 'Name Lock in Directory', free: false, verified: false, pro: false, brand: true },
  { feature: 'Competitor Ad Suppression', free: false, verified: false, pro: false, brand: true },
  { feature: 'Featured Placement', free: false, verified: false, pro: false, brand: true },
  { feature: 'Custom Profile Branding', free: false, verified: false, pro: false, brand: true },
  { feature: 'Priority Support', free: false, verified: false, pro: true, brand: true },
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
    a: 'You can claim and verify your listing for free with no credit card required. Premium features are available immediately upon subscribing to any paid plan.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Absolutely. You can upgrade or downgrade at any time. When upgrading, you\'ll be prorated for the remainder of your billing cycle.',
  },
  {
    q: 'Do you offer team or fleet pricing?',
    a: 'Yes. For fleets of 5+ operators, contact us for custom enterprise pricing with volume discounts and dedicated account management.',
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function getPrice(plan: typeof PLANS[0]) {
    if (plan.isAnnualOnly) return { display: '$149', period: '/yr' };
    if (isAnnual) {
      return { display: `$${plan.annualPrice}`, period: '/yr' };
    }
    return { display: `$${plan.monthlyPrice}`, period: '/mo' };
  }

  function getCheckoutUrl(plan: typeof PLANS[0]) {
    const interval = isAnnual || plan.isAnnualOnly ? 'year' : 'month';
    return `/api/stripe/checkout?plan=${plan.id}&interval=${interval}`;
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
                  2 months free
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="px-4 pb-16">
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
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-accent text-black text-xs font-black px-4 py-1 rounded-full shadow-lg">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className={`rounded-2xl p-6 sm:p-8 h-full flex flex-col ${
                    plan.highlighted ? 'bg-[#0a0a0a]' : 'bg-[#0a0a0a]'
                  }`}>
                    <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                    <p className="text-gray-500 text-xs mb-6">{plan.tagline}</p>

                    <div className="mb-6">
                      <span className="text-4xl font-black text-white">{price.display}</span>
                      <span className="text-gray-500 text-sm ml-1">{price.period}</span>
                      {isAnnual && !plan.isAnnualOnly && plan.monthlyPrice && (
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
                      href={getCheckoutUrl(plan)}
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

        {/* Comparison Table */}
        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter text-center mb-8">
              Compare <span className="text-accent">Plans</span>
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left text-gray-400 font-medium py-4 px-4 sm:px-6">Feature</th>
                    <th className="text-center text-gray-400 font-medium py-4 px-3 w-20">Free</th>
                    <th className="text-center text-accent font-bold py-4 px-3 w-20">Verified</th>
                    <th className="text-center text-accent font-bold py-4 px-3 w-20 bg-accent/[0.03]">Pro</th>
                    <th className="text-center text-gray-400 font-medium py-4 px-3 w-20">Brand</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_FEATURES.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 text-gray-300">{row.feature}</td>
                      <td className="py-3.5 px-3 text-center">{row.free ? <span className="text-green-400">✓</span> : <span className="text-gray-700">—</span>}</td>
                      <td className="py-3.5 px-3 text-center">{row.verified ? <span className="text-green-400">✓</span> : <span className="text-gray-700">—</span>}</td>
                      <td className="py-3.5 px-3 text-center bg-accent/[0.03]">{row.pro ? <span className="text-accent font-bold">✓</span> : <span className="text-gray-700">—</span>}</td>
                      <td className="py-3.5 px-3 text-center">{row.brand ? <span className="text-green-400">✓</span> : <span className="text-gray-700">—</span>}</td>
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
