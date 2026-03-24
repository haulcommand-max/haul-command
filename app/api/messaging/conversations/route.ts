import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/messaging/conversations
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    // Get conversations where user is participant
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_participants!inner(last_read_at, is_muted, is_archived)
      `)
      .contains('participant_ids', [user.id])
      .eq('status', 'active')
      .eq('conversation_participants.user_id', user.id)
      .eq('conversation_participants.is_archived', false)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Count unread for each conversation
    const enriched = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const lastRead = conv.conversation_participants?.[0]?.last_read_at;
        let unreadCount = 0;
        if (lastRead) {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .gt('created_at', lastRead);
          unreadCount = count || 0;
        }
        return { ...conv, unread_count: unreadCount };
      })
    );

    return NextResponse.json({ conversations: enriched, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
