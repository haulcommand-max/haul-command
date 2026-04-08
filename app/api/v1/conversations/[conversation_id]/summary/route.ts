import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/conversations/{id}/summarize — Generate summary + action items
// GET  /v1/conversations/{id}/summary — Get latest summary
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
        const { include_action_items } = body;

        // Fetch messages
        const { data: messages } = await db
            .from('hc_conversation_messages')
            .select('message_text, sender_type, created_at')
            .eq('conversation_id', params.conversation_id)
            .order('created_at', { ascending: true });

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'No messages to summarize' }, { status: 400 });
        }

        // Create a placeholder summary (AI generation would be wired here)
        const summaryText = `Conversation with ${messages.length} messages. Topics discussed include the content of the exchange between participants.`;

        const { data: summary, error } = await db
            .from('hc_conversation_summaries')
            .insert({
                conversation_id: params.conversation_id,
                summary_text: summaryText,
                key_topics: [],
                next_steps: [],
                model_used: 'placeholder',
            })
            .select('id')
            .single();

        if (error) throw error;

        let actionItemsCreated = 0;

        // Create action items if requested
        if (include_action_items) {
            const { error: aiErr } = await db
                .from('hc_action_items')
                .insert({
                    source_type: 'conversation',
                    source_id: params.conversation_id,
                    action_type: 'follow_up',
                    title: `Follow up on conversation ${params.conversation_id.slice(0, 8)}`,
                    priority: 'normal',
                    status: 'open',
                });

            if (!aiErr) actionItemsCreated = 1;
        }

        return NextResponse.json({
            summary_id: summary.id,
            action_items_created: actionItemsCreated,
        }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET(
    _req: NextRequest,
    { params }: { params: { conversation_id: string } },
) {
    try {
        const db = supabase();

        const { data, error } = await db
            .from('hc_conversation_summaries')
            .select('id, summary_text, key_topics, resolution_type, next_steps, model_used, created_at')
            .eq('conversation_id', params.conversation_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'No summary found' }, { status: 404 });
        }

        return NextResponse.json({
            summary_text: data.summary_text,
            key_topics: data.key_topics,
            resolution_type: data.resolution_type,
            next_steps: data.next_steps,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
