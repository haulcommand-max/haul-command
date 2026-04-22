/**
 * POST /api/sms/optout — TCPA-compliant STOP handler
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const STOP_KW = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'QUIT', 'END'];

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { from_number, message_body } = body;
    if (!from_number || !message_body) return NextResponse.json({ error: 'missing fields' }, { status: 400 });

    const kw = message_body.trim().toUpperCase();
    const admin = getSupabaseAdmin();

    if (STOP_KW.includes(kw)) {
        await admin.from('profiles').update({ sms_opted_out: true }).eq('phone_e164', from_number);
        await admin.from('hc_global_operators').update({ sms_opted_out: true }).eq('phone_e164', from_number);
        await admin.from('sms_log').insert({ to_number: from_number, message: `OPT-OUT: ${kw}`, status: 'opted_out', credits_used: 0, provider: 'inbound' });
        return NextResponse.json({ ok: true, action: 'opted_out', reply: 'Unsubscribed from Haul Command SMS. Reply START to re-subscribe.' });
    }

    return NextResponse.json({ ok: true, action: 'none' });
}
