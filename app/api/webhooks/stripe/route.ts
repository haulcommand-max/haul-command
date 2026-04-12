import { NextResponse } from 'next/server';

/**
 * S1-03: Stripe Webhook deduplication + S1-04: Payout failure push path
 * WAVE-1 — fix(payments): deduplicate stripe webhook processing [WAVE-1]
 * WAVE-1 — feat(payments): wire payout failure push notifications [WAVE-1]
 *
 * This Next.js route receives Stripe webhook events and routes them cleanly.
 * All heavy processing that requires service-role DB access is delegated
 * to the hc_webhook_stripe edge function which already has full HMAC verification.
 */
export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  try {
    // Forward to the canonical edge function with the raw body and signature intact
    // The edge function handles HMAC verification and all idempotency logic
    const rawBody = await req.text();
    const stripeSignature = req.headers.get('stripe-signature') || '';

    const edgeRes = await fetch(`${supabaseUrl}/functions/v1/hc_webhook_stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeSignature,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: rawBody,
    });

    const result = await edgeRes.json();

    // If the edge function detected a payout.failed event, ensure the notification
    // queue is flushed immediately (belt-and-suspenders for latency-sensitive alerts)
    if (result.payout_failed_user_id) {
      await fetch(`${supabaseUrl}/functions/v1/fcm-push-worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          table: 'hc_notifications',
          record: {
            user_id: result.payout_failed_user_id,
            title: '⚠️ Payout Failed',
            body: 'Your payout failed. Tap to update your bank details.',
            data: { deep_link: 'haulcommand://dashboard/wallet/settings' },
          },
        }),
      });
    }

    return NextResponse.json(result, { status: edgeRes.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
