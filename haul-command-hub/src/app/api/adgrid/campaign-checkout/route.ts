/**
 * POST /api/adgrid/campaign-checkout
 *
 * Creates a Stripe checkout session for an AdGrid campaign:
 * - Sponsored listing
 * - Banner ad
 * - Corridor sponsor
 * - Data sponsorship
 *
 * Uses bulk pricing: $25/day standard, $50/day corridor, $100/day data
 */

import { NextRequest, NextResponse } from 'next/server';

const AD_TYPE_RATES: Record<string, number> = {
  sponsored_listing: 25,   // $25/day
  banner: 25,               // $25/day
  corridor_sponsor: 50,     // $50/day
  data_sponsor: 100,        // $100/day
};

export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const body = await request.json();
    const {
      companyName,
      contactEmail,
      adType,
      durationDays,
      targetCorridors,
      targetCountries,
      targetAudience,
    } = body;

    if (!companyName || !contactEmail || !adType || !durationDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // [DUMMY-PROOFING OVERHAUL] Validate Country Tiers
    if (targetCountries && Array.isArray(targetCountries) && targetCountries.length > 0) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      );
      
      const { data: validCountries, error: countryErr } = await supabase
        .from('country_market')
        .select('country_code, payments_pack_status, status')
        .in('country_code', targetCountries.map((c: string) => c.toUpperCase()));
        
      if (countryErr) {
        console.error('[AdGrid] DB Error validating countries:', countryErr);
        return NextResponse.json({ error: 'System error validating market scope' }, { status: 500 });
      }

      const invalid = targetCountries.filter((c: string) => {
        const match = validCountries?.find(vc => vc.country_code === c.toUpperCase());
        // Require the country to be fully live or monetizing
        return !match || (match.status !== 'monetize_now' && match.status !== 'live' && match.payments_pack_status !== 'active');
      });

      if (invalid.length > 0) {
        return NextResponse.json({ 
          error: `The following markets are not yet cleared for monetization: ${invalid.join(', ')}` 
        }, { status: 403 });
      }
    }

    const dailyRate = AD_TYPE_RATES[adType] ?? 25;
    const totalAmount = dailyRate * (durationDays || 30);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';

    // Create a Stripe checkout session for the campaign
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', `${siteUrl}/advertise/dashboard?campaign_created=true&session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${siteUrl}/advertise/create?error=cancelled`);
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', `AdGrid ${adType.replace(/_/g, ' ')} — ${durationDays} days`);
    params.append('line_items[0][price_data][product_data][description]', `${companyName} campaign on Haul Command`);
    params.append('line_items[0][price_data][unit_amount]', (totalAmount * 100).toString()); // cents
    params.append('line_items[0][quantity]', '1');
    params.append('customer_email', contactEmail);
    params.append('metadata[type]', 'adgrid_campaign');
    params.append('metadata[company_name]', companyName);
    params.append('metadata[ad_type]', adType);
    params.append('metadata[duration_days]', String(durationDays));
    params.append('metadata[target_corridors]', JSON.stringify(targetCorridors ?? []));
    params.append('metadata[target_countries]', JSON.stringify(targetCountries ?? []));
    params.append('metadata[target_audience]', targetAudience ?? 'both');

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('[AdGrid] Stripe error:', session);
      return NextResponse.json({ error: session.error?.message ?? 'Stripe error' }, { status: 500 });
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      totalAmount,
      dailyRate,
      durationDays,
    });
  } catch (err) {
    console.error('[AdGrid Campaign Checkout] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
