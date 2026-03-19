'use client';

import RoleCommandCenter from '@/components/hc/RoleCommandCenter';
import { useRole } from '@/lib/role-context';
import HCActionQuad from '@/components/hc/ActionQuad';
import HCProofBar from '@/components/hc/ProofBar';
import HCLocationChipRow from '@/components/hc/LocationChipRow';
import type { HCMetric, HCLink, HCAction } from '@/lib/hc-types';

interface HomeHeroProps {
  /** Fallback actions for users who haven't selected a role */
  fallbackActions: HCAction[];
  metrics: HCMetric[];
  locationChips: HCLink[];
}

/**
 * HomeHero — Client component that switches between:
 *  1. RoleCommandCenter (when role-aware system is active)
 *  2. Generic hero fallback (SSR-compatible for SEO)
 *
 * The RoleCommandCenter replaces the generic hero entirely once a role is selected.
 * If no role is selected, the RoleSelector is shown instead of the generic hero.
 */
export default function HomeHero({ fallbackActions, metrics, locationChips }: HomeHeroProps) {
  const { hasRole } = useRole();

  // Always show the role command center (it handles both states internally)
  return (
    <>
      {/* SEO H1 — always rendered for crawlers */}
      <h1 className="sr-only">Haul Command — Pilot Car & Escort Vehicle Directory</h1>
      <RoleCommandCenter />

      {/* Proof bar and location chips shown regardless of role state */}
      {!hasRole && (
        <div className="w-full max-w-5xl mx-auto px-4 space-y-6 sm:space-y-8 pb-6 sm:pb-8">
          <HCProofBar metrics={metrics} />
          <HCLocationChipRow chips={locationChips} />
        </div>
      )}

      {hasRole && (
        <div className="w-full max-w-5xl mx-auto px-4 space-y-4 sm:space-y-6 pb-6 sm:pb-8">
          <HCProofBar metrics={metrics} />
        </div>
      )}
    </>
  );
}
