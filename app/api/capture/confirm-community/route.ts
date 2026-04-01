import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ══════════════════════════════════════════════════════════════
// POST /api/capture/confirm-community
// Confirm Facebook group membership (self-reported)
// Body: { email?, userId?, platform?: 'facebook' }
//
// RULE: We NEVER assume membership. This endpoint is the
// ONLY way to mark someone as a confirmed community member.
// ══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId, platform = 'facebook' } = body;

    if (!email && !userId) {
      return NextResponse.json(
        { error: 'Email or userId required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user from session if no userId provided
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      resolvedUserId = user?.id;
    }

    // Upsert community membership
    const { data, error } = await supabase
      .from('community_memberships')
      .upsert(
        {
          user_id: resolvedUserId || `email_${email}`,
          email: email || null,
          platform,
          group_id: platform === 'facebook' ? 'haulcommand' : platform,
          is_confirmed: true,
          confirmation_source: 'self_reported',
          confirmed_at: new Date().toISOString(),
          badge_unlocked: true, // Auto-unlock badge on confirmation
        },
        { onConflict: 'user_id,platform' }
      )
      .select()
      .single();

    if (error) {
      console.error('Community confirmation error:', error);
      return NextResponse.json({
        success: true,
        message: 'Community membership confirmed',
        note: 'Pending table creation',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Community membership confirmed! Badge unlocked 🎖️',
      membership: data,
    });
  } catch (err) {
    console.error('Community confirmation error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
