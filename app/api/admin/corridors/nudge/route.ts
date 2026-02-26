export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST /api/admin/corridors/nudge
// { corridor_slug: string }
// Finds dormant escorts near corridor and sends reactivation push
export async function POST(req: NextRequest) {
    const supabase = await createClient();

    // Auth check — admin only
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role ?? '')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { corridor_slug } = body;
    if (!corridor_slug) return NextResponse.json({ error: 'corridor_slug required' }, { status: 400 });

    // Find dormant escorts (active in last 90d but not last 30d, with push token)
    const { data: dormant } = await supabase
        .from('profiles')
        .select('id, full_name, push_token')
        .eq('claimed', true)
        .not('push_token', 'is', null)
        .lt('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .gt('updated_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .limit(50);

    if (!dormant || dormant.length === 0) {
        return NextResponse.json({ notified: 0, message: 'No dormant escorts found nearby' });
    }

    // Fire push notifications
    const message = `📍 Demand heating up near ${corridor_slug.replace(/-/g, ' ').toUpperCase()} this week — good chance to catch runs.`;
    let notified = 0;

    const results = await Promise.allSettled(
        dormant.slice(0, 30).map(async escort => {
            if (!escort.push_token) return;

            // Push via Supabase Edge Function (existing push infrastructure)
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                    },
                    body: JSON.stringify({
                        token: escort.push_token,
                        title: 'Haul Command — Coverage Alert',
                        body: message,
                        data: { corridor: corridor_slug, type: 'corridor_demand' },
                    }),
                }
            );
            if (res.ok) notified++;
        })
    );

    // Log the nudge event
    await supabase.from('admin_events').insert({
        event_type: 'corridor_nudge',
        actor_id: user.id,
        metadata: { corridor_slug, notified, total_dormant: dormant.length },
    }).single();

    return NextResponse.json({ notified, total_dormant: dormant.length, message });
}
