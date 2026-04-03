/**
 * POST /api/capture/save-corridor
 * Saves a visitor's corridor follow intent for re-engagement.
 * Powers corridor alerts, disruption notifications, and demand digests.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { corridor_slug, visitor_id, email, origin_state, destination_state } = body;

        if (!corridor_slug) {
            return NextResponse.json({ error: 'Missing corridor_slug' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('saved_corridors')
            .upsert({
                visitor_id: visitor_id || null,
                email: email || null,
                corridor_slug,
                origin_state: origin_state || null,
                destination_state: destination_state || null,
                source: 'capture_overlay',
                created_at: new Date().toISOString(),
            }, { onConflict: 'visitor_id,corridor_slug' })
            .select('id')
            .single();

        if (error) {
            console.error('Save corridor error:', error);
            return NextResponse.json({ error: 'Failed to save corridor' }, { status: 500 });
        }

        return NextResponse.json({ ok: true, saved_corridor_id: data?.id });
    } catch (err) {
        console.error('Save corridor error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
