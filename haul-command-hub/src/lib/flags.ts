/**
 * Haul Command — Feature Flags System
 *
 * Merged & upgraded from existing flags.ts + flags-client.ts.
 * Single source of truth. Server + client compatible.
 * Ship daily, rollback instantly, A/B test everything.
 *
 * Usage:
 *   import { flags } from '@/lib/flags';
 *   if (flags.newRanking) { ... }
 */

export type FlagKey =
  | 'newRanking'            // upgraded operator ranking algorithm
  | 'edgeDirectory'         // edge-runtime directory pages
  | 'activityTicker'        // live activity feed ticker
  | 'toolCTAEnforcement'    // force CTA on every tool result
  | 'corridorSubscriptions' // corridor subscription upsell
  | 'sponsoredListings'     // sponsored placement system
  | 'brokerOnboarding'      // broker-specific onboarding path
  | 'shipperPortal'         // shipper quick-plan flow
  | 'urgencyPricing'        // "3 escorts left" scarcity signals
  | 'pdfMoveReport'         // downloadable move report from tools
  | 'priceDiscrimination'   // region/demand-based pricing
  | 'apiPublicDocs'         // public API documentation
  | 'legalDisclaimers'      // legal disclaimer layer on all tools
  | 'userAckGate'           // one-time checkbox acknowledgment for tools
  | 'autoRollback'          // conversion drop auto-rollback (future)
  | 'abTestRanking';        // A/B test for ranking algorithm

// ─── Server-side flags ──────────────────────────────────────
// Read from env vars for runtime control without redeploy.
// Set NEXT_PUBLIC_FLAG_* in Vercel env to toggle per environment.

function envFlag(key: string, fallback: boolean): boolean {
  const val = process.env[`NEXT_PUBLIC_FLAG_${key.toUpperCase()}`];
  if (val === 'true') return true;
  if (val === 'false') return false;
  return fallback;
}

export const flags: Record<FlagKey, boolean> = {
  newRanking:            envFlag('NEW_RANKING', true),
  edgeDirectory:         envFlag('EDGE_DIRECTORY', true),
  activityTicker:        envFlag('ACTIVITY_TICKER', true),
  toolCTAEnforcement:    envFlag('TOOL_CTA_ENFORCEMENT', true),
  corridorSubscriptions: envFlag('CORRIDOR_SUBSCRIPTIONS', true),
  sponsoredListings:     envFlag('SPONSORED_LISTINGS', true),
  brokerOnboarding:      envFlag('BROKER_ONBOARDING', true),
  shipperPortal:         envFlag('SHIPPER_PORTAL', false),   // build in progress
  urgencyPricing:        envFlag('URGENCY_PRICING', true),
  pdfMoveReport:         envFlag('PDF_MOVE_REPORT', false),  // build in progress
  priceDiscrimination:   envFlag('PRICE_DISCRIMINATION', false),
  apiPublicDocs:         envFlag('API_PUBLIC_DOCS', true),
  legalDisclaimers:      envFlag('LEGAL_DISCLAIMERS', true),
  userAckGate:           envFlag('USER_ACK_GATE', true),
  autoRollback:          envFlag('AUTO_ROLLBACK', false),
  abTestRanking:         envFlag('AB_TEST_RANKING', false),
};

// ─── A/B variant picker ─────────────────────────────────────
export function getVariant(flagKey: FlagKey, sessionSeed: number): 'A' | 'B' {
  if (!flags[flagKey]) return 'A';
  return sessionSeed % 2 === 0 ? 'A' : 'B';
}

// ─── Client-safe flag snapshot ──────────────────────────────
// Pass this to client components via props — no env leakage.
export type ClientFlags = Pick<
  typeof flags,
  'activityTicker' | 'toolCTAEnforcement' | 'urgencyPricing' | 'legalDisclaimers' | 'userAckGate'
>;

export function getClientFlags(): ClientFlags {
  return {
    activityTicker:     flags.activityTicker,
    toolCTAEnforcement: flags.toolCTAEnforcement,
    urgencyPricing:     flags.urgencyPricing,
    legalDisclaimers:   flags.legalDisclaimers,
    userAckGate:        flags.userAckGate,
  };
}
