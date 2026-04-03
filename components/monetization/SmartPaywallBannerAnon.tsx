'use client';

import React from 'react';
import SmartPaywallBanner from '@/components/monetization/SmartPaywallBanner';

/**
 * SmartPaywallBannerAnon — Drop-in wrapper for SmartPaywallBanner
 * that works on server-rendered pages without user session data.
 * 
 * Renders a "soft" paywall nudge for anonymous/free-tier users.
 * When we have real session data, this should be upgraded to pass
 * actual user tier and usage metrics.
 */

interface Props {
  surface?: string;
  className?: string;
}

export function SmartPaywallBannerAnon({ surface, className }: Props) {
  return (
    <SmartPaywallBanner
      userType="escort"
      currentTier="free"
      usage={{ searches: 8, leads: 4, routes: 3, daysActive: 7 }}
      countryCode="us"
      className={className}
    />
  );
}
