'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/* ══════════════════════════════════════════════════════
   ONBOARDING — Plan Selection Step
   After claim → territory, user selects a plan.
   "Start Free" skips Stripe. "Go Pro" redirects to checkout.
   ══════════════════════════════════════════════════════ */

const PLANS = [
  {
    id: 'free',
    name: 'Free Profile',
    price: '$0',
    period: 'forever',
    desc: 'Get listed with basic visibility',
    features: ['Directory listing', 'Contact info visible', 'Claim your profile'],
    cta: 'Start Free',
    highlighted: false,
    href: '/onboarding/success?plan=free',
  },
  {
    id: 'pro',
    name: 'Pro Operator',
    price: '$99',
    period: '/mo',
    annualNote: 'or $990/yr (2 months free)',
    desc: 'Maximum visibility & priority leads',
    features: [
      'Verified badge',
      'Priority load alerts',
      'Escrow payments',
      'Profile boost credits',
      'Corridor analytics',
      'Fast Responder badge',
    ],
    cta: 'Go Pro',
    highlighted: true,
    badge: 'Recommended',
    href: '/api/stripe/checkout?plan=pro&interval=month',
  },
  {
    id: 'verified',
    name: 'Verified Operator',
    price: '$149',
    period: '/yr',
    desc: 'Trust & broker search visibility',
    features: ['Verified badge', 'Broker search results', 'Corridor rank claim', 'Basic analytics'],
    cta: 'Get Verified',
    highlighted: false,
    href: '/api/stripe/checkout?plan=verified&interval=year',
  },
];

function PlanContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-8">
          {['Claim', 'Start', 'Territory', 'Plan', 'Success'].map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 3
                  ? 'bg-accent text-black'
                  : i < 3
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/5 text-gray-600 border border-white/10'
              }`}>
                {i < 3 ? '✓' : i + 1}
              </span>
              <span className={i === 3 ? 'text-accent font-semibold' : ''}>{step}</span>
              {i < 4 && <span className="text-gray-700 mx-1">→</span>}
            </span>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-400 text-sm font-medium">
              {error === 'cancelled'
                ? 'Checkout was cancelled. Try again or start with a free profile.'
                : 'Hit a snag — try again or contact support.'}
            </p>
          </div>
        )}

        <header className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">
            Choose Your <span className="text-accent">Plan</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
            Start free and upgrade anytime. Pro operators get 3x more load alerts.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-[1px] ${
                plan.highlighted
                  ? 'bg-gradient-to-b from-accent/60 via-accent/20 to-accent/5 shadow-[0_0_30px_rgba(245,159,10,0.12)]'
                  : 'bg-white/[0.06]'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-accent text-black text-[10px] font-black px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}
              <div className="bg-[#0a0a0a] rounded-2xl p-6 h-full flex flex-col">
                <h3 className="text-white font-bold text-base mb-0.5">{plan.name}</h3>
                <p className="text-gray-500 text-xs mb-4">{plan.desc}</p>
                <div className="mb-4">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm ml-1">{plan.period}</span>
                  {plan.annualNote && (
                    <p className="text-green-400 text-[10px] mt-1">{plan.annualNote}</p>
                  )}
                </div>
                <ul className="space-y-2 mb-6 flex-grow">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className="text-green-400 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center py-2.5 rounded-xl font-bold text-sm transition-all ${
                    plan.highlighted
                      ? 'bg-accent text-black hover:bg-yellow-500'
                      : 'bg-white/[0.06] text-white border border-white/[0.1] hover:border-accent/30'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          All plans include a free directory listing. You can upgrade or cancel anytime.
        </p>
      </main>
    </>
  );
}

export default function OnboardingPlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-accent animate-pulse">Loading...</div>
      </div>
    }>
      <PlanContent />
    </Suspense>
  );
}
