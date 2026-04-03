'use client';

// ══════════════════════════════════════════════════════════════════
// PAYWALL BANNER — High-Intent Surface Upsell
//
// Renders an upgrade CTA banner when evaluatePaywall() signals
// that the current user has hit a usage threshold.
//
// Usage:
//   <PaywallBanner
//     userType="escort"
//     currentTier="free"
//     usage={{ searches: 0, leads: 5, routes: 0, daysActive: 3 }}
//     surfaceName="Rates Intelligence"
//   />
//
// The component evaluates locally (no server call) using the same
// thresholds as evaluatePaywall() in monetization-engine.ts.
// For the DB-enriched version, use evaluatePaywallWithFlags() server-side
// and pass `forceShow` + `suggestedTier` as props.
// ══════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import Link from 'next/link';

export type PaywallUserType = 'escort' | 'broker' | 'carrier';
export type PaywallTier = 'free' | 'pro' | 'business' | 'elite' | 'enterprise';

export interface PaywallUsage {
  searches: number;
  leads: number;
  routes: number;
  daysActive: number;
}

interface PaywallBannerProps {
  userType?: PaywallUserType;
  currentTier?: PaywallTier;
  usage?: PaywallUsage;
  surfaceName?: string;
  /** Override: force the banner visible regardless of usage thresholds */
  forceShow?: boolean;
  /** Override: suggested tier label when forceShow is true */
  suggestedTier?: string;
  /** Override: urgency level when forceShow is true */
  urgencyLevel?: 'soft' | 'medium' | 'hard';
}

interface PaywallDecision {
  show: boolean;
  reason: string;
  suggestedTier: string;
  urgencyLevel: 'soft' | 'medium' | 'hard';
}

// ── Mirror of evaluatePaywall() from monetization-engine.ts ──────
function evaluatePaywallClient(
  userType: PaywallUserType,
  currentTier: PaywallTier,
  usage: PaywallUsage
): PaywallDecision {
  if (userType === 'escort' && currentTier === 'free' && usage.leads >= 5)
    return { show: true, reason: 'lead_limit_reached', suggestedTier: 'Pro', urgencyLevel: 'medium' };
  if (userType === 'broker' && currentTier === 'free' && usage.searches >= 3)
    return { show: true, reason: 'search_limit_reached', suggestedTier: 'Business', urgencyLevel: 'hard' };
  if (userType === 'escort' && currentTier === 'pro' && usage.leads >= 40)
    return { show: true, reason: 'approaching_lead_cap', suggestedTier: 'Elite', urgencyLevel: 'soft' };
  if (currentTier === 'free' && usage.daysActive >= 7 && (usage.searches > 10 || usage.leads > 2))
    return { show: true, reason: 'engaged_free_user', suggestedTier: userType === 'broker' ? 'Business' : 'Pro', urgencyLevel: 'soft' };
  return { show: false, reason: 'no_paywall', suggestedTier: '', urgencyLevel: 'soft' };
}

const URGENCY_STYLES: Record<'soft' | 'medium' | 'hard', { bar: string; badge: string; badgeText: string }> = {
  soft: {
    bar: 'bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border-amber-500/20',
    badge: 'bg-amber-500/20 text-amber-300',
    badgeText: 'Upgrade Available',
  },
  medium: {
    bar: 'bg-gradient-to-r from-orange-500/15 to-amber-500/10 border-orange-500/25',
    badge: 'bg-orange-500/25 text-orange-300',
    badgeText: 'Limit Approaching',
  },
  hard: {
    bar: 'bg-gradient-to-r from-red-500/20 to-orange-500/10 border-red-500/30',
    badge: 'bg-red-500/20 text-red-300',
    badgeText: 'Limit Reached',
  },
};

const COPY: Record<string, { headline: string; sub: string }> = {
  lead_limit_reached: {
    headline: 'You\'ve used your 5 free leads this month.',
    sub: 'Upgrade to Pro — unlimited leads, verified badge, priority ranking.',
  },
  search_limit_reached: {
    headline: 'Daily search limit reached.',
    sub: 'Unlock unlimited corridor searches with a Business plan.',
  },
  approaching_lead_cap: {
    headline: 'You\'re approaching your Pro lead cap.',
    sub: 'Elite gives you unlimited leads + top-3 corridor placement.',
  },
  engaged_free_user: {
    headline: 'You\'re getting serious value from Haul Command.',
    sub: 'Upgrade to keep the momentum — more leads, more visibility, more revenue.',
  },
};

export function PaywallBanner({
  userType = 'escort',
  currentTier = 'free',
  usage = { searches: 0, leads: 0, routes: 0, daysActive: 0 },
  surfaceName,
  forceShow,
  suggestedTier: suggestedTierOverride,
  urgencyLevel: urgencyOverride,
}: PaywallBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Re-check localStorage dismissal per surface
    const key = `hc_paywall_dismissed_${surfaceName ?? 'global'}`;
    const ts = localStorage.getItem(key);
    if (ts) {
      // Dismiss for 24h
      const age = Date.now() - parseInt(ts, 10);
      if (age < 86_400_000) setDismissed(true);
    }
  }, [surfaceName]);

  if (!mounted) return null;

  const decision = forceShow
    ? { show: true, reason: 'forced', suggestedTier: suggestedTierOverride ?? 'Pro', urgencyLevel: urgencyOverride ?? ('soft' as const) }
    : evaluatePaywallClient(userType, currentTier, usage);

  if (!decision.show || dismissed) return null;

  const urgency = decision.urgencyLevel;
  const styles = URGENCY_STYLES[urgency];
  const copy = COPY[decision.reason] ?? {
    headline: `Unlock full access to ${surfaceName ?? 'this intelligence surface'}.`,
    sub: 'Upgrade to remove limits and access premium corridor data.',
  };

  const handleDismiss = () => {
    const key = `hc_paywall_dismissed_${surfaceName ?? 'global'}`;
    localStorage.setItem(key, Date.now().toString());
    setDismissed(true);
  };

  return (
    <div
      role="alert"
      aria-label="Upgrade required"
      className={`relative w-full border rounded-2xl px-5 py-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all ${styles.bar}`}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {/* Badge */}
      <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${styles.badge}`}>
        {styles.badgeText}
      </span>

      {/* Copy */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm leading-snug">{copy.headline}</p>
        <p className="text-xs text-gray-400 mt-0.5">{copy.sub}</p>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href={`/pricing?plan=${decision.suggestedTier.toLowerCase()}&ref=${encodeURIComponent(surfaceName ?? 'paywall')}`}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-xl transition-colors whitespace-nowrap"
          aria-label={`Upgrade to ${decision.suggestedTier}`}
          id={`paywall-cta-${surfaceName ?? 'global'}`}
        >
          Upgrade to {decision.suggestedTier}
        </Link>
        <button
          onClick={handleDismiss}
          className="text-gray-600 hover:text-gray-400 text-lg leading-none transition-colors"
          aria-label="Dismiss upgrade banner"
          title="Dismiss for 24 hours"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ── Static soft-gate variant for server-rendered pages ─────────────
// Use this when you want a guaranteed paywall on gated premium surfaces
// without needing runtime usage context.
export function PaywallGateBanner({
  surfaceName,
  tier = 'Pro',
  description,
}: {
  surfaceName: string;
  tier?: string;
  description?: string;
}) {
  return (
    <PaywallBanner
      forceShow
      suggestedTier={tier}
      surfaceName={surfaceName}
      urgencyLevel="medium"
    />
  );
}
