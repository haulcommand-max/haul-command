'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  evaluatePaywall,
  ESCORT_SUBSCRIPTION_TIERS,
  BROKER_SUBSCRIPTION_TIERS,
  type PaywallDecision,
} from '@/lib/monetization/monetization-engine';
import {
  getMarketModeConfig,
  type MarketModeConfig,
} from '@/lib/ads/market-mode';
import {
  FreemiumPressureEngine,
  type UserBehaviorSignals,
  type PressureDecision,
} from '@/lib/platform/freemium-pressure-engine';

// ═══════════════════════════════════════════════════════════════
// SMART PAYWALL BANNER — Renders paywall nudges for free-tier
// users who have hit usage thresholds.
//
// This component:
// 1. Reads user's subscription tier + usage from props
// 2. Calls evaluatePaywall() to get the decision
// 3. Calls getMarketModeConfig() to check if monetization is active
// 4. Renders the appropriate upsell banner
// ═══════════════════════════════════════════════════════════════

interface SmartPaywallBannerProps {
  userType: 'escort' | 'broker' | 'carrier';
  currentTier: 'free' | 'pro' | 'business' | 'elite' | 'enterprise';
  usage: { searches: number; leads: number; routes: number; daysActive: number };
  countryCode: string;
  className?: string;
  /** Optional: behavior signals for intelligent pressure. If omitted, falls back to static paywall only. */
  behaviorSignals?: Partial<UserBehaviorSignals>;
}

const URGENCY_STYLES: Record<string, { bg: string; border: string; accent: string }> = {
  soft: {
    bg: 'rgba(212,168,67,0.04)',
    border: 'rgba(212,168,67,0.12)',
    accent: '#D4A843',
  },
  medium: {
    bg: 'rgba(251,191,36,0.06)',
    border: 'rgba(251,191,36,0.2)',
    accent: '#FBBF24',
  },
  hard: {
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.2)',
    accent: '#EF4444',
  },
};

const REASON_COPY: Record<string, { headline: string; subtext: string }> = {
  lead_limit_reached: {
    headline: "You've hit your lead limit",
    subtext: 'Upgrade to Pro to receive unlimited leads and appear higher in search',
  },
  search_limit_reached: {
    headline: 'Daily searches reached',
    subtext: 'Upgrade to Business for unlimited searches, coverage scoring, and corridor risk reports',
  },
  approaching_lead_cap: {
    headline: 'Approaching lead cap',
    subtext: "You're at 80%+ of your monthly leads. Upgrade to Elite for unlimited capacity",
  },
  engaged_free_user: {
    headline: "You're a power user",
    subtext: "You've been very active — unlock premium features to get even more out of Haul Command",
  },
};

