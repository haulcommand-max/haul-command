import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' as any });

export async function POST(req: NextRequest) {
  try {
    const { jobId, operatorId, priceCents, description } = await req.json();
    if (!jobId || !priceCents) {
      return NextResponse.json({ error: 'jobId and priceCents required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: priceCents,
          product_data: {
            name: `Emergency Fill: Job ${jobId}`,
            description: description || 'Emergency escort fill dispatch fee',
          },
        },
        quantity: 1,
      }],
      metadata: { jobId, operatorId: operatorId || '', type: 'emergency_fill' },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com'}/emergency/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com'}/emergency`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 500 });
  }
}
