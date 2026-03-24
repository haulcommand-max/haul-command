import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/notifications/push-register
// Register FCM token for push notifications
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { fcm_token, platform = 'web' } = await req.json();
    if (!fcm_token) {
      return NextResponse.json({ error: 'fcm_token required' }, { status: 400 });
    }

    // Upsert device token
    const { error } = await supabase
      .from('push_devices')
      .upsert({
        user_id: user.id,
        fcm_token,
        platform,
        last_active_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,fcm_token',
      });

    if (error) throw error;

    return NextResponse.json({ registered: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
