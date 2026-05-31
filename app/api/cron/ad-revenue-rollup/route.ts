/**
 * POST /api/cron/ad-revenue-rollup
 * Daily cron: rolls canonical AdGrid outcomes into hc_revenue_daily_rollup
 * Schedule: "0 1 * * *" (1am UTC every day)
 * Auth: CRON_SECRET header (Vercel Cron)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Roll up yesterday's data by default
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0]; // 'YYYY-MM-DD'

  try {
    const nextDateStr = new Date(yesterday.getTime() + 86400000).toISOString().split('T')[0];
    const { data: outcomes, error } = await supabase
      .from('hc_adgrid_outcome_events')
      .select('outcome_value_cents, billed_amount_cents, billing_status, user_session_id, user_id')
      .gte('fired_at', `${dateStr}T00:00:00Z`)
      .lt('fired_at', `${nextDateStr}T00:00:00Z`);

    if (error) throw error;

    const { data: events, error: eventError } = await supabase
      .from('hc_adgrid_events')
      .select('event_type, billing_amount_cents, session_id')
      .gte('created_at', `${dateStr}T00:00:00Z`)
      .lt('created_at', `${nextDateStr}T00:00:00Z`);

    if (eventError) throw eventError;

    const grossCents = (outcomes || []).reduce(
      (sum, outcome) => sum + (outcome.billed_amount_cents ?? outcome.outcome_value_cents ?? 0),
      0,
    );
    const recoveredPayments = (outcomes || []).filter((outcome) => outcome.billing_status === 'recovered').length;
    const failedPayments = (outcomes || []).filter((outcome) => outcome.billing_status === 'failed').length;
    const uniqueCustomers = new Set(
      (outcomes || [])
        .map((outcome) => outcome.user_id || outcome.user_session_id)
        .filter(Boolean),
    ).size;

    const rollup = {
      rollup_date: dateStr,
      gross_revenue_usd: grossCents / 100,
      refunds_usd: 0,
      net_revenue_usd: grossCents / 100,
      new_subscriptions: 0,
      canceled_subscriptions: 0,
      one_time_purchases: (outcomes || []).length,
      unique_customers: uniqueCustomers,
      failed_payments: failedPayments,
      recovered_payments: recoveredPayments,
      computed_at: new Date().toISOString(),
    };

    const { error: rollupError } = await supabase
      .from('hc_revenue_daily_rollup')
      .upsert(rollup, { onConflict: 'rollup_date' });

    if (rollupError) throw rollupError;

    console.log('[AdRevenue Rollup] Completed:', rollup);

    return NextResponse.json({
      ok:   true,
      date: dateStr,
      result: {
        ...rollup,
        adgrid_events: events?.length ?? 0,
      },
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AdRevenue Rollup] Failed:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// Allow GET for manual trigger from admin
export async function GET(req: NextRequest) {
  // Require admin secret for manual runs
  const adminSecret = process.env.ADMIN_SECRET;
  const provided    = req.headers.get('x-admin-secret');
  if (!adminSecret || provided !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return POST(req);
}
