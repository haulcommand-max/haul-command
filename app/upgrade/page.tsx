import React from 'react';
import { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { PRICING } from '@/lib/config/pricing';
import { CheckCircle2, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Upgrade to Haul Command Pro',
  description: 'Unlock full corridor intelligence, premium visibility, and instant quoting tools for your pilot car business.',
};

export default function UpgradePage() {
  const proFeatures = [
    'Unlock all local corridor intelligence & restrictions',
    'Get "Pro Verified" trust badge on all searches',
    'Access direct broker contact info on active loads',
    'Submit up to 100 quick-quotes per month',
    'Post unlimited available capacity broadcasts',
    'Remove all ads and sponsored content'
  ];

  return (
    <main className="  flex flex-col items-center py-16 px-4">
      {/* 1. Hormozi Lens: Value Proposition & Urgency */}
      <div className="max-w-3xl text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4">
          Stop guessing. <span className="text-hc-gold-500">Go Pro.</span>
        </h1>
        <p className="text-xl text-slate-400">
          Unlock the complete Haul Command operating system. See intelligence others don't. Get booked faster.
        </p>
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-start">
        {/* 2. Steve Jobs Lens: Clean, one-action card */}
        <div className=" border border-hc-gold-500/30 rounded-3xl p-8 relative shadow-[0_0_40px_rgba(202,138,4,0.1)]">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-hc-gold-500 text-slate-950 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
            Most Popular
          </div>
          
          <div className="flex flex-col items-center pt-4 pb-8 border-b border-slate-800 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Pro Operator</h2>
            <div className="flex items-end justify-center gap-1 mb-2">
              <span className="text-5xl font-black text-hc-gold-500">${PRICING?.ESCORT?.PRO?.price_monthly || 49}</span>
              <span className="text-slate-500 text-lg mb-1">/mo</span>
            </div>
            <p className="text-sm text-slate-400">Pays for itself with one extra escort job.</p>
          </div>

          <div className="py-8 space-y-4">
            {proFeatures.map((feat, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-hc-gold-500 shrink-0 mt-0.5" />
                <span className="text-slate-300">{feat}</span>
              </div>
            ))}
          </div>

          <form action="/api/checkout/stripe-session" method="POST" className="pt-4">
            <input type="hidden" name="tier" value="pro" />
            <Button size="lg" className="w-full bg-hc-gold-500 hover:bg-hc-gold-400 text-slate-950 font-black text-lg h-14 rounded-2xl shadow-xl shadow-hc-gold-900/20">
              <Zap className="w-5 h-5 mr-2" />
              Upgrade to Pro Now
            </Button>
            <p className="text-xs text-center text-slate-500 mt-4">
              Secure 256-bit Stripe Checkout. Cancel anytime.
            </p>
          </form>
        </div>

        {/* 3. Proof & Risk Reversal */}
        <div className="flex flex-col justify-center space-y-8 md:pl-8">
          <div className="/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="w-8 h-8 text-emerald-500" />
              <h3 className="text-xl font-bold text-white">7-Day Guarantee</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Try Pro for a full week. If you don't book at least one extra job using our premium intelligence surfaces, we'll refund you immediately. No friction.
            </p>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-4">Why Operators Upgrade</h3>
            <blockquote className="border-l-2 border-hc-gold-500 pl-4 text-slate-300">
              "I upgraded just to see the direct broker contacts on two loads in Texas. Booked them both within an hour. The $49 paid for itself before lunch."
              <footer className="mt-2 text-sm text-slate-500">— Mike T., Heavy Haul Specialist (Texas)</footer>
            </blockquote>
          </div>
          
          <div className="pt-4">
            <Link href="/" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              â† Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}