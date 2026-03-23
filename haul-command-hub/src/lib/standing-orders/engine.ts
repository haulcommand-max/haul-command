/**
 * Standing Orders Engine
 *
 * Core business logic for recurring escort scheduling.
 * Shared between API routes and cron jobs.
 */

// ─── Types ───────────────────────────────────────────────────

export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
export type ScheduleStatus = 'pending_funding' | 'active' | 'paused' | 'completed' | 'cancelled';
export type OccurrenceStatus = 'scheduled' | 'dispatched' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'compliance_hold';

export interface ScheduleInput {
  brokerId: string;
  title: string;
  originJurisdiction: string;
  destinationJurisdiction: string;
  corridorSlug?: string;
  loadType: string;
  loadDimensions?: Record<string, unknown>;
  ratePerOccurrence: number;
  frequency: Frequency;
  daysOfWeek?: number[];
  startDate: string;        // ISO date
  endDate?: string;         // ISO date
  preferredOperatorId?: string;
  priorityDispatch?: boolean;
  scheduledTime?: string;    // HH:MM
}

export interface OccurrenceDate {
  date: string;
  number: number;
}

// ─── Pricing Constants ───────────────────────────────────────

export const PLATFORM_FEE_PERCENT = 5;     // 5% of each occurrence
export const PRIORITY_DISPATCH_FEE = 15;   // $15 per occurrence
export const CANCELLATION_TIERS = [
  { maxHoursBefore: 24, feePercent: 10 },  // <24h = 10%
  { maxHoursBefore: 48, feePercent: 5 },   // 24-48h = 5%
  { maxHoursBefore: Infinity, feePercent: 0 }, // 48h+ = free
];
export const NO_SHOW_KILL_FEE_PERCENT = 25;  // 25% to original operator
export const NO_SHOW_REPLACEMENT_PERCENT = 75; // 75% held for replacement

// ─── Occurrence Generation ───────────────────────────────────

export function generateOccurrences(input: ScheduleInput): OccurrenceDate[] {
  const occurrences: OccurrenceDate[] = [];
  const start = new Date(input.startDate + 'T00:00:00Z');
  const end = input.endDate ? new Date(input.endDate + 'T23:59:59Z') : null;

  // Max 365 occurrences as safety limit
  const maxOccurrences = 365;
  let current = new Date(start);
  let num = 1;

  while (num <= maxOccurrences) {
    if (end && current > end) break;

    const shouldInclude = shouldIncludeDate(current, input.frequency, input.daysOfWeek);

    if (shouldInclude) {
      occurrences.push({
        date: current.toISOString().split('T')[0],
        number: num,
      });
      num++;
    }

    // Advance to next candidate date
    current = advanceDate(current, input.frequency, input.daysOfWeek);

    // Safety: if no end date and we generated enough, stop
    if (!end && occurrences.length >= 52) break; // default ~1 year of weekly
  }

  return occurrences;
}

function shouldIncludeDate(date: Date, frequency: Frequency, daysOfWeek?: number[]): boolean {
  if (frequency === 'daily') return true;

  if (frequency === 'weekly' || frequency === 'custom') {
    const dow = date.getUTCDay();
    return daysOfWeek?.includes(dow) ?? (dow >= 1 && dow <= 5); // default weekdays
  }

  return true; // biweekly/monthly handled by advanceDate
}

function advanceDate(date: Date, frequency: Frequency, daysOfWeek?: number[]): Date {
  const next = new Date(date);

  switch (frequency) {
    case 'daily':
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case 'weekly':
    case 'custom':
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case 'biweekly':
      next.setUTCDate(next.getUTCDate() + 14);
      break;
    case 'monthly':
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
  }

  return next;
}

// ─── Escrow Calculation ──────────────────────────────────────

