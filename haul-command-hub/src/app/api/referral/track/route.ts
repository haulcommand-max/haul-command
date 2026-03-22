/**
 * POST /api/referral/track
 * Referral Program — $25 credit per converted referral.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const REFERRAL_CREDIT_USD = 25;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referrer_id, referred_email, conversion_type } = body;

    if (!referrer_id || !referred_email) {
      return NextResponse.json({ error: 'referrer_id and referred_email required' }, { status: 400 });
    }

    const sb = supabaseServer();

    // Check for duplicate referral
    const { data: existing } = await sb
      .from('referral_credits')
      .select('id')
      .eq('referrer_id', referrer_id)
      .eq('referred_email', referred_email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Referral already tracked' }, { status: 409 });
    }

    // Track the referral
    const { data, error } = await sb.from('referral_credits').insert({
      referrer_id,
      referred_email,
      credit_usd: REFERRAL_CREDIT_USD,
      conversion_type: conversion_type || 'signup',
      status: 'pending',
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      referral_id: data?.id,
      credit_usd: REFERRAL_CREDIT_USD,
      status: 'pending',
      message: `Referral tracked. $${REFERRAL_CREDIT_USD} credit will be applied when ${referred_email} converts.`,
    });
  } catch (err) {
    console.error('[Referral Track] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/referral/convert
 * Called when a referred user completes signup — credits the referrer.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { referred_email } = body;

    if (!referred_email) {
      return NextResponse.json({ error: 'referred_email required' }, { status: 400 });
    }

    const sb = supabaseServer();

    // Find pending referral
    const { data: referral } = await sb
      .from('referral_credits')
      .select('*')
      .eq('referred_email', referred_email)
      .eq('status', 'pending')
      .maybeSingle();

    if (!referral) {
      return NextResponse.json({ message: 'No pending referral found' });
    }

    // Credit the referrer
    await sb.from('referral_credits').update({
      status: 'credited',
      credited_at: new Date().toISOString(),
    }).eq('id', referral.id);

    // Add to wallet
    await sb.from('hc_pay_ledger').insert({
      user_id: referral.referrer_id,
      type: 'referral_credit',
      amount: referral.credit_usd,
      currency: 'USD',
      reference_id: referral.id,
      description: `Referral credit for ${referred_email}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      status: 'credited',
      referrer_id: referral.referrer_id,
      credit_usd: referral.credit_usd,
    });
  } catch (err) {
    console.error('[Referral Convert] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
