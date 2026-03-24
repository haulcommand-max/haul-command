import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/messaging/block
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { user_id: blockedUserId } = await req.json();
    if (!blockedUserId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    // Find all conversations with this user
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .contains('participant_ids', [user.id, blockedUserId])
      .eq('status', 'active');

    if (conversations && conversations.length > 0) {
      const ids = conversations.map((c: any) => c.id);
      await supabase
        .from('conversations')
        .update({ status: 'blocked' })
        .in('id', ids);
    }

    return NextResponse.json({ status: 'blocked' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
