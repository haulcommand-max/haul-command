/**
 * POST/DELETE /api/notifications/register
 *
 * Clients call this on app load to register or refresh their FCM token.
 * DELETE deactivates a token (on sign-out or token rotation).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { token, platform, deviceLabel } = await req.json();

        if (!token || !platform) {
            return NextResponse.json(
                { error: 'token and platform required' },
                { status: 400 },
            );
        }

        if (!['ios', 'android', 'web'].includes(platform)) {
            return NextResponse.json(
                { error: 'platform must be ios, android, or web' },
                { status: 400 },
            );
        }

        // Upsert — update last_used_at if token exists, insert if new
        const { error } = await supabase.from('push_tokens').upsert(
            {
                user_id: user.id,
                token,
                platform,
                device_label: deviceLabel ?? null,
                is_active: true,
                last_used_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,token' },
        );

        if (error) {
            console.error('[FCM Register]', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, platform });

    } catch (err: any) {
        console.error('[FCM Register] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: 'token required' }, { status: 400 });
        }

        await supabase
            .from('push_tokens')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .eq('token', token);

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('[FCM Unregister] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
