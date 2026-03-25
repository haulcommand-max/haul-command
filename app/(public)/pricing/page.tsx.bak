'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Check, ArrowRight, Shield, Zap, Crown, ChevronRight,
  TrendingUp, Star, Sparkles, Building2, Loader2,
} from 'lucide-react';
import { LOGO_SRC, ALT_TEXT } from '@/lib/config/brand';

type BillingCycle = 'monthly' | 'yearly';

interface PlanTier {
  id: string;
  priceKey: string;
  priceKeyYearly?: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  icon: any;
  iconColor: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  badge?: string;
}

const ESCORT_PLANS: PlanTier[] = [
  {
    id: 'free',
    priceKey: '',
    name: 'Starter',
    tagline: 'Get discovered by brokers',
    monthlyPrice: 0,
    icon: Shield,
    iconColor: '#8fa3b8',
    features: [
      'Basic directory listing',
      '3 job alerts per day',
      'Standard ranking',
      'View corridor heat maps',
      'Collect reviews',
    ],
    cta: 'Get Started Free',
  },
  {
    id: 'pro',
    priceKey: 'escort_pro_monthly',
    priceKeyYearly: 'escort_pro_yearly',
    name: 'Verified Pro',
    tagline: 'Stand out and win more loads',
    monthlyPrice: 29,
    yearlyPrice: 278,
    icon: Zap,
    iconColor: '#C6923A',
    features: [
      'Everything in Starter',
      'Unlimited job alerts',
      'Priority search ranking',
      'Verified Pro badge',
      'Live analytics dashboard',
      'Weather + wind overlay',
      'Equipment filter access',
      'Unlimited corridor saves',
      'Early access to loads',
    ],
    cta: 'Go Pro',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'elite',
    priceKey: 'escort_elite_monthly',
    priceKeyYearly: 'escort_elite_yearly',
    name: 'Corridor Elite',
    tagline: 'Dominate your corridors',
    monthlyPrice: 79,
    yearlyPrice: 758,
    icon: Crown,
    iconColor: '#a855f7',
    features: [
      'Everything in Verified Pro',
      'Top-of-corridor placement',
      'Leaderboard visibility boost',
      'Advanced competitor insights',
      'AI-enhanced profile',
      'Corridor demand alerts',
      'Dispute protection priority',
      'Dedicated support queue',
    ],
    cta: 'Go Elite',
  },
];

