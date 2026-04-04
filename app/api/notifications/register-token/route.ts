import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/notifications/register-token
 * Registers or refreshes an FCM device token for the authenticated user.
 * Called on app init + whenever FCM issues a new token.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { fcmToken, platform, appVersion, countryCode, roleKey } = await req.json();
    if (!fcmToken || !platform) {
      return NextResponse.json({ error: 'fcmToken and platform required' }, { status: 400 });
    }

    // Upsert token
    await supabase
      .from('hc_device_tokens')
      .upsert({
        user_id: user.id,
        token: fcmToken,
        platform,
        app_version: appVersion ?? null,
        country_code: countryCode ?? null,
        role_key: roleKey ?? null,
        is_active: true,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'user_id,token' });

    // Ensure preference row exists (defaults: push on, SMS off)
    await supabase
      .from('hc_notif_preferences')
      .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/register-token
 * Deactivates a token (logout, uninstall, permission revoked).
 */
export async function DELETE(req: NextRequest) {
  try {
    const { fcmToken } = await req.json();
    if (!fcmToken) return NextResponse.json({ error: 'fcmToken required' }, { status: 400 });

    await supabase
      .from('hc_device_tokens')
      .update({ is_active: false })
      .eq('token', fcmToken);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
