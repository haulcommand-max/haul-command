import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/conversations/{id}/messages — Add message
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(
    req: NextRequest,
    { params }: { params: { conversation_id: string } },
) {
    try {
        const db = supabase();
        const body = await req.json();
        const { message_text, sender_type, sender_entity_id, message_type, attachments } = body;

        if (!message_text) {
            return NextResponse.json({ error: 'message_text required' }, { status: 400 });
        }

        const { data, error } = await db
            .from('hc_conversation_messages')
            .insert({
                conversation_id: params.conversation_id,
                sender_type: sender_type || 'user',
                sender_entity_id: sender_entity_id || null,
                message_text,
                message_type: message_type || 'text',
                attachments: attachments || [],
            })
            .select('id')
            .single();

        if (error) throw error;

        // Update conversation updated_at
        await db
            .from('hc_conversations')
            .update({ status: 'open' })
            .eq('id', params.conversation_id);

        return NextResponse.json({ message_id: data.id }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
