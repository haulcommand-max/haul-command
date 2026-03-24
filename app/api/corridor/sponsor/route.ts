import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-18.acacia' as any });

// POST /api/corridor/sponsor
// Sponsor a corridor page ($99/month)
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { corridor_slug, listing_id } = await req.json();
    if (!corridor_slug) return NextResponse.json({ error: 'corridor_slug required' }, { status: 400 });

    const pi = await stripe.paymentIntents.create({
      amount: 9900,
      currency: 'usd',
      metadata: {
        type: 'corridor_sponsor',
        corridor_slug,
        listing_id: listing_id || '',
        user_id: user.id,
        platform: 'haul_command',
      },
      description: `Corridor Sponsor — ${corridor_slug} (30 days)`,
    });

    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    await supabase.from('corridor_sponsorships').insert({
      corridor_slug,
      user_id: user.id,
      listing_id: listing_id || null,
      status: 'active',
      expires_at: expiresAt,
      stripe_payment_intent_id: pi.id,
    });

    return NextResponse.json({
      client_secret: pi.client_secret,
      expires_at: expiresAt,
    });
  } catch (error: any) {
    console.error('Corridor sponsor error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
