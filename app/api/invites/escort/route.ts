export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST /api/invites/escort
// Creates a shareable invite link for an escort to send to a broker
// Body: { broker_name?, broker_phone?, broker_email?, trigger_context?, source_job_id? }
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { broker_name, broker_phone, broker_email, trigger_context, source_job_id } = body;

    // Only escorts can generate invite links
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const { data: invite, error } = await supabase
        .from('escort_invite_links')
        .insert({
            escort_id: user.id,
            broker_name: broker_name ?? null,
            broker_phone: broker_phone ? broker_phone.replace(/\D/g, '').slice(-10) : null,
            broker_email: broker_email ?? null,
            trigger_context: trigger_context ?? 'manual',
            source_job_id: source_job_id ?? null,
        })
        .select('id, token, expires_at')
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';
    const invite_url = `${baseUrl}/claim/invite/${invite.token}`;

    return NextResponse.json({ invite_url, token: invite.token, expires_at: invite.expires_at });
}

// GET /api/invites/escort?token=xxx
// Resolves invite token to escort profile info (for landing page)
export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

    const supabase = await createClient();

    const { data: invite, error } = await supabase
        .from('escort_invite_links')
        .select(`
      id, token, escort_id, broker_name, trigger_context, expires_at, clicked_at,
      escort:escort_id (id, full_name, city, state, profile_strength)
    `)
        .eq('token', token)
        .single();

    if (error || !invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Invite expired' }, { status: 410 });
    }

    // Track click if not already tracked
    if (!invite.clicked_at) {
        await supabase
            .from('escort_invite_links')
            .update({ clicked_at: new Date().toISOString() })
            .eq('token', token);
    }

    return NextResponse.json({ invite });
}
