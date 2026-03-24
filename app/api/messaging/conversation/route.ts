import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/messaging/conversation
// Find or create a conversation between two users
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { target_user_id, load_id } = await req.json();
    if (!target_user_id) {
      return NextResponse.json({ error: 'target_user_id required' }, { status: 400 });
    }

    // Check for existing conversation between these two users
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [user.id, target_user_id])
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      // If there's a load_id and existing doesn't have one, update it
      if (load_id && !existing.load_id) {
        await supabase
          .from('conversations')
          .update({ load_id, conversation_type: 'load_offer' })
          .eq('id', existing.id);
      }
      return NextResponse.json({
        conversation_id: existing.id,
        is_new: false,
        conversation: existing,
      });
    }

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        participant_ids: [user.id, target_user_id],
        load_id: load_id || null,
        conversation_type: load_id ? 'load_offer' : 'direct',
      })
      .select()
      .single();

    if (error) throw error;

    // Create participant entries
    await supabase.from('conversation_participants').insert([
      { conversation_id: conversation.id, user_id: user.id },
      { conversation_id: conversation.id, user_id: target_user_id },
    ]);

    return NextResponse.json({
      conversation_id: conversation.id,
      is_new: true,
      conversation,
    });
  } catch (error: any) {
    console.error('Messaging conversation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
