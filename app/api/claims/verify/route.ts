import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { finalizeClaimOwnership } from '@/lib/claims/finalize-claim-ownership';
import { sendRoutedNotification } from '@/lib/notifications/channelRouter';

// POST /api/claims/verify
// Verify a claim via claim_token
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { claim_token } = await req.json();

    if (!claim_token) {
      return NextResponse.json({ error: 'claim_token required' }, { status: 400 });
    }

    // Find claim by token
    const { data: claim } = await supabase
      .from('listing_claims')
      .select('id, listing_id, user_id, claim_status')
      .eq('claim_token', claim_token)
      .eq('claim_status', 'pending_verification')
      .single();

    if (!claim) {
      return NextResponse.json({ error: 'Invalid or expired claim token' }, { status: 404 });
    }

    // Mark as verified
    await supabase
      .from('listing_claims')
      .update({
        claim_status: 'verified',
        verified_at: new Date().toISOString(),
      })
      .eq('id', claim.id);

    await finalizeClaimOwnership(supabase, {
      entityId: claim.listing_id,
      userId: claim.user_id,
      source: 'listing_claims token verification',
      primaryTable: 'hc_global_operators',
      metadata: {
        claim_id: claim.id,
        route: '/api/claims/verify',
      },
    });

    // Notify user via Smart Channel Router
    if (claim.user_id) {
      await sendRoutedNotification(claim.user_id, {
        type: 'claim_approval',
        urgency: 'normal',
        title: '\u2713 Listing Verified!',
        body: 'Your listing is now verified. You\u2019ll receive priority placement and load offers.',
        url: `/directory/${claim.listing_id}`
      });
    }

    return NextResponse.json({ status: 'verified', listing_id: claim.listing_id });
  } catch (error: unknown) {
    console.error('Claim verify error:', error);
    const message = error instanceof Error ? error.message : 'Claim verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
