/**
 * GET /api/messaging/conversations
 * Returns all conversations for the current user with unread counts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const sb = supabaseServer();

    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabaseAuth.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get all conversations for this user
    const { data: conversations, error } = await sb
      .from('conversations')
      .select('*')
      .contains('participant_ids', [user.id])
      .order('last_message_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Get unread counts per conversation
    const convIds = (conversations || []).map((c: any) => c.id);
    
    let unreadMap: Record<string, number> = {};
    if (convIds.length > 0) {
      const { data: unreadRows } = await sb
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .neq('sender_id', user.id)
        .is('read_at', null);

      for (const row of unreadRows || []) {
        unreadMap[row.conversation_id] = (unreadMap[row.conversation_id] || 0) + 1;
      }
    }

    // Get the other participant's name for each conversation
    const enriched = (conversations || []).map((conv: any) => {
      const otherIds = conv.participant_ids.filter((id: string) => id !== user.id);
      return {
        ...conv,
        unreadCount: unreadMap[conv.id] || 0,
        otherParticipantIds: otherIds,
      };
    });

    return NextResponse.json({ conversations: enriched });
  } catch (err) {
    console.error('List conversations error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
