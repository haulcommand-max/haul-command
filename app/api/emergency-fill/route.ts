import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/emergency-fill
// Broadcast load to ALL available operators on a corridor ($25/blast)
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { load_id, corridor, rate_per_day } = await req.json();
    if (!load_id || !corridor) {
      return NextResponse.json({ error: 'load_id and corridor required' }, { status: 400 });
    }

    // Find all operators on this corridor
    const { data: operators } = await supabase
      .from('hc_global_operators')
      .select('id, claimed_by')
      .eq('status', 'active')
      .contains('corridors', [corridor])
      .not('claimed_by', 'is', null);

    if (!operators || operators.length === 0) {
      return NextResponse.json({ error: 'No operators on this corridor', sent: 0 }, { status: 404 });
    }

    // Create notifications for all matched operators
    const notifications = operators.map((op: any) => ({
      user_id: op.claimed_by,
      type: 'new_load_on_corridor' as const,
      title: `\ud83d\udea8 Emergency Fill \u2014 $${rate_per_day || '?'}/day`,
      body: `Urgent: ${corridor} needs an escort NOW. First to accept wins.`,
      data: { load_id, corridor },
      action_url: `/loads/${load_id}`,
    }));

    await supabase.from('notifications').insert(notifications);

    // Mark load as emergency fill
    await supabase
      .from('loads')
      .update({ emergency_fill: true })
      .eq('id', load_id);

    return NextResponse.json({
      sent: operators.length,
      corridor,
      message: `Blast sent to ${operators.length} operators`,
    });
  } catch (error: any) {
    console.error('Emergency fill error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
