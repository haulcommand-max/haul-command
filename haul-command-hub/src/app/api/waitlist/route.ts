/**
 * POST /api/waitlist
 * 
 * Captures waitlist signups for markets/features not yet live.
 * Stores email + feature context in Supabase waitlist_entries table.
 * Falls back to logging if table doesn't exist.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData().catch(() => null);
    const jsonBody = formData ? null : await request.json().catch(() => null);

    const email = formData?.get('email')?.toString() ?? jsonBody?.email;
    const feature = formData?.get('feature')?.toString() ?? jsonBody?.feature ?? 'general';

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
      
      // Try inserting into waitlist_entries table
      const { error } = await sb.from('waitlist_entries').upsert(
        {
          email: email.toLowerCase().trim(),
          feature,
          source: request.headers.get('referer') ?? 'direct',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'email,feature' }
      );

      if (error) {
        // Table may not exist — log and continue gracefully
        console.warn('[waitlist] Insert error (table may not exist):', error.message);
      }
    }

    // Log for analytics regardless
    console.log(`[waitlist] ${email} → ${feature}`);

    // If this was a form submission, redirect back
    const referer = request.headers.get('referer');
    if (formData && referer) {
      const url = new URL(referer);
      url.searchParams.set('waitlist', 'success');
      return NextResponse.redirect(url.toString(), 303);
    }

    return NextResponse.json({ success: true, message: 'Added to waitlist' });
  } catch (err) {
    console.error('[waitlist] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
