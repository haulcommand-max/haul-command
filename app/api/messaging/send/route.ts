import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/messaging/send
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversation_id, body, message_type = 'text', offer_data } = await req.json();
    
    if (!conversation_id) {
      return NextResponse.json({ error: 'conversation_id required' }, { status: 400 });
    }

    // Verify user is participant
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, participant_ids')
      .eq('id', conversation_id)
      .contains('participant_ids', [user.id])
      .single();

    if (!conv) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id: user.id,
        body: body || '',
        message_type,
        offer_data: offer_data || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation last_message
    const preview = (body || '').substring(0, 120);
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: preview,
      })
      .eq('id', conversation_id);

    // Update sender's last_read_at
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversation_id)
      .eq('user_id', user.id);

    // Create notifications for recipients
    const recipientIds = conv.participant_ids.filter((id: string) => id !== user.id);
    if (recipientIds.length > 0) {
      const notifications = recipientIds.map((recipientId: string) => ({
        user_id: recipientId,
        type: message_type === 'offer' ? 'load_offer' : 'new_message',
        title: message_type === 'offer'
          ? `New Load Offer — $${offer_data?.rate_per_day || '?'}/day`
          : 'New Message',
        body: preview,
        data: { conversation_id, message_id: message.id },
        action_url: `/inbox/${conversation_id}`,
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
