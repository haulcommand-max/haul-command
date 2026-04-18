import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' as any });

export async function POST(req: NextRequest) {
  try {
    const { originState, destinationState, width, height, weight, email } = await req.json();

    // Fast-path expedite fee logic
    // For MVP, flat $150 concierge expedite fee
    const expediteFeeCents = 15000;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: expediteFeeCents,
          product_data: {
            name: `Expedited Oversize Load Permit`,
            description: `Route: ${originState || 'Origin'} to ${destinationState || 'Destination'} — Dimensions: ${width}w x ${height}h x ${weight}lbs. Includes state DOT fast-track processing.`,
          },
        },
        quantity: 1,
      }],
      metadata: { 
        type: 'permit_expedite',
        origin: originState,
        destination: destinationState,
        width,
        height,
        weight 
      },
      customer_email: email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com'}/permits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com'}/permits`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 500 });
  }
}
