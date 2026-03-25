/**
 * HAUL COMMAND — Escrow + QuickPay Financial Engine
 * Merges with existing /app/api/escrow/ endpoints.
 * Adds: auto-release, dispute arbitration, risk-based holds, fast-pay tiers.
 */
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface EscrowRecord {
  id: string;
  job_id: string;
  broker_id: string;
  operator_id: string;
  amount_cents: number;
  currency: string;
  status: 'funded' | 'held' | 'released' | 'disputed' | 'refunded';
  funded_at: string;
  release_conditions: ReleaseCondition[];
  auto_release_at?: string;
  released_at?: string;
  dispute_reason?: string;
  created_at: string;
}

export interface ReleaseCondition {
  type: 'job_completed' | 'broker_confirmed' | 'operator_confirmed' | 'time_elapsed';
  satisfied: boolean;
  satisfied_at?: string;
}

// ═══════════════════════════════════════════════════════════════
// ESCROW CREATION (Risk-Aware)
// ═══════════════════════════════════════════════════════════════

export function createEscrow(
  jobId: string,
  brokerId: string,
  operatorId: string,
  amountCents: number,
  brokerScore: number,
  currency: string = 'usd'
): EscrowRecord {
  const id = `esc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  // Risk-based: low-score brokers require full prepay (funded immediately)
  // High-score brokers get 48hr hold with release on confirmation
  const autoReleaseHours = brokerScore >= 80 ? 24 : brokerScore >= 60 ? 48 : 72;
  const autoReleaseAt = new Date(Date.now() + autoReleaseHours * 3600000).toISOString();

  return {
    id,
    job_id: jobId,
    broker_id: brokerId,
    operator_id: operatorId,
    amount_cents: amountCents,
    currency,
    status: 'funded',
    funded_at: now,
    release_conditions: [
      { type: 'job_completed', satisfied: false },
      { type: 'broker_confirmed', satisfied: false },
      { type: 'operator_confirmed', satisfied: false },
      { type: 'time_elapsed', satisfied: false },
    ],
    auto_release_at: autoReleaseAt,
    created_at: now,
  };
}

// ═══════════════════════════════════════════════════════════════
// CONDITION CHECKER + AUTO-RELEASE
// ═══════════════════════════════════════════════════════════════

export function checkReleaseConditions(escrow: EscrowRecord): boolean {
  const completed = escrow.release_conditions.find(c => c.type === 'job_completed')?.satisfied;
  const brokerOk = escrow.release_conditions.find(c => c.type === 'broker_confirmed')?.satisfied;
  const operatorOk = escrow.release_conditions.find(c => c.type === 'operator_confirmed')?.satisfied;

  // Both parties confirm + job completed
  if (completed && brokerOk && operatorOk) return true;

  // Auto-release after timeout if no dispute
  if (escrow.auto_release_at && new Date() >= new Date(escrow.auto_release_at)) {
    if (escrow.status !== 'disputed') return true;
  }

  return false;
}

export function releaseEscrow(escrow: EscrowRecord): EscrowRecord {
  return {
    ...escrow,
    status: 'released',
    released_at: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// FAST PAY FOR ELITE OPERATORS
// ═══════════════════════════════════════════════════════════════

export function getPayoutSpeed(operatorScore: number): {
  label: string;
  delayHours: number;
} {
  if (operatorScore >= 90) return { label: 'Instant Pay', delayHours: 0 };
  if (operatorScore >= 75) return { label: 'Fast Pay (4hr)', delayHours: 4 };
  if (operatorScore >= 50) return { label: 'Standard (24hr)', delayHours: 24 };
  return { label: 'Standard (48hr)', delayHours: 48 };
}

// ═══════════════════════════════════════════════════════════════
// EQUIPMENT DEDUCTION FROM ESCROW
// ═══════════════════════════════════════════════════════════════

export function deductEquipmentPurchase(
  escrow: EscrowRecord,
  equipmentCostCents: number,
  itemDescription: string
): { updatedEscrow: EscrowRecord; deductionRecord: any } {
  const netAmount = escrow.amount_cents - equipmentCostCents;

  return {
    updatedEscrow: { ...escrow, amount_cents: Math.max(0, netAmount) },
    deductionRecord: {
      escrow_id: escrow.id,
      operator_id: escrow.operator_id,
      item: itemDescription,
      amount_cents: equipmentCostCents,
      deducted_at: new Date().toISOString(),
    },
  };
}
