// lib/marketplace/booking-payment.ts
//
// P0 Gap #1 + #2: Stripe charge at booking + payout placeholder
// Revenue flow: authorize on booking → capture on completion → payout ready
// ============================================================

import { getStripeClient, PLATFORM_FEE_BPS, ESCROW_HOLD_DAYS } from '@/lib/stripe/client';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';
import { isEnabled } from '@/lib/feature-flags';

// ── Types ──

export interface ChargeResult {
  success: boolean;
  payment_intent_id?: string;
  client_secret?: string;
  error?: string;
}

export interface PayoutRecord {
  payout_id: string;
  operator_id: string;
  amount_cents: number;
  status: string;
}

// ── GAP #1: Create Stripe PaymentIntent at Booking ──

export async function createBookingCharge(params: {
  job_id: string;
  request_id: string;
  broker_id?: string;
  total_rate_cents: number;
  currency: string;
  escort_ids: string[];
  country_code: string;
}): Promise<ChargeResult> {
  if (!isEnabled('STRIPE')) {
    return { success: false, error: 'Stripe disabled' };
  }

  const stripe = getStripeClient();
  const supabase = getSupabaseAdmin();

  try {
    // Calculate platform fee
    const platformFeeCents = Math.round(params.total_rate_cents * PLATFORM_FEE_BPS / 10000);
    const netPayoutCents = params.total_rate_cents - platformFeeCents;

    // Look up broker's Stripe customer ID
    let stripeCustomerId: string | undefined;
    if (params.broker_id) {
      const { data: bc } = await supabase
        .from('billing_customers')
        .select('stripe_customer_id')
        .eq('user_id', params.broker_id)
        .maybeSingle();
      stripeCustomerId = bc?.stripe_customer_id ?? undefined;
    }

    // Create PaymentIntent — authorize but don't capture yet
    // Capture happens on job completion
    const pi = await stripe.paymentIntents.create({
      amount: params.total_rate_cents,
      currency: params.currency.toLowerCase(),
      capture_method: 'manual', // hold until job completion
      customer: stripeCustomerId,
      metadata: {
        job_id: params.job_id,
        request_id: params.request_id,
        broker_id: params.broker_id ?? '',
        escort_ids: params.escort_ids.join(','),
        country_code: params.country_code,
        platform_fee_cents: String(platformFeeCents),
        net_payout_cents: String(netPayoutCents),
        source: 'haul_command_booking',
      },
      description: `Haul Command booking ${params.job_id}`,
      // If broker has no Stripe customer, they'll need to pay via link
      ...(stripeCustomerId ? {} : {
        payment_method_types: ['card', 'link'],
      }),
    });

    // Update job with payment info
    await supabase
      .from('jobs')
      .update({
        stripe_payment_intent_id: pi.id,
        payment_status: 'authorized',
        platform_fee_cents: platformFeeCents,
        net_payout_cents: netPayoutCents,
      })
      .eq('job_id', params.job_id);

    return {
      success: true,
      payment_intent_id: pi.id,
      client_secret: pi.client_secret ?? undefined,
    };
  } catch (err: any) {
    console.error('[BookingPayment] PaymentIntent creation failed:', err.message);

    // Still let the job proceed — payment can be retried
    await supabase
      .from('jobs')
      .update({ payment_status: 'failed' })
      .eq('job_id', params.job_id);

    return { success: false, error: err.message };
  }
}

// ── GAP #6 (payment part): Capture payment on job completion ──

export async function captureBookingPayment(job_id: string): Promise<ChargeResult> {
  if (!isEnabled('STRIPE')) {
    return { success: false, error: 'Stripe disabled' };
  }

  const stripe = getStripeClient();
  const supabase = getSupabaseAdmin();

  // Get the PaymentIntent ID from the job
  const { data: job } = await supabase
    .from('jobs')
    .select('stripe_payment_intent_id, payment_status')
    .eq('job_id', job_id)
    .single();

  if (!job?.stripe_payment_intent_id) {
    return { success: false, error: 'No PaymentIntent on this job' };
  }

  if (job.payment_status === 'captured') {
    return { success: true, payment_intent_id: job.stripe_payment_intent_id };
  }

  try {
    const pi = await stripe.paymentIntents.capture(job.stripe_payment_intent_id);

    await supabase
      .from('jobs')
      .update({
        payment_status: 'captured',
        stripe_charge_id: pi.latest_charge as string ?? null,
      })
      .eq('job_id', job_id);

    return { success: true, payment_intent_id: pi.id };
  } catch (err: any) {
    console.error('[BookingPayment] Capture failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ── GAP #2: Payout placeholder ──
// Phase 1: Record payout-ready state. Admin processes manually via Stripe dashboard.
// Phase 2 (future): Auto-create Stripe Transfer when Connect is configured.

export async function createPayoutRecords(job_id: string): Promise<PayoutRecord[]> {
  const supabase = getSupabaseAdmin();

  const { data: job } = await supabase
    .from('jobs')
    .select('job_id, assigned_escort_ids, agreed_rate_total, currency, platform_fee_cents, net_payout_cents')
    .eq('job_id', job_id)
    .single();

  if (!job) return [];

  const escorts: string[] = (job as any).assigned_escort_ids ?? [];
  const totalNet = (job as any).net_payout_cents ?? 0;
  const perEscortCents = Math.floor(totalNet / Math.max(escorts.length, 1));
  const currency = (job as any).currency ?? 'USD';

  const records: PayoutRecord[] = [];

  for (const escort_id of escorts) {
    const { data: payout } = await supabase
      .from('job_payouts')
      .insert({
        job_id,
        operator_id: escort_id,
        amount_cents: perEscortCents,
        currency,
        platform_fee_cents: Math.floor((job as any).platform_fee_cents / escorts.length),
        status: 'payout_ready',
      })
      .select('payout_id, operator_id, amount_cents, status')
      .single();

    if (payout) records.push(payout as any);
  }

  // Mark job as payout-ready
  await supabase
    .from('jobs')
    .update({ payout_status: 'payout_ready' })
    .eq('job_id', job_id);

  return records;
}

// ── Refund on cancellation ──

export async function cancelBookingPayment(job_id: string, reason: string): Promise<ChargeResult> {
  if (!isEnabled('STRIPE')) {
    return { success: false, error: 'Stripe disabled' };
  }

  const stripe = getStripeClient();
  const supabase = getSupabaseAdmin();

  const { data: job } = await supabase
    .from('jobs')
    .select('stripe_payment_intent_id, payment_status')
    .eq('job_id', job_id)
    .single();

  if (!job?.stripe_payment_intent_id) {
    return { success: false, error: 'No PaymentIntent on this job' };
  }

  try {
    if (job.payment_status === 'authorized') {
      // Cancel the uncaptured hold
      await stripe.paymentIntents.cancel(job.stripe_payment_intent_id, {
        cancellation_reason: 'requested_by_customer',
      });
    } else if (job.payment_status === 'captured') {
      // Refund the captured charge
      await stripe.refunds.create({
        payment_intent: job.stripe_payment_intent_id,
        reason: 'requested_by_customer',
        metadata: { job_id, cancel_reason: reason },
      });
    }

    await supabase
      .from('jobs')
      .update({
        payment_status: job.payment_status === 'captured' ? 'refunded' : 'cancelled',
        status: 'cancelled',
      })
      .eq('job_id', job_id);

    return { success: true, payment_intent_id: job.stripe_payment_intent_id };
  } catch (err: any) {
    console.error('[BookingPayment] Cancel/refund failed:', err.message);
    return { success: false, error: err.message };
  }
}
