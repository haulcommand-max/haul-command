export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

// Client calls this after subscribing via service worker pushManager
export async function POST(req: Request) {
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
    );

    const body = await req.json();

    // expected: { user_id, endpoint, keys: { p256dh, auth }, user_agent? }
    const { user_id, endpoint, keys, user_agent } = body || {};
    if (!user_id || !endpoint || !keys?.p256dh || !keys?.auth) {
        return new Response('Invalid payload', { status: 400 });
    }

    const { error } = await supabase.from('web_push_subscriptions').upsert({
        user_id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: user_agent || null,
    }, { onConflict: 'user_id,endpoint' });

    if (error) return new Response(error.message, { status: 500 });
    return Response.json({ ok: true });
}