export default function SmartPaywallBanner({
  userType,
  currentTier,
  usage,
  countryCode,
  className = '',
  behaviorSignals,
}: SmartPaywallBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const decision = useMemo(
    () => evaluatePaywall(userType, currentTier, usage),
    [userType, currentTier, usage]
  );

  const modeConfig = useMemo(
    () => getMarketModeConfig(countryCode),
    [countryCode]
  );

  // Check if monetization is active for this country
  const isMonetizationActive = modeConfig.monetization_active.length > 0;

  // Compute behavior-driven pressure if signals provided
  const pressureDecision = useMemo(() => {
    if (!behaviorSignals) return null;
    const fullSignals: UserBehaviorSignals = {
      userId: behaviorSignals.userId || 'anon',
      role: userType === 'broker' ? 'broker' : 'escort',
      countryCode,
      profileViews7d: behaviorSignals.profileViews7d || 0,
      searchAppearances7d: behaviorSignals.searchAppearances7d || 0,
      responseSpeed_p50_hours: behaviorSignals.responseSpeed_p50_hours || 4,
      jobAcceptanceRate: behaviorSignals.jobAcceptanceRate || 0.5,
      profileCompleteness: behaviorSignals.profileCompleteness || 0.3,
      daysSinceSignup: behaviorSignals.daysSinceSignup || usage.daysActive,
      lastActiveHoursAgo: behaviorSignals.lastActiveHoursAgo || 1,
      dailyOpens7d: behaviorSignals.dailyOpens7d || 0,
      notificationOpenRate: behaviorSignals.notificationOpenRate || 0.3,
      featureUsageScore: behaviorSignals.featureUsageScore || 0.3,
      revenueGenerated: behaviorSignals.revenueGenerated || 0,
      missedOpportunities7d: behaviorSignals.missedOpportunities7d || 0,
      corridorRank: behaviorSignals.corridorRank || 50,
      isPaidUser: currentTier !== 'free',
      currentTier: currentTier === 'free' ? 'free' : currentTier === 'pro' ? 'pro' : 'enterprise',
      trustScore: behaviorSignals.trustScore || 0.3,
      verificationLevel: behaviorSignals.verificationLevel || 'none',
      reviewCount: behaviorSignals.reviewCount || 0,
      avgRating: behaviorSignals.avgRating || 0,
    };
    return FreemiumPressureEngine.computePressure(fullSignals, null);
  }, [behaviorSignals, userType, countryCode, currentTier, usage.daysActive]);

  // Don't show if no paywall needed, dismissed, or monetization inactive
  // If pressure engine says 'none' and basic paywall also says no, skip
  if (!decision.show && (!pressureDecision || pressureDecision.overallPressure === 'none')) return null;
  if (dismissed || !isMonetizationActive) return null;

  const style = URGENCY_STYLES[decision.urgencyLevel] || URGENCY_STYLES.soft;
  const copy = REASON_COPY[decision.reason] || {
    headline: `Upgrade to ${decision.suggestedTier}`,
    subtext: 'Unlock premium features and grow your business',
  };

  const tiers = userType === 'broker' ? BROKER_SUBSCRIPTION_TIERS : ESCORT_SUBSCRIPTION_TIERS;
  const suggestedTier = tiers.find(t => t.name === decision.suggestedTier);

  return (
    <div
      className={className}
      style={{
        padding: '1.25rem 1.5rem',
        borderRadius: '0.75rem',
        background: style.bg,
        border: `1px solid ${style.border}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div style={{ flex: 1, minWidth: '200px' }}>
        <h3 style={{
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: '#F3F4F6',
          margin: '0 0 0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span style={{ color: style.accent }}>⚡</span>
          {copy.headline}
        </h3>
        <p style={{
          fontSize: '0.8125rem',
          color: '#9CA3AF',
          margin: 0,
          lineHeight: 1.5,
        }}>
          {copy.subtext}
          {suggestedTier && (
            <span style={{ color: style.accent, fontWeight: 600 }}>
              {' '}— ${suggestedTier.price}/mo
            </span>
          )}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Link
          href="/pricing"
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '0.5rem',
            background: style.accent,
            color: '#0B0B0C',
            fontWeight: 700,
            fontSize: '0.8125rem',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {pressureDecision?.pricingPressure.discountOffered
            ? `Upgrade — ${Math.round(pressureDecision.pricingPressure.discountOffered * 100)}% off`
            : `Upgrade to ${decision.suggestedTier}`}
        </Link>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#6B7280',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: '0.5rem',
          }}
        >
          Dismiss
        </button>
      </div>

      {/* Social proof from pressure engine */}
      {pressureDecision?.pricingPressure.socialProof && (
        <div style={{
          width: '100%', marginTop: '0.5rem',
          fontSize: '0.6875rem', color: '#6B7280', fontStyle: 'italic',
        }}>
          📊 {pressureDecision.pricingPressure.socialProof}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SmartPaywallBannerAuto — Zero-prop session-aware variant
//
// Drop anywhere. Self-fetches pressure level from /api/pressure/compute.
// Unblocks: glossary pages, rate intelligence, state-of-market detail views.
// Does NOT require caller to pass usage or behavior signals.
// ═══════════════════════════════════════════════════════════════

interface AutoProps {
    dataLabel?: string;
    upgradeUrl?: string;
    variant?: 'inline' | 'sticky_bottom';
}

export function SmartPaywallBannerAuto({
    dataLabel = 'full data',
    upgradeUrl = '/pricing',
    variant = 'inline',
}: AutoProps) {
    const [ready, setReady] = React.useState(false);
    const [pressure, setPressure] = React.useState<'none' | 'soft' | 'medium' | 'aggressive' | 'hard_gate'>('soft');
    const [isPro, setIsPro] = React.useState(false);
    const [signals, setSignals] = React.useState<string[]>([]);
    const [upgradeMsg, setUpgradeMsg] = React.useState('');
    const [discount, setDiscount] = React.useState(0);
    const [socialProof, setSocialProof] = React.useState<string | null>(null);

    React.useEffect(() => {
        fetch('/api/pressure/compute', { method: 'POST' })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) return;
                const p = data.pressure ?? 'soft';
                setPressure(p);
                setIsPro(p === 'none' && data.decision?.directoryPressure?.featuredEligible);
                setSignals(data.economic_signals ?? []);
                setUpgradeMsg(data.decision?.directoryPressure?.upgradePromptMessage ?? '');
                setDiscount(data.decision?.pricingPressure?.discountOffered ?? 0);
                setSocialProof(data.decision?.pricingPressure?.socialProof ?? null);
            })
            .catch(() => {})
            .finally(() => setReady(true));
    }, []);

    if (!ready || isPro || pressure === 'none') return null;

    const isHard = pressure === 'hard_gate' || pressure === 'aggressive';
    const headline = isHard && upgradeMsg
        ? upgradeMsg
        : `Unlock ${dataLabel} with Haul Command Pro`;

    const sticky = variant === 'sticky_bottom';

    return (
        <div style={{
            ...(sticky ? {
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
                borderTop: '1px solid rgba(241,169,27,0.2)',
                backdropFilter: 'blur(16px)',
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
            } : {
                borderRadius: 14, padding: '16px 20px',
            }),
            background: isHard
                ? 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(8,8,12,0.97))'
                : 'linear-gradient(135deg, rgba(241,169,27,0.05), rgba(8,8,12,0.97))',
            border: `1px solid ${isHard ? 'rgba(239,68,68,0.2)' : 'rgba(241,169,27,0.15)'}`,
        }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: sticky ? 13 : 14, fontWeight: 800, color: '#F0F0F0', marginBottom: 4 }}>
                    {isHard ? '🔒' : '🔓'} {headline}
                </div>
                {signals.length > 0 && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: sticky ? 0 : 8 }}>
                        {signals[0]}
                    </div>
                )}
                {socialProof && !sticky && (
                    <div style={{ fontSize: 10, color: '#6B7280', fontStyle: 'italic', marginBottom: 8 }}>
                        ✦ {socialProof}
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {discount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#22C55E' }}>
                        {Math.round(discount * 100)}% OFF
                    </span>
                )}
                <a href={upgradeUrl} style={{
                    padding: '8px 18px',
                    background: isHard ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                    borderRadius: 9, color: '#000', fontSize: 12, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap',
                }}>
                    {isHard ? 'Upgrade to Unlock →' : 'See Pro Plans →'}
                </a>
            </div>
        </div>
    );
}

