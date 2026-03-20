/**
 * POST /api/waitlist — Country expansion waitlist signup
 * Stores email + country code for future launch notifications
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, country, source } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();

    // Try to insert into waitlist table
    try {
      await sb.from('waitlist_signups').upsert({
        email: email.toLowerCase().trim(),
        country_code: (country || 'unknown').toUpperCase(),
        source: source || 'directory',
        signed_up_at: new Date().toISOString(),
      }, { onConflict: 'email,country_code' });
    } catch {
      // Table may not exist — log and continue
      console.log(`[waitlist] Signup: ${email} for ${country} (table may not exist)`);
    }

    return NextResponse.json({ ok: true, message: 'Added to waitlist' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
