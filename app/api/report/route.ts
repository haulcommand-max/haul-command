import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { reported_entity_type, reported_entity_id, reason, details } = await req.json();

        if (!reported_entity_type || !reported_entity_id || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const sb = supabaseServer();
        const { data: { user } } = await sb.auth.getUser();

        const { error } = await sb.from('content_reports').insert({
            reporter_id: user?.id || null,
            reported_entity_type,
            reported_entity_id,
            reason,
            details: details || null,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
