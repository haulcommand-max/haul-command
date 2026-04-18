import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OPUS-02 S1-05: KYC Tier Enforcement Middleware
 *
 * Enforced at API level (defense-in-depth over RLS — no client-side bypass).
 * Tier thresholds per risk_and_money_guardrails.yaml:
 *   Tier 0 — browse only (email verified)
 *   Tier 1 — bid on loads ($500 lifetime, phone verified)
 *   Tier 2 — post loads with escrow ($5K lifetime, gov ID via Stripe Identity)
 *   Tier 3 — instant payouts ($50K lifetime, full KYC + insurance)
 */

export const KYC_TIERS = {
  BROWSE: 0,
  TRANSACT: 1,
  ESCROW: 2,
  ENTERPRISE: 3,
} as const;

export type KycTier = (typeof KYC_TIERS)[keyof typeof KYC_TIERS];

interface KycCheckResult {
  allowed: boolean;
  currentTier: number;
  requiredTier: number;
  response?: NextResponse;
}

/**
 * withKycGuard — wraps a route handler with KYC tier enforcement.
 * Usage: export const POST = withKycGuard(KYC_TIERS.ESCROW, async (req, ctx, profile) => { ... })
 */
export function withKycGuard(
  requiredTier: KycTier,
  handler: (req: NextRequest, context: any, profile: Record<string, any>) => Promise<NextResponse>
) {
  return async function (req: NextRequest, context: any): Promise<NextResponse> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_tier, kyc_level, stripe_customer_id, role')
      .eq('id', session.user.id)
      .single();

    // Resolve tier: prefer kyc_tier (canonical), fall back to kyc_level
    const currentTier: number = profile?.kyc_tier ?? profile?.kyc_level ?? 0;

    if (currentTier < requiredTier) {
      return NextResponse.json({
        error: 'KYC upgrade required',
        required_tier: requiredTier,
        current_tier: currentTier,
        upgrade_url: '/settings/verification',
        message: getKycErrorMessage(requiredTier),
      }, { status: 403 });
    }

    return handler(req, context, { ...profile, id: session.user.id, currentTier });
  };
}

/**
 * Standalone check for use inside existing handlers.
 */
export async function assertKycTier(userId: string, requiredTier: KycTier): Promise<KycCheckResult> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('kyc_tier, kyc_level')
    .eq('id', userId)
    .single();

  const currentTier: number = profile?.kyc_tier ?? profile?.kyc_level ?? 0;

  if (currentTier < requiredTier) {
    return {
      allowed: false,
      currentTier,
      requiredTier,
      response: NextResponse.json({
        error: 'KYC upgrade required',
        required_tier: requiredTier,
        current_tier: currentTier,
        upgrade_url: '/settings/verification',
        message: getKycErrorMessage(requiredTier),
      }, { status: 403 }),
    };
  }

  return { allowed: true, currentTier, requiredTier };
}

function getKycErrorMessage(tier: KycTier): string {
  switch (tier) {
    case KYC_TIERS.TRANSACT: return 'Phone verification required to bid on loads.';
    case KYC_TIERS.ESCROW: return 'Government ID verification required to post loads or use escrow.';
    case KYC_TIERS.ENTERPRISE: return 'Full business verification required for instant payouts.';
    default: return 'Additional verification required.';
  }
}
