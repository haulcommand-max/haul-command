import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

/**
 * POST /api/alerts
 * 
 * Accept alert signup submissions.
 * Body: { email, alertType, contextKey, countrySlug?, corridorSlug?, serviceSlug?, tier? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, alertType, contextKey, countrySlug, corridorSlug, serviceSlug, tier } = body;

    if (!email || !alertType || !contextKey) {
      return NextResponse.json({ error: 'Missing required fields: email, alertType, contextKey' }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const sb = supabaseServer();

    // Check for duplicate
    const { data: existing } = await sb
      .from('hc_alert_signups')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .eq('context_key', contextKey)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already subscribed', id: existing.id });
    }

    // Insert
    const { data, error } = await sb
      .from('hc_alert_signups')
      .insert({
        email: email.toLowerCase().trim(),
        alert_type: alertType,
        context_key: contextKey,
        country_slug: countrySlug ?? null,
        corridor_slug: corridorSlug ?? null,
        service_slug: serviceSlug ?? null,
        tier: tier ?? 'free',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Alert signup error:', error);
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id, tier: tier ?? 'free' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
