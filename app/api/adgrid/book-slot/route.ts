import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// Stripe price IDs by surface + duration
const PRICE_MAP: Record<string, Record<string, string>> = {
  corridor: {
    '30': process.env.STRIPE_ADGRID_CORRIDOR_30D ?? '',
    '90': process.env.STRIPE_ADGRID_CORRIDOR_90D ?? '',
    '180': process.env.STRIPE_ADGRID_CORRIDOR_180D ?? '',
  },
  country: {
    '30': process.env.STRIPE_ADGRID_COUNTRY_30D ?? '',
    '90': process.env.STRIPE_ADGRID_COUNTRY_90D ?? '',
    '180': process.env.STRIPE_ADGRID_COUNTRY_180D ?? '',
  },
  leaderboard: {
    '30': process.env.STRIPE_ADGRID_LEADERBOARD_30D ?? '',
    '90': process.env.STRIPE_ADGRID_LEADERBOARD_90D ?? '',
    '180': process.env.STRIPE_ADGRID_LEADERBOARD_180D ?? '',
  },
  tool: {
    '30': process.env.STRIPE_ADGRID_TOOL_30D ?? '',
  },
  glossary: {
    '30': process.env.STRIPE_ADGRID_GLOSSARY_30D ?? '',
  },
  data_product: {
    '30': process.env.STRIPE_ADGRID_DATA_PRODUCT_30D ?? '',
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      surface,
      corridor_slug,
      country_code,
      headline,
      subline,
      cta_label,
      cta_href,
      duration_days,
    } = body;

    if (!surface || !headline || !cta_label || !cta_href) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const durationKey = String(duration_days ?? '30');
    const priceId = PRICE_MAP[surface]?.[durationKey];

    // Insert slot as 'pending' — activated on Stripe webhook success
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + (duration_days ?? 30) * 86_400_000);

    const { data: slot, error: insertErr } = await supabase
      .from('hc_adgrid_slots')
      .insert({
        surface,
        corridor_slug: corridor_slug ?? null,
        country_code: country_code ?? null,
        headline,
        subline: subline ?? null,
        cta_label,
        cta_href,
        status: 'paused', // activated by webhook
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        priority_score: 50,
      })
      .select('id')
      .single();

    if (insertErr) throw new Error(insertErr.message);

    // If Stripe price ID exists, create checkout
    if (priceId) {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { adgrid_slot_id: slot.id, surface, corridor_slug: corridor_slug ?? '' },
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/advertise/success?slot=${slot.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/advertise?surface=${surface}`,
      });

      return NextResponse.json({ checkout_url: session.url, slot_id: slot.id });
    }

    // No price ID yet — manual review path
    return NextResponse.json({
      slot_id: slot.id,
      message: 'Slot reserved — our team will contact you to finalize payment.',
    });
  } catch (err: any) {
    console.error('[adgrid/book-slot]', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
