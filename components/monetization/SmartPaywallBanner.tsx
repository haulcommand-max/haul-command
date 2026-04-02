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
    headline: 'You've hit your lead limit',
    subtext: 'Upgrade to Pro to receive unlimited leads and appear higher in search',
  },
  search_limit_reached: {
    headline: 'Daily searches reached',
    subtext: 'Upgrade to Business for unlimited searches, coverage scoring, and corridor risk reports',
  },
  approaching_lead_cap: {
    headline: 'Approaching lead cap',
    subtext: 'You're at 80%+ of your monthly leads. Upgrade to Elite for unlimited capacity',
  },
  engaged_free_user: {
    headline: 'You're a power user',
    subtext: 'You've been very active — unlock premium features to get even more out of Haul Command',
  },
};

export default function SmartPaywallBanner({
  userType,
  currentTier,
  usage,
  countryCode,
  className = '',
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

  // Don't show if no paywall needed, dismissed, or monetization inactive
  if (!decision.show || dismissed || !isMonetizationActive) return null;

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
          Upgrade to {decision.suggestedTier}
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
    </div>
  );
}
