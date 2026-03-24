import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/claims/initiate
// Start the claim process for a directory listing
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { listing_id } = await req.json();
    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
    }

    // Check listing exists
    const { data: listing } = await supabase
      .from('directory_listings')
      .select('id, name, company_name, country_code')
      .eq('id', listing_id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Check if already claimed
    const { data: existingClaim } = await supabase
      .from('listing_claims')
      .select('id, claim_status')
      .eq('listing_id', listing_id)
      .in('claim_status', ['pending_verification', 'verified'])
      .maybeSingle();

    if (existingClaim) {
      return NextResponse.json({ error: 'Listing already claimed', status: existingClaim.claim_status }, { status: 409 });
    }

    // Create claim
    const { data: claim, error } = await supabase
      .from('listing_claims')
      .insert({
        listing_id,
        user_id: user.id,
        claim_status: 'pending_verification',
        source: 'in_app',
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'system',
      title: 'Claim Started',
      body: `Your claim for ${listing.name || listing.company_name} is pending verification.`,
      data: { listing_id, claim_id: claim.id },
      action_url: `/claim/${claim.id}`,
    });

    return NextResponse.json({ claim });
  } catch (error: any) {
    console.error('Claim initiate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
