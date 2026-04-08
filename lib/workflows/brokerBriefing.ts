/**
 * lib/workflows/brokerBriefing.ts
 * Haul Command — Broker Morning Briefing Workflow (Priority #4 Retention)
 *
 * Generates personalized broker briefings with:
 *   - Corridor shortages in watched corridors
 *   - Standby operator pool health
 *   - Credentialed operator availability by type
 *   - Pending jobs requiring attention
 *   - Risk signals (operators going offline, coverage gaps)
 *
 * Scoring: (urgency*0.35) + (corridor_relevance*0.25) + (coverage_gap*0.20) + (broker_preference*0.20)
 * Delivered: 06:00 daily via Firebase push + dashboard card
 */

import { createClient } from '@supabase/supabase-js';

export interface BrokerBriefItem {
  item_type: 'shortage' | 'standby_pool' | 'pending_job' | 'risk_signal' | 'opportunity';
  title: string;
  body: string;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  action_url?: string;
  action_label?: string;
  metadata: Record<string, unknown>;
  rank_score: number;
}

export interface BrokerBrief {
  broker_id: string;
  date: string;
  push_title: string;
  push_body: string;
  summary: string;
  urgent_count: number;
  items: BrokerBriefItem[];
}

// ─── Item scorers ─────────────────────────────────────────
function rankItem(
  item: Omit<BrokerBriefItem, 'rank_score'>,
  corridorRelevance: number,
  brokerPreference: number,
): number {
  const urgencyScore = { critical: 100, high: 75, normal: 40, low: 15 }[item.urgency];
  const coverageGap = item.item_type === 'shortage' ? 80 : item.item_type === 'risk_signal' ? 70 : 40;
  return Math.round(
    urgencyScore * 0.35 +
    corridorRelevance * 0.25 +
    coverageGap * 0.20 +
    brokerPreference * 0.20
  );
}

// ─── Push copy builder ────────────────────────────────────
function buildBrokerPushCopy(brief: Omit<BrokerBrief, 'push_title' | 'push_body'>): {
  title: string;
  body: string;
} {
  const criticalItems = brief.items.filter((i) => i.urgency === 'critical');
  const highItems = brief.items.filter((i) => i.urgency === 'high');

  if (criticalItems.length > 0) {
    return {
      title: `🔴 ${criticalItems[0].title}`,
      body: criticalItems[0].body.substring(0, 120),
    };
  }
  if (highItems.length > 0) {
    return {
      title: `⚠️ ${highItems.length} corridor alert${highItems.length > 1 ? 's' : ''} require attention`,
      body: `${highItems[0].title} — tap to review your morning brief.`,
    };
  }
  return {
    title: `Good morning — your corridor brief is ready`,
    body: brief.summary,
  };
}

