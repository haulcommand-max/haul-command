import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(_req: Request, { params }: { params: Promise<{ certification_id: string }> }) {
  try {
    const { certification_id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: cert, error } = await supabase
      .from('user_certifications')
      .select('id, certification_tier, status, completed_at, expires_at, score, badge_url, certificate_url, user_id')
      .eq('id', certification_id)
      .single();

    if (error || !cert) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    // Fetch user's first name + last initial (privacy)
    const { data: profile } = await supabase
      .from('operators')
      .select('first_name, last_name, full_name')
      .eq('user_id', (cert as { user_id: string }).user_id)
      .maybeSingle();

    let displayName = 'Verified Operator';
    if (profile) {
      const first = profile.first_name || (profile.full_name || '').split(' ')[0] || '';
      const last = profile.last_name || (profile.full_name || '').split(' ')[1] || '';
      displayName = last ? `${first} ${last[0]}.` : first;
    }

    const tierLabels: Record<string, string> = {
      hc_certified: 'HC Certified Escort Operator',
      av_ready: 'HC AV-Ready Certified',
      elite: 'HC Elite Certified',
    };

    const isActive = cert.status === 'passed' && new Date(cert.expires_at) > new Date();

    return NextResponse.json({
      id: cert.id,
      operator_name: displayName,
      certification_tier: cert.certification_tier,
      tier_label: tierLabels[cert.certification_tier] || cert.certification_tier,
      status: isActive ? 'ACTIVE' : 'EXPIRED',
      date_issued: cert.completed_at,
      expires_at: cert.expires_at,
      score: cert.score,
      badge_url: cert.badge_url,
      certificate_url: cert.certificate_url,
      certifying_body: 'Haul Command',
      standard: 'Built on FMCSA + SC&RA Best Practices Guidelines',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
