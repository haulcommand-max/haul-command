import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server-auth';
import { cookies } from 'next/headers';

/**
 * POST /api/operator/corridor-watch
 * Saves a corridor to the operator's watch list.
 * Triggers push alerts when demand signals fire on watched corridors.
 *
 * Body: { operator_id: string, corridor_id: string, notify_push?: boolean, notify_email?: boolean }
 *
 * DELETE /api/operator/corridor-watch
 * Removes a corridor from the watch list.
 * Body: { operator_id: string, corridor_id: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { operator_id, corridor_id, notify_push = true, notify_email = false } = await req.json();
    if (!operator_id || !corridor_id) {
      return NextResponse.json({ error: 'operator_id and corridor_id required' }, { status: 400 });
    }

    // Ownership check
    const { data: op } = await supabase
      .from('hc_global_operators')
      .select('id, user_id')
      .eq('id', operator_id)
      .maybeSingle();
    if (!op || op.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('hc_corridor_watches')
      .upsert({ operator_id, corridor_id, notify_push, notify_email }, { onConflict: 'operator_id,corridor_id' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { operator_id, corridor_id } = await req.json();
    if (!operator_id || !corridor_id) {
      return NextResponse.json({ error: 'operator_id and corridor_id required' }, { status: 400 });
    }

    // Ownership check
    const { data: op } = await supabase
      .from('hc_global_operators')
      .select('id, user_id')
      .eq('id', operator_id)
      .maybeSingle();
    if (!op || op.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('hc_corridor_watches')
      .delete()
      .eq('operator_id', operator_id)
      .eq('corridor_id', corridor_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
