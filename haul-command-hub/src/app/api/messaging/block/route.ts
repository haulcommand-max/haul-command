/**
 * POST /api/messaging/block
 * Block a user — sets conversation status to blocked.
 * Body: { userId }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const sb = supabaseServer();
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
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

    // Find conversations with the blocked user
    const { data: conversations } = await sb
      .from('conversations')
      .select('id, participant_ids')
      .contains('participant_ids', [user.id, userId]);

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ blocked: true, conversationsUpdated: 0 });
    }

    // Update conversation status to blocked
    const ids = conversations.map(c => c.id);
    const { error } = await sb
      .from('conversations')
      .update({ status: 'blocked' })
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({ blocked: true, conversationsUpdated: ids.length });
  } catch (err) {
    console.error('Block error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
