export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(req: Request) {
    try {
        const { token, platform, locale, region } = await req.json();

        if (!token || !platform) {
            return NextResponse.json({ error: 'token and platform required' }, { status: 400 });
        }

        if (!['web', 'ios', 'android'].includes(platform)) {
            return NextResponse.json({ error: 'platform must be web, ios, or android' }, { status: 400 });
        }

        // The client-side supabase call — auth context comes from the request cookies
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { error } = await supabase.from('push_tokens').upsert(
            {
                user_id: user.id,
                token,
                platform,
                locale: locale || 'en-US',
                region: region || null,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,token' }
        );

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
