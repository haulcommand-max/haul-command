import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { 
      full_name, 
      email, 
      phone, 
      company, 
      country_code,
      market_or_region, 
      sponsor_category, 
      budget_range, 
      notes 
    } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    if (!full_name) {
      return NextResponse.json({ error: 'Full name required' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();

    const metadata = {
        phone,
        company,
        country_code,
        market_or_region,
        sponsor_category,
        budget_range,
        notes
    };

    const type_safe = sponsor_category ? String(sponsor_category).replace(/\W/g, '') : 'unknown';
    const country_safe = country_code ? String(country_code).toLowerCase().replace(/\W/g, '_').substring(0, 5) : 'us';
    const market_safe = market_or_region ? String(market_or_region).toLowerCase().replace(/\W/g, '_').substring(0, 20) : 'unknown';
    const safe_source = `sponsor_${type_safe}_${country_safe}_${market_safe}`;

    // Use lead_captures to natively persist sponsor interest without losing multi-market intent
    const { error } = await sb.from('lead_captures').upsert({
      email: email.toLowerCase().trim(),
      name: full_name.trim(),
      source: safe_source,
      country_code: country_code ? String(country_code).toUpperCase().substring(0, 2) : 'US',
      metadata,
    }, { onConflict: 'email,source' });

    if (error) {
        console.error('[sponsor_waitlist] insertion error:', error);
        return NextResponse.json({ error: 'Failed to join waitlist. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Added to sponsor waitlist' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
