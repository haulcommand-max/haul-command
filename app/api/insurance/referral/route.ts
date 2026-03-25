import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// POST /api/insurance/referral
// Tracks an insurance referral click
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { partner = 'nbis', placement } = body;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Partner affiliate URLs
  const PARTNER_URLS: Record<string, string> = {
    nbis: 'https://nbisins.com/?utm_source=haulcommand&utm_medium=referral',
    progressive: 'https://www.progressivecommercial.com/?utm_source=haulcommand&utm_medium=referral',
    national_general: 'https://www.nationwide.com/business-insurance/?utm_source=haulcommand',
  };

  const redirectUrl = PARTNER_URLS[partner] || PARTNER_URLS.nbis;

  // Log the referral (fire and forget)
  supabase.from('insurance_referrals').insert({
    user_id: user?.id || null,
    partner,
    placement: placement || null,
  }).then(() => {});

  return NextResponse.json({ redirect_url: redirectUrl });
}
