export const dynamic = 'force-dynamic';
/**
 * GET /api/directory/badge/[token]
 * Returns an embeddable SVG badge for an operator.
 * Tracks embed impressions in directory_badge_claims.
 *
 * Embed usage:
 *   <img src="https://haulcommand.com/api/directory/badge/TOKEN" alt="Featured on Haul Command" />
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const BADGE_SVGS: Record<string, (name: string, tier: string) => string> = {
  featured: (name, tier) => `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="60" viewBox="0 0 220 60">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#0d0d14"/>
      <stop offset="100%" style="stop-color:#16161f"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#F1A91B"/>
      <stop offset="100%" style="stop-color:#d97706"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="220" height="60" rx="8" fill="url(#bg)" stroke="#F1A91B" stroke-width="1.5" stroke-opacity="0.4"/>
  <!-- Left accent bar -->
  <rect x="0" y="0" width="4" height="60" rx="2" fill="url(#gold)"/>
  <!-- Logo mark -->
  <text x="16" y="22" font-family="system-ui,sans-serif" font-size="14" font-weight="900" fill="#F1A91B">⚡</text>
  <!-- Haul Command label -->
  <text x="32" y="22" font-family="system-ui,sans-serif" font-size="9" font-weight="800" fill="#F1A91B" letter-spacing="1.5" text-transform="uppercase">HAUL COMMAND</text>
  <!-- Tier badge -->
  <rect x="148" y="10" width="${tier === 'elite' ? 54 : tier === 'verified' ? 46 : 50}" height="14" rx="4" fill="#F1A91B" fill-opacity="0.15" stroke="#F1A91B" stroke-width="1" stroke-opacity="0.4"/>
  <text x="${tier === 'elite' ? 175 : tier === 'verified' ? 171 : 173}" y="21" font-family="system-ui,sans-serif" font-size="7.5" font-weight="800" fill="#F1A91B" text-anchor="middle" letter-spacing="0.8">${tier.toUpperCase()}</text>
  <!-- Operator name -->
  <text x="16" y="42" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="#e5e7eb">${name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 28)}</text>
  <!-- Sub label -->
  <text x="16" y="54" font-family="system-ui,sans-serif" font-size="8" fill="#6b7280">Verified Escort Operator Directory</text>
</svg>`,

  top10: (name, tier) => `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="60" viewBox="0 0 220 60">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0c1a"/>
      <stop offset="100%" style="stop-color:#1a0f2e"/>
    </linearGradient>
  </defs>
  <rect width="220" height="60" rx="8" fill="url(#bg2)" stroke="#7c3aed" stroke-width="1.5" stroke-opacity="0.5"/>
  <rect x="0" y="0" width="4" height="60" rx="2" fill="#7c3aed"/>
  <text x="16" y="22" font-family="system-ui,sans-serif" font-size="9" font-weight="800" fill="#a78bfa" letter-spacing="1.5">⭐ TOP RATED</text>
  <rect x="155" y="10" width="52" height="14" rx="4" fill="#7c3aed" fill-opacity="0.2" stroke="#7c3aed" stroke-width="1"/>
  <text x="181" y="21" font-family="system-ui,sans-serif" font-size="7.5" font-weight="800" fill="#a78bfa" text-anchor="middle" letter-spacing="0.8">HAUL CMD</text>
  <text x="16" y="42" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="#f9fafb">${name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 28)}</text>
  <text x="16" y="54" font-family="system-ui,sans-serif" font-size="8" fill="#6b7280">Top Rated Escort Operator · ${tier.toUpperCase()}</text>
</svg>`,
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { token } = await params;

  // Fetch badge claim
  const { data: claim } = await svc
    .from('directory_badge_claims')
    .select('id, user_id, badge_type, tier, is_active, embed_count')
    .eq('badge_token', token)
    .eq('is_active', true)
    .maybeSingle();

  if (!claim) {
    return new NextResponse('Badge not found', { status: 404 });
  }

  // Fetch operator display name
  const { data: profile } = await svc
    .from('escort_profiles')
    .select('display_name, company_name')
    .eq('user_id', (claim as any).user_id)
    .maybeSingle();

  const name = (profile as any)?.display_name ?? (profile as any)?.company_name ?? 'Haul Command Operator';

  // Track embed impression (fire-and-forget)
  void svc.from('directory_badge_claims')
    .update({ embed_count: ((claim as any).embed_count ?? 0) + 1, last_embedded_at: new Date().toISOString() })
    .eq('id', (claim as any).id);

  // Generate SVG
  const svgFn = BADGE_SVGS[claim.badge_type] ?? BADGE_SVGS['featured'];
  const svg = svgFn(name, claim.tier);

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Badge-Token': token,
    },
  });
}
