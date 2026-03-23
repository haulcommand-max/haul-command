/**
 * POST /api/messaging/conversation
 * Find or create a conversation between two users.
 * Body: { recipientId: string, loadId?: string }
 * Returns: { conversationId: string, isNew: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const sb = supabaseServer();
    const { recipientId, loadId } = await request.json();

    if (!recipientId) {
      return NextResponse.json({ error: 'recipientId required' }, { status: 400 });
    }

    // Get current user from auth header
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

    const senderId = user.id;
    const participantIds = [senderId, recipientId].sort();

    // Check for existing conversation
    const { data: existing } = await sb
      .from('conversations')
      .select('id')
      .contains('participant_ids', participantIds)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ conversationId: existing.id, isNew: false });
    }

    // Create new conversation
    const { data: conv, error } = await sb
      .from('conversations')
      .insert({
        participant_ids: participantIds,
        load_id: loadId || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ conversationId: conv.id, isNew: true });
  } catch (err) {
    console.error('Conversation create error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
