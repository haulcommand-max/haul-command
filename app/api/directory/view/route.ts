import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { evaluatePaywall } from '@/lib/data/paywall-engine';

export const dynamic = 'force-dynamic';

/**
 * POST /api/directory/view — Log a profile view + paywall-gate contact reveal.
 *
 * Money OS wiring:
 * - Checks evaluatePaywall('contact_reveal') before returning contact info
 * - Logs view to directory_views for trust scoring
 */
export async function POST(req: Request) {
  try {
    const { profileId, viewerId, revealContact, countryCode } = await req.json();

    if (!profileId) {
      return Response.json({ error: 'Missing profileId' }, { status: 400 });
    }

    // Don't log self-views
    if (profileId === viewerId) {
      return Response.json({ success: true, ignored: true });
    }

    const supabase = getSupabaseAdmin();
    const viewerIp = req.headers.get('x-forwarded-for') || 'unknown';

    // Log the view
    const { error } = await supabase.from('directory_views').insert({
      profile_id: profileId,
      viewer_id: viewerId || null,
      viewer_ip: viewerId ? null : viewerIp,
    });

    if (error && error.code !== '23505') {
      console.error('Failed to log directory view:', error);
    }

    // If contact reveal requested, check paywall
    if (revealContact) {
      const verdict = await evaluatePaywall(
        viewerId || null,
        'contact_reveal',
        countryCode
      );

      if (!verdict.allowed) {
        return Response.json({
          success: true,
          view_logged: true,
          contact_revealed: false,
          paywall: {
            reason: verdict.reason,
            upgrade_url: verdict.upgrade_url,
            price_hint: verdict.price_hint,
          },
        });
      }

      // Paywall passed — fetch and return contact details
      const { data: profile } = await supabase
        .from('hc_global_operators')
        .select('phone_number, email, website')
        .eq('id', profileId)
        .single();

      return Response.json({
        success: true,
        view_logged: true,
        contact_revealed: true,
        contact: profile ? {
          phone: profile.phone_number,
          email: profile.email,
          website: profile.website,
        } : null,
      });
    }

    return Response.json({ success: true, view_logged: true });
  } catch (err) {
    console.error('Directory view API error:', err);
    return Response.json({ success: false }, { status: 500 });
  }
}
