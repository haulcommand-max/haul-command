/**
 * HAUL COMMAND — Affiliate Growth System
 * Referral tracking, commission calculation, payout management.
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface AffiliateAccount {
  id: string;
  user_id: string;
  referral_code: string;
  commission_rate: number; // 0.05 = 5%
  tier: 'standard' | 'pro' | 'elite';
  total_referrals: number;
  active_referrals: number;
  total_earnings_cents: number;
  pending_payout_cents: number;
  created_at: string;
}

export interface ReferralRecord {
  id: string;
  affiliate_id: string;
  referred_user_id: string;
  referred_type: 'operator' | 'broker';
  status: 'pending' | 'activated' | 'paid' | 'expired';
  commission_cents: number;
  referred_at: string;
  activated_at?: string;
}

// ═══════════════════════════════════════════════════════════════
// AFFILIATE CREATION
// ═══════════════════════════════════════════════════════════════

export function createAffiliate(userId: string): AffiliateAccount {
  const code = `HC_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return {
    id: `aff_${Date.now().toString(36)}`,
    user_id: userId,
    referral_code: code,
    commission_rate: 0.10, // 10% default
    tier: 'standard',
    total_referrals: 0,
    active_referrals: 0,
    total_earnings_cents: 0,
    pending_payout_cents: 0,
    created_at: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// TIER SYSTEM (auto-upgrade based on performance)
// ═══════════════════════════════════════════════════════════════

export function calculateAffiliateTier(account: AffiliateAccount): {
  tier: 'standard' | 'pro' | 'elite';
  commission_rate: number;
} {
  if (account.active_referrals >= 50) {
    return { tier: 'elite', commission_rate: 0.20 }; // 20%
  }
  if (account.active_referrals >= 15) {
    return { tier: 'pro', commission_rate: 0.15 }; // 15%
  }
  return { tier: 'standard', commission_rate: 0.10 }; // 10%
}

// ═══════════════════════════════════════════════════════════════
// COMMISSION CALCULATION
// ═══════════════════════════════════════════════════════════════

export function calculateCommission(
  account: AffiliateAccount,
  referredType: 'operator' | 'broker',
  firstTransactionCents: number
): number {
  // Base commission
  let commission = Math.round(firstTransactionCents * account.commission_rate);

  // Bonus for broker referrals (higher LTV)
  if (referredType === 'broker') {
    commission = Math.round(commission * 1.5);
  }

  // Flat bonus for operator activations
  if (referredType === 'operator') {
    commission += 5000; // $50 flat activation bonus
  }

  return commission;
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD METRICS
// ═══════════════════════════════════════════════════════════════

export function getAffiliateDashboard(account: AffiliateAccount, referrals: ReferralRecord[]): {
  total_referrals: number;
  active_users: number;
  earnings_cents: number;
  pending_cents: number;
  conversion_rate: number;
  referral_link: string;
} {
  const active = referrals.filter(r => r.status === 'activated' || r.status === 'paid').length;
  const total = referrals.length;

  return {
    total_referrals: total,
    active_users: active,
    earnings_cents: account.total_earnings_cents,
    pending_cents: account.pending_payout_cents,
    conversion_rate: total > 0 ? Math.round((active / total) * 100) : 0,
    referral_link: `https://haulcommand.com/join?ref=${account.referral_code}`,
  };
}
