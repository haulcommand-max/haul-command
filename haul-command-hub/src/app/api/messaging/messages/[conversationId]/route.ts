/**
 * GET /api/messaging/messages/[conversationId]
 * Returns all messages in a conversation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
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

    // Verify user is participant
    const { data: conv } = await sb
      .from('conversations')
      .select('participant_ids')
      .eq('id', conversationId)
      .single();

    if (!conv || !conv.participant_ids.includes(user.id)) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Fetch messages
    const { data: messages, error } = await sb
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) throw error;

    return NextResponse.json({ messages: messages || [], currentUserId: user.id });
  } catch (err) {
    console.error('Fetch messages error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
