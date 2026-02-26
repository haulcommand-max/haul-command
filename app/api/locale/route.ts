import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { locale } = await req.json();
        const SUPPORTED = ['en-US', 'en-CA', 'fr-CA', 'es-US', 'es-CA'];
        if (!SUPPORTED.includes(locale)) {
            return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
        }

        // Set cookie
        const res = NextResponse.json({ ok: true });
        res.cookies.set('hc_locale', locale, { path: '/', maxAge: 31536000, sameSite: 'lax' });

        // Persist to profile if authenticated
        try {
            const sb = supabaseServer();
            const { data: { user } } = await sb.auth.getUser();
            if (user) {
                await sb.from('profiles').update({ locale_preference: locale }).eq('id', user.id);
            }
        } catch {
            // User not logged in — cookie is enough
        }

        return res;
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
