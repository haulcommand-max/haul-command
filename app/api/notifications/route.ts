import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/notifications
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;
    const filter = searchParams.get('filter'); // 'unread', 'offers', 'system'

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filter === 'unread') {
      query = query.is('read_at', null);
    } else if (filter === 'offers') {
      query = query.in('type', ['load_offer', 'offer_accepted', 'offer_declined', 'counter_offer']);
    } else if (filter === 'system') {
      query = query.eq('type', 'system');
    }

    const { data: notifications, error } = await query;
    if (error) throw error;

    return NextResponse.json({ notifications: notifications || [], page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/notifications (mark read)
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { notification_ids, mark_all_read } = await req.json();

    if (mark_all_read) {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);
    } else if (notification_ids && Array.isArray(notification_ids)) {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', notification_ids)
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
