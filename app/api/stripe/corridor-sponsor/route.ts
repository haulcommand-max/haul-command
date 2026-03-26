import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' as any });

export async function POST(req: NextRequest) {
  try {
    const { corridorId, corridorName, monthlyPriceCents, userId } = await req.json();
    if (!corridorId || !monthlyPriceCents) {
      return NextResponse.json({ error: 'corridorId and monthlyPriceCents required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: monthlyPriceCents,
          recurring: { interval: 'month' },
          product_data: {
            name: `Corridor Sponsorship: ${corridorName || corridorId}`,
            description: 'Monthly corridor sponsorship on Haul Command',
          },
        },
        quantity: 1,
      }],
      metadata: { corridorId, userId: userId || '', type: 'corridor_sponsorship' },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com'}/ads/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com'}/ads`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 500 });
  }
}
