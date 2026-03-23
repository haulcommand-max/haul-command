/**
 * POST /api/broker/connect
 * Broker Connect — Revenue Leak #4
 * Brokers pay $29/month to see full contact info, DM operators,
 * and get guaranteed response within 2 hours.
 *
 * GET: Check broker's subscription status
 * POST: Create Stripe checkout for Broker Connect
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const BROKER_CONNECT_PRICE_ID = process.env.STRIPE_BROKER_CONNECT_PRICE_ID || '';

export async function GET(req: NextRequest) {
  const brokerId = req.nextUrl.searchParams.get('broker_id');
  if (!brokerId) {
    return NextResponse.json({ error: 'broker_id required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data: sub } = await db
    .from('broker_subscriptions')
    .select('id, plan, status, expires_at')
    .eq('broker_id', brokerId)
    .eq('status', 'active')
    .single();

  const isConnected = !!sub && new Date(sub.expires_at) > new Date();

  return NextResponse.json({
    connected: isConnected,
    plan: sub?.plan || 'free',
    features: isConnected
      ? {
          fullContactInfo: true,
          directMessage: true,
          responseGuarantee: '2 hours',
          emergencyFillPriority: true,
        }
      : {
          fullContactInfo: false,
          directMessage: false,
          responseGuarantee: null,
          emergencyFillPriority: false,
        },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brokerId, brokerEmail } = body;

    if (!brokerId || !brokerEmail) {
      return NextResponse.json({ error: 'brokerId and brokerEmail required' }, { status: 400 });
    }

    // Create Stripe checkout session
    const stripe = (await import('stripe')).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-06-20' as any,
    });

    const session = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      customer_email: brokerEmail,
      line_items: [{
        price: BROKER_CONNECT_PRICE_ID,
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://haulcommand.com'}/broker/dashboard?connected=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://haulcommand.com'}/pricing?cancelled=true`,
      metadata: {
        broker_id: brokerId,
        plan: 'broker_connect',
      },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('[BROKER CONNECT ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create checkout' }, { status: 500 });
  }
}
