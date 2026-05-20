import React from 'react';
import { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { PRICING } from '@/lib/config/pricing';
import { CheckCircle2, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Upgrade to Haul Command Pro',
  description: 'Upgrade your Haul Command profile with stronger proof controls, corridor context, and operator visibility tools.',
};

export default function UpgradePage() {
  const proFeatures = [
    'Add richer corridor and service-area context to your profile',
    'Submit proof for eligibility review and stronger trust signals',
    'Use operator tools for rates, requirements, and readiness checks',
    'Manage quick-quote and capacity-broadcast workflows where enabled',
    'Track profile activity and lead events when configured',
    'Keep sponsored and organic visibility clearly separated',
  ];

  return (
    <main className="flex flex-col items-center px-4 py-16">
      <div className="mb-12 max-w-3xl text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
          Stop guessing. <span className="text-hc-gold-500">Go Pro.</span>
        </h1>
        <p className="text-xl text-slate-400">
          Upgrade the profile, proof, and operating tools brokers review before they decide who fits a move.
        </p>
      </div>

      <div className="grid w-full max-w-5xl items-start gap-8 md:grid-cols-2">
        <div className="relative rounded-3xl border border-hc-gold-500/30 p-8 shadow-[0_0_40px_rgba(202,138,4,0.1)]">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-hc-gold-500 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-slate-950">
            Most Popular
          </div>

          <div className="flex flex-col items-center border-b border-slate-800 pb-8 pt-4 text-center">
            <h2 className="mb-2 text-2xl font-bold text-white">Pro Operator</h2>
            <div className="mb-2 flex items-end justify-center gap-1">
              <span className="text-5xl font-black text-hc-gold-500">
                ${PRICING?.ESCORT?.PRO?.price_monthly || 49}
              </span>
              <span className="mb-1 text-lg text-slate-500">/mo</span>
            </div>
            <p className="text-sm text-slate-400">
              Built for operators who want a stronger broker-facing profile.
            </p>
          </div>

          <div className="space-y-4 py-8">
            {proFeatures.map((feat) => (
              <div key={feat} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-hc-gold-500" />
                <span className="text-slate-300">{feat}</span>
              </div>
            ))}
          </div>

          <form action="/api/checkout/stripe-session" method="POST" className="pt-4">
            <input type="hidden" name="tier" value="pro" />
            <Button size="lg" className="h-14 w-full rounded-2xl bg-hc-gold-500 text-lg font-black text-slate-950 shadow-xl shadow-hc-gold-900/20 hover:bg-hc-gold-400">
              <Zap className="mr-2 h-5 w-5" />
              Upgrade to Pro Now
            </Button>
            <p className="mt-4 text-center text-xs text-slate-500">
              Secure Stripe Checkout. Cancel anytime.
            </p>
          </form>
        </div>

        <div className="flex flex-col justify-center space-y-8 md:pl-8">
          <div className="rounded-2xl border border-slate-800 bg-white/[0.04] p-6">
            <div className="mb-4 flex items-center gap-4">
              <Shield className="h-8 w-8 text-emerald-500" />
              <h3 className="text-xl font-bold text-white">Proof-first upgrade</h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Pro improves the information, controls, and evidence shown around your profile. It does not create fake rank, fake availability, or guaranteed dispatch outcomes.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">
              What Pro changes
            </h3>
            <div className="border-l-2 border-hc-gold-500 pl-4 text-sm leading-6 text-slate-300">
              Pro gives claimed operators more control over profile completeness, proof context, service areas, readiness signals, and routing workflows. Broker-facing placement remains tied to eligibility, quality, and available evidence.
            </div>
          </div>

          <div className="pt-4">
            <Link href="/" className="text-sm font-semibold text-slate-400 transition-colors hover:text-white">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