const BROKER_PLAN: PlanTier = {
  id: 'broker_seat',
  priceKey: 'broker_seat_monthly',
  priceKeyYearly: 'broker_seat_yearly',
  name: 'Broker Seat',
  tagline: 'Post loads, find coverage, move freight',
  monthlyPrice: 149,
  yearlyPrice: 1430,
  icon: Building2,
  iconColor: '#3b82f6',
  features: [
    'Post unlimited loads',
    '10 load boost credits/month',
    'Smart Match access',
    'Days-to-Pay visibility for escorts',
    'Priority in Smart Match',
    'Sponsored directory slot (1/month)',
    'Corridor supply density data',
    'Coverage confidence metrics',
  ],
  cta: 'Get Broker Seat',
};

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true') setSuccess(true);
    }
  }, []);

  async function handleCheckout(plan: PlanTier) {
    if (plan.id === 'free') {
      window.location.href = '/onboarding/start';
      return;
    }

    const priceKey = billing === 'yearly' && plan.priceKeyYearly
      ? plan.priceKeyYearly
      : plan.priceKey;

    setLoading(plan.id);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading('portal');
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert('Could not open billing portal.');
    } finally {
      setLoading(null);
    }
  }

  const savings = Math.round((1 - 278 / (29 * 12)) * 100);

  return (
    <div className="min-h-screen text-white font-[family-name:var(--font-body)]" style={{ background: '#060b12' }}>
      <style>{`
        .pricing-card {
          background: rgba(14,17,24,0.95);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: clamp(20px, 4vw, 32px);
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .pricing-card:hover {
          border-color: rgba(198,146,58,0.2);
          transform: translateY(-2px);
          box-shadow: 0 20px 60px -12px rgba(0,0,0,0.4);
        }
        .pricing-card--highlight {
          border-color: rgba(198,146,58,0.3) !important;
          box-shadow: 0 0 60px -8px rgba(198,146,58,0.1);
          background: linear-gradient(170deg, rgba(198,146,58,0.04), rgba(14,17,24,0.98)) !important;
        }
        .pricing-card--highlight::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, rgba(198,146,58,0.6), #C6923A, rgba(198,146,58,0.6));
        }
        .pricing-toggle {
          display: flex;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 4px;
          gap: 2px;
        }
        .pricing-toggle button {
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: #8fa3b8;
        }
        .pricing-toggle button.active {
          background: rgba(198,146,58,0.15);
          color: #C6923A;
        }
        .pricing-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 6px 0;
          font-size: 13px;
          color: #b0bac9;
          line-height: 1.5;
        }
        .pricing-cta {
          width: 100%;
          min-height: 48px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .pricing-cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .pricing-cta--primary {
          background: linear-gradient(135deg, #C6923A 0%, #E0B05C 50%, #C6923A 100%);
          color: #0a0a0f;
          box-shadow: 0 4px 24px rgba(198,146,58,0.3);
        }
        .pricing-cta--primary:hover:not(:disabled) {
          box-shadow: 0 6px 32px rgba(198,146,58,0.4);
          transform: translateY(-1px);
        }
        .pricing-cta--secondary {
          background: rgba(255,255,255,0.06);
          color: #f5f7fb;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .pricing-cta--secondary:hover:not(:disabled) {
          background: rgba(255,255,255,0.1);
        }
        @media (max-width: 767px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(198,146,58,0.07),transparent_60%)]" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 border-b border-white/[0.06]" style={{ background: 'rgba(11,11,12,0.85)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <Image src={LOGO_SRC} alt={ALT_TEXT} width={180} height={40} priority
              style={{ objectFit: 'contain', height: 36, width: 'auto' }} />
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={handlePortal} disabled={loading === 'portal'}
              className="text-xs font-semibold text-[#8fa3b8] hover:text-white transition-colors px-3 py-2">
              {loading === 'portal' ? 'Loading...' : 'Manage Billing'}
            </button>
            <Link href="/login" className="text-xs font-bold px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', color: '#f5f7fb' }}>
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 sm:py-20">
        {/* Success banner */}
        {success && (
          <div className="mb-8 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">Welcome aboard!</span>
            </div>
            <p className="text-xs text-[#b0bac9]">Your subscription is active. You now have full access to your plan features.</p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.25em] mb-3">
            Simple, Transparent Pricing
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Run Smarter. Earn More.
          </h1>
          <p className="text-[#8fa3b8] text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Free for escorts to get started. Upgrade when you&apos;re ready to dominate your corridors.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="pricing-toggle">
              <button className={billing === 'monthly' ? 'active' : ''} onClick={() => setBilling('monthly')}>
                Monthly
              </button>
              <button className={billing === 'yearly' ? 'active' : ''} onClick={() => setBilling('yearly')}>
                Yearly
              </button>
            </div>
            {billing === 'yearly' && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Save {savings}%
              </span>
            )}
          </div>
        </div>

        {/* Escort Plans */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4 text-[#C6923A]" />
            <span className="text-xs font-bold text-[#C6923A] uppercase tracking-[0.2em]">
              For Escort Operators
            </span>
          </div>
          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {ESCORT_PLANS.map((plan) => {
              const Icon = plan.icon;
              const price = billing === 'yearly' && plan.yearlyPrice != null
                ? Math.round(plan.yearlyPrice / 12)
                : plan.monthlyPrice;
              const totalYearly = plan.yearlyPrice || plan.monthlyPrice * 12;

              return (
                <div key={plan.id} className={`pricing-card ${plan.highlight ? 'pricing-card--highlight' : ''}`}>
                  {plan.badge && (
                    <div className="absolute top-4 right-4">
                      <span className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-[0.1em]"
                        style={{ background: 'rgba(198,146,58,0.15)', color: '#C6923A', border: '1px solid rgba(198,146,58,0.25)' }}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${plan.iconColor}12`, border: `1px solid ${plan.iconColor}20` }}>
                    <Icon className="w-5 h-5" style={{ color: plan.iconColor }} />
                  </div>

                  <h3 className="text-lg font-black text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-[#8fa3b8] mb-4">{plan.tagline}</p>

                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black" style={{ color: plan.highlight ? '#C6923A' : '#f5f7fb', fontFamily: 'var(--font-mono, monospace)' }}>
                        ${price}
                      </span>
                      <span className="text-sm text-[#5A6577] font-semibold">/mo</span>
                    </div>
                    {billing === 'yearly' && plan.yearlyPrice != null && (
                      <div className="text-[10px] text-[#8fa3b8] mt-1">
                        ${totalYearly} billed annually
                      </div>
                    )}
                  </div>

                  <div className="flex-1 mb-6">
                    {plan.features.map((f) => (
                      <div key={f} className="pricing-feature">
                        <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: plan.iconColor }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleCheckout(plan)}
                    disabled={loading !== null}
                    className={`pricing-cta ${plan.highlight ? 'pricing-cta--primary' : 'pricing-cta--secondary'}`}
                  >
                    {loading === plan.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <>{plan.cta} <ChevronRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Broker Plan */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-4 h-4 text-[#3b82f6]" />
            <span className="text-xs font-bold text-[#3b82f6] uppercase tracking-[0.2em]">
              For Brokers &amp; Dispatchers
            </span>
          </div>
          <div className="pricing-card" style={{ maxWidth: 480 }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#3b82f612', border: '1px solid #3b82f620' }}>
                <Building2 className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-white mb-1">{BROKER_PLAN.name}</h3>
                <p className="text-xs text-[#8fa3b8] mb-3">{BROKER_PLAN.tagline}</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-blue-400" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                    ${billing === 'yearly' && BROKER_PLAN.yearlyPrice
                      ? Math.round(BROKER_PLAN.yearlyPrice / 12)
                      : BROKER_PLAN.monthlyPrice}
                  </span>
                  <span className="text-sm text-[#5A6577] font-semibold">/mo per seat</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 mt-4 mb-6">
              {BROKER_PLAN.features.map((f) => (
                <div key={f} className="pricing-feature">
                  <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => handleCheckout(BROKER_PLAN)} disabled={loading !== null}
                className="pricing-cta pricing-cta--secondary" style={{ maxWidth: 260 }}>
                {loading === BROKER_PLAN.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <>{BROKER_PLAN.cta} <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
              <div className="flex items-center gap-2 text-[10px] text-[#5A6577]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Brokers also pay $24 per successful match (no fill = no fee)
              </div>
            </div>
          </div>
        </div>

        {/* Add-Ons */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-[#C6923A]" />
            <span className="text-xs font-bold text-[#C6923A] uppercase tracking-[0.2em]">
              À La Carte
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { name: 'Load Boost', price: '$14', desc: 'Push your load to top of feed for 24 hours', icon: TrendingUp, color: '#ef4444' },
              { name: 'Directory Featured', price: '$199/mo', desc: 'Premium placement in your state directory', icon: Star, color: '#C6923A' },
              { name: 'Leaderboard Pin', price: '$99/mo', desc: 'Pinned above organic rankings in your corridor', icon: Crown, color: '#a855f7' },
            ].map((item) => (
              <div key={item.name} className="pricing-card" style={{ padding: '20px' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${item.color}12`, border: `1px solid ${item.color}20` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    <span className="text-xs font-black" style={{ color: item.color, fontFamily: 'var(--font-mono, monospace)' }}>{item.price}</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#8fa3b8] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Trust */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#5A6577]">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[#C6923A]" /> Escrow-protected payments
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-400" /> Cancel anytime
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-blue-400" /> No long-term contracts
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
