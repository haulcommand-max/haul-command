/**
 * GET /api/messaging/unread-count
 * Returns the total unread message count across all conversations.
 * Never cached — always fresh.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const sb = supabaseServer();

    // Authenticate
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ count: 0 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabaseAuth.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    // Get all conversations the user is in
    const { data: conversations } = await sb
      .from('conversations')
      .select('id, participant_ids')
      .contains('participant_ids', [user.id])
      .eq('status', 'active');

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    // Get user's last_read_at for each conversation
    const { data: participants } = await sb
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id)
      .in('conversation_id', conversations.map(c => c.id));

    const lastReadMap = new Map(
      (participants || []).map(p => [p.conversation_id, p.last_read_at])
    );

    // Count unread messages
    let totalUnread = 0;
    for (const conv of conversations) {
      const lastRead = lastReadMap.get(conv.id);
      let query = sb
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', user.id);

      if (lastRead) {
        query = query.gt('created_at', lastRead);
      }

      const { count } = await query;
      totalUnread += count ?? 0;
    }

    return NextResponse.json({ count: totalUnread });
  } catch (err) {
    console.error('Unread count error:', err);
    return NextResponse.json({ count: 0 });
  }
}
