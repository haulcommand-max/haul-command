/**
 * POST /api/messaging/react
 * Add or toggle an emoji reaction on a message.
 * Body: { messageId, emoji }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const sb = supabaseServer();
    const { messageId, emoji } = await request.json();

    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'messageId and emoji required' }, { status: 400 });
    }

    // Authenticate
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

    // Check if reaction already exists (toggle off)
    const { data: existing } = await sb
      .from('message_reactions')
      .select('message_id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .maybeSingle();

    if (existing) {
      // Remove reaction
      await sb
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      return NextResponse.json({ action: 'removed', emoji });
    }

    // Add reaction
    const { error } = await sb
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      });

    if (error) throw error;

    return NextResponse.json({ action: 'added', emoji });
  } catch (err) {
    console.error('React error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
