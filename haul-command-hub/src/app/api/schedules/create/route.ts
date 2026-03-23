/**
 * POST /api/schedules/create
 *
 * Standing Orders — Broker creates a recurring escort schedule.
 * Calculates total escrow, generates all occurrences, creates Stripe checkout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { captureError } from '@/lib/monitoring/error';
import {
  generateOccurrences,
  calculateEscrow,
  occurrenceBreakdown,
  checkComplianceFlags,
  type ScheduleInput,
} from '@/lib/standing-orders/engine';
import Stripe from 'stripe';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2026-02-25.clover' });
  }
  return _stripe;
}

export async function POST(request: NextRequest) {
  try {
    const body: ScheduleInput = await request.json();

    // Validate required fields
    if (!body.brokerId || !body.title || !body.originJurisdiction || !body.destinationJurisdiction || !body.loadType || !body.ratePerOccurrence || !body.frequency || !body.startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (body.ratePerOccurrence < 50) {
      return NextResponse.json({ error: 'Minimum rate is $50 per occurrence' }, { status: 400 });
    }

    // Generate all occurrence dates
    const occurrences = generateOccurrences(body);

    if (occurrences.length === 0) {
      return NextResponse.json({ error: 'No valid occurrence dates generated. Check your frequency and date range.' }, { status: 400 });
    }

    // Calculate total escrow required
    const escrow = calculateEscrow(body.ratePerOccurrence, occurrences.length, body.priorityDispatch ?? false);
    const perOccurrence = occurrenceBreakdown(body.ratePerOccurrence, body.priorityDispatch ?? false);

    // Run compliance check
    const complianceFlags = checkComplianceFlags(
      body.originJurisdiction,
      occurrences.map(o => o.date),
    );

    const sb = supabaseServer();

    // Create the schedule record
    const { data: schedule, error: scheduleErr } = await sb
      .from('recurring_schedules')
      .insert({
        broker_id: body.brokerId,
        title: body.title,
        origin_jurisdiction: body.originJurisdiction,
        destination_jurisdiction: body.destinationJurisdiction,
        corridor_slug: body.corridorSlug ?? null,
        load_type: body.loadType,
        load_dimensions: body.loadDimensions ?? null,
        rate_per_occurrence: body.ratePerOccurrence,
        frequency: body.frequency,
        days_of_week: body.daysOfWeek ?? null,
        start_date: body.startDate,
        end_date: body.endDate ?? null,
        total_occurrences: occurrences.length,
        preferred_operator_id: body.preferredOperatorId ?? null,
        priority_dispatch: body.priorityDispatch ?? false,
        status: 'pending_funding',
        escrow_balance: 0,
        platform_fee_percent: 5,
        cancellation_fee_percent: 10,
        compliance_flags: complianceFlags,
        next_dispatch_date: occurrences[0]?.date ?? null,
      })
      .select('id')
      .single();

    if (scheduleErr || !schedule) {
      return NextResponse.json({ error: scheduleErr?.message ?? 'Failed to create schedule' }, { status: 500 });
    }

    // Create all occurrence records
    const occurrenceRecords = occurrences.map(o => ({
      schedule_id: schedule.id,
      occurrence_number: o.number,
      scheduled_date: o.date,
      scheduled_time: body.scheduledTime ?? '06:00',
      status: 'scheduled',
      escrow_amount: perOccurrence.escrowAmount,
      platform_fee: perOccurrence.platformFee,
      operator_payout: perOccurrence.operatorPayout,
      priority_fee: perOccurrence.priorityFee,
      compliance_flags: complianceFlags.filter(f => f.date === o.date),
    }));

    await sb.from('schedule_occurrences').insert(occurrenceRecords);

    // Create Stripe Checkout session for pre-funding
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(escrow.totalEscrow * 100),
          product_data: {
            name: `Standing Order: ${body.title}`,
            description: `${occurrences.length} occurrences × $${body.ratePerOccurrence}/run — ${body.originJurisdiction} → ${body.destinationJurisdiction}`,
          },
        },
        quantity: 1,
      }],
      metadata: {
        type: 'standing_order_prefund',
        schedule_id: schedule.id,
        broker_id: body.brokerId,
        total_occurrences: String(occurrences.length),
        escrow_amount: String(escrow.totalEscrow),
      },
      success_url: `${siteUrl}/schedules/dashboard?funded=${schedule.id}`,
      cancel_url: `${siteUrl}/schedules/create?cancelled=true`,
    });

    // Create prefunding record
    await sb.from('schedule_prefunding').insert({
      schedule_id: schedule.id,
      amount: escrow.totalEscrow,
      stripe_checkout_session_id: session.id,
      funding_type: 'initial',
      status: 'pending',
    });

    return NextResponse.json({
      scheduleId: schedule.id,
      checkoutUrl: session.url,
      summary: {
        title: body.title,
        route: `${body.originJurisdiction} → ${body.destinationJurisdiction}`,
        frequency: body.frequency,
        totalOccurrences: occurrences.length,
        ratePerOccurrence: body.ratePerOccurrence,
        ...escrow,
        complianceFlags: complianceFlags.length,
        priorityDispatch: body.priorityDispatch ?? false,
      },
    });
  } catch (err) {
    await captureError(err, { route: '/api/schedules/create' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