export function calculateEscrow(ratePerOccurrence: number, totalOccurrences: number, priorityDispatch: boolean): {
  subtotal: number;
  platformFees: number;
  priorityFees: number;
  totalEscrow: number;
} {
  const subtotal = ratePerOccurrence * totalOccurrences;
  const platformFees = Math.round(subtotal * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
  const priorityFees = priorityDispatch ? PRIORITY_DISPATCH_FEE * totalOccurrences : 0;
  const totalEscrow = Math.round((subtotal + platformFees + priorityFees) * 100) / 100;

  return { subtotal, platformFees, priorityFees, totalEscrow };
}

// ─── Cancellation Fee Calculation ────────────────────────────

export function calculateCancellationFee(
  escrowAmount: number,
  scheduledDate: string,
  scheduledTime: string,
  cancelledAt: Date,
): { feePercent: number; feeAmount: number; refundAmount: number } {
  const scheduled = new Date(`${scheduledDate}T${scheduledTime || '06:00'}:00Z`);
  const hoursBefore = (scheduled.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60);

  let feePercent = 0;
  for (const tier of CANCELLATION_TIERS) {
    if (hoursBefore < tier.maxHoursBefore) {
      feePercent = tier.feePercent;
      break;
    }
  }

  const feeAmount = Math.round(escrowAmount * (feePercent / 100) * 100) / 100;
  const refundAmount = Math.round((escrowAmount - feeAmount) * 100) / 100;

  return { feePercent, feeAmount, refundAmount };
}

// ─── No-Show Fee Split ───────────────────────────────────────

export function calculateNoShowSplit(escrowAmount: number): {
  killFee: number;
  replacementHold: number;
} {
  const killFee = Math.round(escrowAmount * (NO_SHOW_KILL_FEE_PERCENT / 100) * 100) / 100;
  const replacementHold = Math.round(escrowAmount * (NO_SHOW_REPLACEMENT_PERCENT / 100) * 100) / 100;
  return { killFee, replacementHold };
}

// ─── Per-Occurrence Breakdown ────────────────────────────────

export function occurrenceBreakdown(ratePerOccurrence: number, priorityDispatch: boolean): {
  escrowAmount: number;
  platformFee: number;
  priorityFee: number;
  operatorPayout: number;
} {
  const platformFee = Math.round(ratePerOccurrence * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
  const priorityFee = priorityDispatch ? PRIORITY_DISPATCH_FEE : 0;
  const operatorPayout = Math.round((ratePerOccurrence - platformFee) * 100) / 100;
  const escrowAmount = Math.round((ratePerOccurrence + platformFee + priorityFee) * 100) / 100;

  return { escrowAmount, platformFee, priorityFee, operatorPayout };
}

// ─── Simple Compliance Check (seeded) ────────────────────────

const HOLIDAY_BLACKOUTS: Record<string, string[]> = {
  'US': ['2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25', '2026-07-04', '2026-09-07', '2026-11-26', '2026-11-27', '2026-12-25'],
  'CA': ['2026-01-01', '2026-02-16', '2026-04-03', '2026-05-18', '2026-07-01', '2026-09-07', '2026-10-12', '2026-12-25', '2026-12-26'],
  'AU': ['2026-01-01', '2026-01-26', '2026-04-03', '2026-04-06', '2026-04-25', '2026-06-08', '2026-12-25', '2026-12-26'],
  'GB': ['2026-01-01', '2026-04-03', '2026-04-06', '2026-05-04', '2026-05-25', '2026-08-31', '2026-12-25', '2026-12-28'],
};

export function checkComplianceFlags(
  originJurisdiction: string,
  occurrenceDates: string[],
): Array<{ date: string; flag: string; severity: 'warning' | 'critical' }> {
  const flags: Array<{ date: string; flag: string; severity: 'warning' | 'critical' }> = [];
  const countryCode = originJurisdiction.length === 2 ? originJurisdiction.toUpperCase() : (originJurisdiction.split('-')[0]?.toUpperCase() ?? 'US');
  const holidays = HOLIDAY_BLACKOUTS[countryCode] ?? HOLIDAY_BLACKOUTS['US'];

  for (const date of occurrenceDates) {
    // Check holiday blackouts
    if (holidays.includes(date)) {
      flags.push({
        date,
        flag: `Holiday blackout — most jurisdictions restrict oversize movement`,
        severity: 'critical',
      });
    }

    // Check weekend restrictions (many states restrict Sat/Sun movement)
    const dayOfWeek = new Date(date + 'T12:00:00Z').getUTCDay();
    if (dayOfWeek === 0) {
      flags.push({
        date,
        flag: `Sunday — some jurisdictions restrict oversize movement`,
        severity: 'warning',
      });
    }
  }

  return flags;
}
