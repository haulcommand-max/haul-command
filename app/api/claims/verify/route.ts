import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Update directory listing
    await supabase
      .from('directory_listings')
      .update({
        claimed: true,
        claimed_by: claim.user_id,
        verified: true,
      })
      .eq('id', claim.listing_id);

    // Notify user
    if (claim.user_id) {
      await supabase.from('notifications').insert({
        user_id: claim.user_id,
        type: 'system',
        title: '\u2713 Listing Verified!',
        body: 'Your listing is now verified. You\u2019ll receive priority placement and load offers.',
        data: { listing_id: claim.listing_id },
        action_url: `/directory/${claim.listing_id}`,
      });
    }

    return NextResponse.json({ status: 'verified', listing_id: claim.listing_id });
  } catch (error: any) {
    console.error('Claim verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
