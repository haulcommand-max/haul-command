/**
 * POST /api/stripe/webhook
 *
 * Unified Stripe webhook handler.
 * Handles ALL payment types:
 *  - Subscription checkout (basic/pro/elite/broker)
 *  - One-time payments (load boost, emergency fill, training)
 *  - Corridor/port sponsorships
 *  - Subscription lifecycle (created, updated, deleted)
 *  - Invoice events (payment succeeded, failed)
 *  - Payment intent events (for escrow/transfers)
 *
 * Signature verification via STRIPE_WEBHOOK_SECRET env var.
 * Falls back to unverified in dev mode when secret is not set.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// ═══════════════════════════════════════════════════════════════
// Stripe Signature Verification (raw, no SDK needed)
// ═══════════════════════════════════════════════════════════════

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  try {
    const parts = sigHeader.split(',').reduce((acc, part) => {
      const [key, val] = part.split('=');
      if (key === 't') acc.timestamp = val;
      if (key === 'v1') acc.signatures.push(val);
      return acc;
    }, { timestamp: '', signatures: [] as string[] });

    if (!parts.timestamp || parts.signatures.length === 0) return false;

    // Check timestamp tolerance (5 minutes)
    const tolerance = 300;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(parts.timestamp)) > tolerance) return false;

    const signedPayload = `${parts.timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const computedHex = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return parts.signatures.some((expected) => {
      if (expected.length !== computedHex.length) return false;
      let result = 0;
      for (let i = 0; i < computedHex.length; i++) {
        result |= computedHex.charCodeAt(i) ^ expected.charCodeAt(i);
      }
      return result === 0;
    });
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// Event Handler
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Verify signature if secret is set
    if (webhookSecret) {
      if (!sig) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
      }
      const valid = await verifyStripeSignature(body, sig, webhookSecret);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const sb = supabaseServer();

    // Dedup via idempotency — check if already processed
    const eventId = event.id;
    if (eventId) {
      const { data: existing } = await sb
        .from('stripe_webhook_events')
        .select('id')
        .eq('stripe_event_id', eventId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ received: true, dedup: true });
      }

      // Log the event (non-blocking — table may not exist yet)
      try {
        await sb.from('stripe_webhook_events').insert({
          stripe_event_id: eventId,
          event_type: event.type,
          payload: event.data?.object,
          processed: false,
        });
      } catch { /* table may not exist yet */ }
    }

    // ─── Route by event type ──────────────────────────────────

    switch (event.type) {

      // ── Checkout Completed ──────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const type = metadata.type || 'subscription_checkout';
        const operatorId = metadata.operator_id;
        const plan = metadata.plan ?? 'pro';

        if (type === 'subscription_checkout' && operatorId && operatorId !== 'unknown') {
          await sb.from('hc_places').update({
            subscription_status: 'active',
            plan,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          }).eq('id', operatorId);
          console.log(`✅ Subscription activated: operator=${operatorId} plan=${plan}`);
        }

        if (type === 'corridor_sponsor') {
          const corridorSlug = metadata.corridor_slug;
          if (corridorSlug) {
            try {
              await sb.from('corridor_sponsors').upsert({
                corridor_slug: corridorSlug,
                stripe_customer_id: session.customer,
                stripe_subscription_id: session.subscription,
                status: 'active',
                activated_at: new Date().toISOString(),
              }, { onConflict: 'corridor_slug' });
            } catch { /* non-blocking */ }
            console.log(`✅ Corridor sponsor activated: ${corridorSlug}`);
          }
        }

        if (type === 'emergency_fill') {
          const loadId = metadata.load_id;
          console.log(`✅ Emergency fill paid: load=${loadId}`);
          // Future: dispatch emergency fill workflow
        }

        if (type === 'training_enrollment') {
          const courseId = metadata.course_id;
          console.log(`✅ Training enrollment: course=${courseId}`);
          // Future: grant training access
        }

        break;
      }

      // ── Subscription Created ────────────────────────────────
      case 'customer.subscription.created': {
        const sub = event.data.object;
        const plan = sub.metadata?.plan ?? 'pro';
        console.log(`📦 Subscription created: sub=${sub.id} plan=${plan}`);
        break;
      }

      // ── Subscription Updated ────────────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const customerId = sub.customer;
        const status = sub.status;

        const planStatus = status === 'active' ? 'active'
          : status === 'past_due' ? 'past_due'
          : status === 'canceled' ? 'cancelled'
          : status === 'unpaid' ? 'past_due'
          : 'active';

        await sb.from('hc_places').update({
          subscription_status: planStatus,
        }).eq('stripe_customer_id', customerId);

        console.log(`🔄 Subscription updated: customer=${customerId} status=${planStatus}`);
        break;
      }

      // ── Subscription Deleted ────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customerId = sub.customer;

        await sb.from('hc_places').update({
          subscription_status: 'cancelled',
          plan: 'free',
        }).eq('stripe_customer_id', customerId);

        // Also deactivate corridor sponsors
        try {
          await sb.from('corridor_sponsors').update({
            status: 'cancelled',
          }).eq('stripe_subscription_id', sub.id);
        } catch { /* non-blocking */ }

        console.log(`🚫 Subscription cancelled: customer=${customerId}`);
        break;
      }

      // ── Invoice Payment Succeeded ───────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`💰 Invoice paid: ${invoice.id} amount=${invoice.amount_paid}`);
        break;
      }

      // ── Invoice Payment Failed ──────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        await sb.from('hc_places').update({
          subscription_status: 'past_due',
        }).eq('stripe_customer_id', customerId);

        console.log(`⚠️ Payment failed: customer=${customerId}`);
        break;
      }

      // ── Payment Intent Events (Escrow) ──────────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        console.log(`💳 Payment succeeded: ${pi.id} amount=${pi.amount}`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    // Mark as processed
    if (eventId) {
      try {
        await sb.from('stripe_webhook_events').update({
          processed: true,
          processed_at: new Date().toISOString(),
        }).eq('stripe_event_id', eventId);
      } catch { /* non-blocking */ }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
