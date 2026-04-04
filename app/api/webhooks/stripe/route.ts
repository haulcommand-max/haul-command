import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession;
    const slotId = session.metadata?.adgrid_slot_id;

    if (slotId) {
      // Activate the AdGrid slot
      await supabase
        .from('hc_adgrid_slots')
        .update({
          status: 'active',
          stripe_product_id: session.line_items?.[0]?.price?.product as string ?? null,
          advertiser_email: session.customer_details?.email ?? null,
          advertiser_name: session.customer_details?.name ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', slotId);
    }
  }

  return NextResponse.json({ received: true });
}
