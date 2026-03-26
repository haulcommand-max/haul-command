import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' as any });

export async function POST(req: NextRequest) {
  try {
    const { courseId, courseName, priceInCents, userId, email } = await req.json();
    if (!courseId || !priceInCents) {
      return NextResponse.json({ error: 'courseId and priceInCents required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: priceInCents,
          product_data: {
            name: courseName || `Training: ${courseId}`,
            description: 'Haul Command Training Academy enrollment',
          },
        },
        quantity: 1,
      }],
      metadata: { courseId, userId: userId || '', type: 'training_enrollment' },
      customer_email: email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com'}/training/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com'}/training`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 500 });
  }
}