// ─── Main builder ─────────────────────────────────────────
export async function buildBrokerBrief(brokerId: string): Promise<BrokerBrief | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Load broker profile + preferences
  const { data: broker, error: bErr } = await supabase
    .from('broker_profiles')
    .select('id, user_id, display_name, country_code, watch_corridors, credential_types_needed')
    .eq('id', brokerId)
    .single();

  if (bErr || !broker) return null;

  const watchCorridors: string[] = broker.watch_corridors ?? [];
  const items: BrokerBriefItem[] = [];

  // ── Open jobs needing assignment ─────────────────────────
  const { data: openJobs } = await supabase
    .from('hc_jobs')
    .select('id, title, corridor_label, depart_at, required_credentials, estimated_earnings')
    .eq('broker_id', brokerId)
    .eq('status', 'open')
    .order('depart_at', { ascending: true })
    .limit(5);

  for (const job of openJobs ?? []) {
    const departHours = job.depart_at
      ? Math.max(0, (new Date(job.depart_at).getTime() - Date.now()) / 3_600_000)
      : 999;
    const urgency: BrokerBriefItem['urgency'] =
      departHours < 4 ? 'critical' : departHours < 24 ? 'high' : 'normal';

    const corridorRelevance = watchCorridors.some((c) =>
      job.corridor_label?.toLowerCase().includes(c.toLowerCase())
    ) ? 90 : 40;

    const item: Omit<BrokerBriefItem, 'rank_score'> = {
      item_type: 'pending_job',
      title: `${job.title ?? 'Open load'} needs operator`,
      body: job.corridor_label
        ? `${job.corridor_label} — departs in ${Math.round(departHours)}h`
        : `Departs in ${Math.round(departHours)}h — operator not yet assigned`,
      urgency,
      action_url: `/jobs/${job.id}`,
      action_label: 'Find operators',
      metadata: { job_id: job.id, depart_at: job.depart_at },
    };

    items.push({ ...item, rank_score: rankItem(item, corridorRelevance, 80) });
  }

  // ── Corridor coverage gaps ────────────────────────────────
  for (const corridor of watchCorridors.slice(0, 3)) {
    const { count: onlineOps } = await supabase
      .from('operator_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('availability_status', 'online')
      .ilike('service_area_text', `%${corridor}%`);

    if ((onlineOps ?? 0) < 3) {
      const item: Omit<BrokerBriefItem, 'rank_score'> = {
        item_type: 'shortage',
        title: `Operator shortage: ${corridor}`,
        body: `Only ${onlineOps ?? 0} pilot cars currently online in ${corridor}. Consider pre-booking standby operators.`,
        urgency: (onlineOps ?? 0) === 0 ? 'critical' : 'high',
        action_url: `/directory?corridor=${encodeURIComponent(corridor)}`,
        action_label: 'Find standby operators',
        metadata: { corridor, online_count: onlineOps },
      };
      items.push({ ...item, rank_score: rankItem(item, 100, 90) });
    }
  }

  // ── Operator availability snapshot ────────────────────────
  const { count: totalOnline } = await supabase
    .from('operator_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('country_code', broker.country_code)
    .eq('availability_status', 'online');

  const { count: totalVerified } = await supabase
    .from('operator_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('country_code', broker.country_code)
    .eq('verification_status', 'verified');

  if ((totalOnline ?? 0) > 0) {
    const item: Omit<BrokerBriefItem, 'rank_score'> = {
      item_type: 'standby_pool',
      title: `${totalOnline} verified operators online now`,
      body: `${totalVerified} total verified operators in your market. Tap to filter by corridor and credentials.`,
      urgency: 'low',
      action_url: '/directory?available=now',
      action_label: 'View available operators',
      metadata: { online_count: totalOnline, verified_count: totalVerified },
    };
    items.push({ ...item, rank_score: rankItem(item, 50, 60) });
  }

  // Sort by rank descending
  items.sort((a, b) => b.rank_score - a.rank_score);

  const urgentCount = items.filter((i) => i.urgency === 'critical' || i.urgency === 'high').length;
  const summary =
    urgentCount > 0
      ? `${urgentCount} item${urgentCount > 1 ? 's' : ''} need attention in your corridors`
      : items.length > 0
        ? `${items.length} updates across your watched corridors`
        : 'Your corridors look clear this morning';

  const partialBrief = {
    broker_id: brokerId,
    date: new Date().toISOString().split('T')[0],
    summary,
    urgent_count: urgentCount,
    items: items.slice(0, 8),
  };

  const { title: push_title, body: push_body } = buildBrokerPushCopy(partialBrief);

  return { ...partialBrief, push_title, push_body };
}

/**
 * Persist brief + dispatch push + dashboard card
 */
export async function deliverBrokerBrief(
  brief: BrokerBrief,
  brokerUserId: string,
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  await supabase.from('hc_briefings').upsert({
    entity_id: brief.broker_id,
    briefing_type: 'broker_morning',
    date: brief.date,
    items_json: { items: brief.items },
    summary_text: brief.summary,
    urgent_count: brief.urgent_count,
    job_cards_count: brief.items.filter((i) => i.item_type === 'pending_job').length,
    delivered_at: new Date().toISOString(),
  }, { onConflict: 'entity_id,briefing_type,date' });

  // Fire push if there's actionable content
  if (brief.urgent_count > 0 || brief.items.length > 0) {
    await supabase.from('hc_notifications').insert({
      user_id: brokerUserId,
      title: brief.push_title,
      body: brief.push_body,
      data_json: {
        type: 'broker_briefing',
        date: brief.date,
        urgent_count: brief.urgent_count,
        url: '/dashboard/broker',
      },
      channel: 'push',
      status: 'queued',
    });
  }
}
