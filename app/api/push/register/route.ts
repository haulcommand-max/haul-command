// =====================================================================
// Haul Command — Push Token Registration API
// POST /api/push/register
//
// Called by lib/firebase.ts after FCM getToken() succeeds.
// Upserts the push token into push_tokens table.
// Also logs to os_event_log for Command Layer observability.
// =====================================================================

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server-auth';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, platform, device_label } = body;

    if (!token || !platform) {
      return NextResponse.json({ error: 'token and platform required' }, { status: 400 });
    }

    // Get authenticated user
    const supabase = createServerComponentClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Upsert push token
    const { data, error } = await supabaseAdmin
      .from('push_tokens')
      .upsert(
        {
          user_id: user.id,
          token,
          platform,
          device_label: device_label ?? null,
          is_active: true,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' }
      )
      .select()
      .single();

    if (error) throw error;

    // Log to OS event bus
    await supabaseAdmin.from('os_event_log').insert({
      event_type: 'push.token_registered',
      entity_type: 'push_token',
      entity_id: data.id,
      payload: { user_id: user.id, platform, device_label },
    });

    return NextResponse.json({ success: true, id: data.id });
  } catch (err: any) {
    console.error('[push/register] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Unregister a token (logout / token refresh)
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'token required' }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await supabaseAdmin
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('token', token);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[push/register] DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
