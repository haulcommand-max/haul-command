/**
 * POST /api/messaging/send
 * Send a message in a conversation.
 * Body: { conversationId, body, messageType?, offerData? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const sb = supabaseServer();
    const { conversationId, body, messageType = 'text', offerData } = await request.json();

    if (!conversationId || !body) {
      return NextResponse.json({ error: 'conversationId and body required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabaseAuth.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is participant
    const { data: conv } = await sb
      .from('conversations')
      .select('id, participant_ids')
      .eq('id', conversationId)
      .single();

    if (!conv || !conv.participant_ids.includes(user.id)) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Insert message
    const { data: msg, error: msgErr } = await sb
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body,
        message_type: messageType,
        offer_data: offerData || null,
      })
      .select('id, created_at')
      .single();

    if (msgErr) throw msgErr;

    // Update conversation preview
    const preview = body.length > 100 ? body.slice(0, 100) + '…' : body;
    await sb
      .from('conversations')
      .update({
        last_message_at: msg.created_at,
        last_message_preview: preview,
      })
      .eq('id', conversationId);

    // Create notification for recipient(s)
    const recipients = conv.participant_ids.filter((id: string) => id !== user.id);
    if (recipients.length > 0) {
      const notifs = recipients.map((recipientId: string) => ({
        user_id: recipientId,
        type: messageType === 'offer' ? 'offer_received' : 'new_message',
        title: messageType === 'offer' ? 'New offer received' : 'New message',
        body: preview,
        data: { conversationId, messageId: msg.id },
      }));

      await sb.from('notifications').insert(notifs);
    }

    return NextResponse.json({ messageId: msg.id, createdAt: msg.created_at });
  } catch (err) {
    console.error('Send message error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
