import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/messaging/react
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { message_id, emoji } = await req.json();
    if (!message_id || !emoji) {
      return NextResponse.json({ error: 'message_id and emoji required' }, { status: 400 });
    }

    // Check if reaction exists (toggle)
    const { data: existing } = await supabase
      .from('message_reactions')
      .select('message_id')
      .eq('message_id', message_id)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', message_id)
        .eq('user_id', user.id)
        .eq('emoji', emoji);
      return NextResponse.json({ action: 'removed' });
    }

    await supabase.from('message_reactions').insert({
      message_id,
      user_id: user.id,
      emoji,
    });

    return NextResponse.json({ action: 'added' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
