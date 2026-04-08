import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/community/threads/{thread_id}/posts — Add post to thread
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(
    req: NextRequest,
    { params }: { params: { thread_id: string } },
) {
    try {
        const db = supabase();
        const body = await req.json();
        const { post_text, post_type, parent_post_id } = body;

        if (!post_text) {
            return NextResponse.json({ error: 'post_text required' }, { status: 400 });
        }

        const { data, error } = await db
            .from('soc_posts')
            .insert({
                thread_id: params.thread_id,
                parent_post_id: parent_post_id || null,
                post_text,
                post_type: post_type || 'reply',
                status: 'active',
            })
            .select('id')
            .single();

        if (error) throw error;

        // Update thread metrics
        await db.rpc('', {});  // placeholder — would increment reply_count
        await db
            .from('soc_threads')
            .update({ last_activity_at: new Date().toISOString() })
            .eq('id', params.thread_id);

        return NextResponse.json({ post_id: data.id }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
