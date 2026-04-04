import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/notifications/preferences
 * Returns the authenticated user's notification preferences.
 *
 * PATCH /api/notifications/preferences
 * Updates preferences (push on/off, quiet hours, SMS opt-in, category toggles).
 */
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('hc_notif_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ preferences: data });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const updates = await req.json();
  const allowed = [
    'push_enabled','email_enabled','sms_enabled','in_app_enabled',
    'load_match_push','claim_push','market_push','rate_alert_push','monetization_push',
    'quiet_hours_start','quiet_hours_end','timezone',
    'max_push_per_day','max_sms_per_day',
  ];
  const safe = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );

  const { error } = await supabase
    .from('hc_notif_preferences')
    .upsert({ user_id: user.id, ...safe, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

async function getUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const { data: { user } } = await supabase.auth.getUser(auth.replace('Bearer ', ''));
  return user;
}
