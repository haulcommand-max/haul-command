import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/conversations — Create a conversation
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const db = supabase();
        const body = await req.json();
        const {
            conversation_type, channel_type, subject,
            participant_entities, country_code, language_code,
        } = body;

        const { data, error } = await db
            .from('hc_conversations')
            .insert({
                conversation_type: conversation_type || 'support',
                channel_type: channel_type || 'chat',
                subject: subject || null,
                participant_entities: participant_entities || [],
                country_code: country_code || null,
                language_code: language_code || 'en',
                status: 'open',
            })
            .select('id')
            .single();

        if (error) throw error;

        return NextResponse.json({ conversation_id: data.id }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
