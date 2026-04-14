import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════
// /api/activity/feed — Real-time platform activity feed
// Returns the 20 most recent real system events (no fake data).
// Sources: claims, certifications, availability broadcasts,
//          dispatch events, review submissions.
// ═══════════════════════════════════════════════════════════════

export const revalidate = 30; // 30s cache

interface ActivityEvent {
  id: string;
  type: string;
  title: string;
  detail: string;
  ts: string;
  icon: string;
}

export async function GET() {
  const supabase = createClient();
  const events: ActivityEvent[] = [];
  const now = new Date();
  const since = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(); // last 48h

  // 1. Recent operator claims
  try {
    const { data: claims } = await supabase
      .from('claim_requests')
      .select('id, operator_name, status, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5);

    for (const c of claims ?? []) {
      events.push({
        id: `claim-${c.id}`,
        type: 'claim',
        title: 'Profile Claimed',
        detail: `${c.operator_name || 'An operator'} claimed their profile`,
        ts: c.created_at,
        icon: '✓',
      });
    }
  } catch { /* table may not exist yet */ }

  // 2. Recent certifications passed
  try {
    const { data: certs } = await supabase
      .from('user_certifications')
      .select('id, certification_tier, status, created_at')
      .eq('status', 'passed')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5);

    const tierNames: Record<string, string> = {
      hc_certified: 'HC Certified',
      av_ready: 'AV-Ready',
      elite: 'Elite Specialist',
    };

    for (const c of certs ?? []) {
      events.push({
        id: `cert-${c.id}`,
        type: 'certification',
        title: 'Certification Earned',
        detail: `An operator earned ${tierNames[c.certification_tier] || c.certification_tier}`,
        ts: c.created_at,
        icon: '🎓',
      });
    }
  } catch { /* */ }

  // 3. Recent availability broadcasts
  try {
    const { data: broadcasts } = await supabase
      .from('availability_broadcasts')
      .select('id, city, state_code, status, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5);

    for (const b of broadcasts ?? []) {
      const loc = [b.city, b.state_code].filter(Boolean).join(', ');
      events.push({
        id: `avail-${b.id}`,
        type: 'availability',
        title: 'Operator Available',
        detail: loc ? `Escort operator now available in ${loc}` : 'Escort operator now available',
        ts: b.created_at,
        icon: '📡',
      });
    }
  } catch { /* */ }

  // 4. Recent dispatch matches
  try {
    const { data: dispatches } = await supabase
      .from('hc_dispatch_requests')
      .select('id, origin_city, destination_city, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5);

    for (const d of dispatches ?? []) {
      const route = d.origin_city && d.destination_city
        ? `${d.origin_city} → ${d.destination_city}`
        : 'New route';
      events.push({
        id: `dispatch-${d.id}`,
        type: 'dispatch',
        title: 'Load Dispatched',
        detail: route,
        ts: d.created_at,
        icon: '🚛',
      });
    }
  } catch { /* */ }

  // Sort all events by timestamp, take top 20
  events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  return NextResponse.json({
    events: events.slice(0, 20),
    generated_at: now.toISOString(),
    source: 'live',
  });
}
