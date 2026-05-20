import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isPaidTraining, normalizeTrainingCatalogItem } from '@/lib/training/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' as any });

export async function POST(req: NextRequest) {
  try {
    const { courseId, userId, email } = await req.json();
    if (!courseId) {
      return NextResponse.json({ error: 'courseId required' }, { status: 400 });
    }

    const { data, error } = await (getSupabaseAdmin() as any)
      .from('training_catalog')
      .select('id,slug,title,pricing_mode,price_cents,currency,is_active')
      .eq('slug', courseId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Training catalog lookup failed' }, { status: 500 });
    }

    const course = normalizeTrainingCatalogItem(data);
    if (!course) {
      return NextResponse.json({ error: 'Training course not found' }, { status: 404 });
    }

    if (!isPaidTraining(course) || !course.price_cents) {
      return NextResponse.json({ error: 'This training is not configured for paid checkout' }, { status: 409 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: (course.currency || 'USD').toLowerCase(),
          unit_amount: course.price_cents,
          product_data: {
            name: course.title,
            description: 'Haul Command Training Academy enrollment',
          },
        },
        quantity: 1,
      }],
      metadata: { courseId: course.slug, userId: userId || '', type: 'training_enrollment' },
      customer_email: email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com'}/training/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com'}/training`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 500 });
  }
}
