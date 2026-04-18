/**
 * POST /api/training/complete
 * Marks training as completed and issues the corresponding badge.
 * Service-role only — called by internal completion logic or admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { BADGE_META } from '@/lib/training/types';

export async function POST(request: NextRequest) {
  try {
    // Verify internal secret
    const authHeader = request.headers.get('authorization');
    const secret = process.env.INTERNAL_API_SECRET;
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { user_id, training_node_id, expires_months } = body;

    if (!user_id || !training_node_id) {
      return NextResponse.json({ error: 'user_id and training_node_id required' }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Get catalog entry
    const { data: catalog } = await supabase
      .from('training_catalog')
      .select('id, credential_level')
      .eq('node_id', training_node_id)
      .single();

    if (!catalog) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 });
    }

    const now = new Date();
    const completed_at = now.toISOString();
    const badge_slug = catalog.credential_level as string;

    // Calculate expiry
    let expires_at: string | null = null;
    let review_due_at: string | null = null;

    if (expires_months) {
      const expiry = new Date(now);
      expiry.setMonth(expiry.getMonth() + expires_months);
      expires_at = expiry.toISOString();
      const reviewDue = new Date(expiry);
      reviewDue.setMonth(reviewDue.getMonth() - 1);
      review_due_at = reviewDue.toISOString();
    }

    // Update enrollment to completed
    const { error: enrollErr } = await supabase
      .from('training_enrollments')
      .update({ status: 'completed', completed_at, expires_at, review_due_at })
      .eq('user_id', user_id)
      .eq('training_id', catalog.id);

    if (enrollErr) {
      console.error('[Training Complete] enrollment update error:', enrollErr.message);
    }

    // Issue badge
    const { error: badgeErr } = await supabase
      .from('training_user_badges')
      .upsert({
        user_id,
        badge_slug,
        source_training_id: catalog.id,
        status: 'active',
        issued_at: completed_at,
        expires_at,
        review_due_at,
      }, { onConflict: 'user_id,badge_slug' });

    if (badgeErr) {
      console.error('[Training Complete] badge upsert error:', badgeErr.message);
      return NextResponse.json({ error: 'Badge issuance failed' }, { status: 500 });
    }

    const meta = BADGE_META[badge_slug as keyof typeof BADGE_META];

    return NextResponse.json({
      success: true,
      badge_slug,
      badge_label: meta?.label ?? badge_slug,
      issued_at: completed_at,
      expires_at,
    });
  } catch (err) {
    console.error('[Training Complete] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
