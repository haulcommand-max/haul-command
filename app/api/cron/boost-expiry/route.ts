/**
 * /api/cron/boost-expiry — Expire old boosts + send renewal email
 * Called daily by Vercel Cron
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();

  // Find active boosts that have expired
  const { data: expiredBoosts, error } = await sb
    .from('ad_boosts')
    .select('id, profile_id, expires_at, amount_cents, duration_days')
    .eq('status', 'active')
    .lt('expires_at', now);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const expired = expiredBoosts ?? [];
  let expiredCount = 0;
  let emailsSent = 0;

  for (const boost of expired) {
    // Mark as expired
    await sb
      .from('ad_boosts')
      .update({ status: 'expired' })
      .eq('id', boost.id);
    expiredCount++;

    // Get operator email for renewal notification
    const { data: profile } = await sb
      .from('profiles')
      .select('email, full_name')
      .eq('id', boost.profile_id)
      .single();

    if (profile?.email) {
      try {
        // Send renewal email via Resend
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Haul Command <noreply@haulcommand.com>',
              to: profile.email,
              subject: `Your ${boost.duration_days}-day boost has expired — renew now`,
              html: `
                <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #0a0f16; color: #f0f4f8; border-radius: 16px;">
                  <h1 style="font-size: 24px; font-weight: 900; margin: 0 0 12px; color: #f5b942;">⚡ Your Boost Has Expired</h1>
                  <p style="font-size: 14px; color: #8fa3b8; line-height: 1.6;">
                    Hey ${profile.full_name || 'there'}, your ${boost.duration_days}-day boost has ended.
                    While boosted, your listing appeared at the top of search results with a gold "Sponsored" badge.
                  </p>
                  <p style="font-size: 14px; color: #8fa3b8; line-height: 1.6;">
                    Renew now to keep your priority placement and keep getting found by brokers.
                  </p>
                  <a href="https://haulcommand.com/boost" style="
                    display: inline-block; margin-top: 16px; padding: 12px 28px; border-radius: 12px;
                    background: linear-gradient(135deg, #f5b942, #e8a830); color: #000;
                    font-weight: 800; font-size: 14px; text-decoration: none;
                  ">Renew Boost →</a>
                </div>
              `,
            }),
          });
          emailsSent++;
        }
      } catch (emailErr) {
        console.error(`[boost-expiry] Email failed for ${boost.profile_id}:`, emailErr);
      }
    }
  }

  // Also activate any pending boosts that have completed Stripe checkout
  const { data: pendingBoosts } = await sb
    .from('ad_boosts')
    .select('id, stripe_session_id')
    .eq('status', 'pending')
    .lt('created_at', new Date(Date.now() - 300_000).toISOString()); // 5 min old

  // Note: Stripe webhook should handle this, but this is a safety net
  // Old pending boosts (>24h) are likely abandoned
  const { data: oldPending } = await sb
    .from('ad_boosts')
    .select('id')
    .eq('status', 'pending')
    .lt('created_at', new Date(Date.now() - 86400_000).toISOString());

  if (oldPending && oldPending.length > 0) {
    await sb
      .from('ad_boosts')
      .update({ status: 'abandoned' })
      .in('id', oldPending.map(p => p.id));
  }

  return NextResponse.json({
    ok: true,
    expired: expiredCount,
    emails_sent: emailsSent,
    abandoned: oldPending?.length ?? 0,
    timestamp: now,
  });
}
