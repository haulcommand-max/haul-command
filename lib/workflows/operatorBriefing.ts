/**
 * lib/workflows/operatorBriefing.ts
 * Haul Command — Operator Opportunity Briefing Workflow
 *
 * Generates personalized daily briefings for operators:
 *   - Job opportunities matching role + location
 *   - Credential nudges (expiring or missing)
 *   - Profile rescue actions (weak listing score)
 *   - Corridor demand signals in their area
 *
 * Scoring: (fit*0.35) + (distance*0.20) + (urgency*0.15) + (earnings*0.15) + (credential_alignment*0.15)
 *
 * Called by: /api/cron/operator-briefing/route.ts (daily 07:00)
 */

import { createClient } from '@supabase/supabase-js';

export interface BriefingJobCard {
  job_id: string;
  title: string;
  corridor: string;
  pickup_date?: string;
  estimated_earnings?: number;
  currency?: string;
  distance_km?: number;
  required_credentials: string[];
  fit_score: number;
  urgency: 'normal' | 'urgent' | 'expiring';
  claim_url: string;
}

export interface CredentialNudge {
  credential_key: string;
  label: string;
  expires_at?: string;
  days_until_expiry?: number;
  unlock_value: string;
  action_url: string;
  urgency: 'info' | 'warning' | 'critical';
}

export interface ProfileRescueAction {
  action_type: string;
  label: string;
  current_score: number;
  score_impact: number;
  action_url: string;
}

export interface OperatorBrief {
  operator_id: string;
  date: string;
  summary: string;
  urgent_count: number;
  job_cards: BriefingJobCard[];
  credential_nudges: CredentialNudge[];
  profile_rescue_actions: ProfileRescueAction[];
  push_title: string;
  push_body: string;
}

// ─── Helpers ──────────────────────────────────────────────
function scoreJob(job: any, operator: any): number {
  const fit = job.role_type === operator.primary_role_type ? 100 : 50;
  const distanceScore = job.distance_km
    ? Math.max(0, 100 - (job.distance_km / 5)) // drops by 1 point per 5km
    : 60;
  const urgency = job.depart_within_hours < 24 ? 100 : job.depart_within_hours < 72 ? 60 : 30;
  const earnings = Math.min(100, (job.estimated_earnings ?? 0) / 20); // $2000 = 100
  const credAlign = 80; // TODO: wire to actual credential check

  return Math.round(fit * 0.35 + distanceScore * 0.20 + urgency * 0.15 + earnings * 0.15 + credAlign * 0.15);
}

function buildPushCopy(brief: Omit<OperatorBrief, 'push_title' | 'push_body'>): { title: string; body: string } {
  if (brief.urgent_count > 0) {
    const urgentJob = brief.job_cards.find((j) => j.urgency === 'urgent');
    if (urgentJob) {
      return {
        title: `🔴 Urgent: Load match in ${urgentJob.corridor}`,
        body: `Departing soon — open to claim before another operator does.`,
      };
    }
  }

  if (brief.job_cards.length > 0) {
    return {
      title: `⚡ ${brief.job_cards.length} new load${brief.job_cards.length > 1 ? 's' : ''} matching your profile`,
      body: brief.job_cards[0]?.corridor
        ? `Top match: ${brief.job_cards[0].corridor}`
        : `Open to see your opportunities for today.`,
    };
  }

  if (brief.credential_nudges.some((n) => n.urgency === 'critical')) {
    const crit = brief.credential_nudges.find((n) => n.urgency === 'critical')!;
    return {
      title: `⚠️ Action needed: ${crit.label} expiring soon`,
      body: `${crit.days_until_expiry} days left — renew now to stay active.`,
    };
  }

  return {
    title: `Good morning — your Haul Command brief is ready`,
    body: brief.summary,
  };
}

// ─── Main briefing builder ────────────────────────────────
export async function buildOperatorBrief(operatorId: string): Promise<OperatorBrief | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Load operator profile
  const { data: operator, error: opErr } = await supabase
    .from('operator_profiles')
    .select(`
      id,
      user_id,
      display_name,
      country_code,
      region_code,
      city_name,
      lat,
      lng,
      primary_role_type,
      listing_score,
      composite_score,
      availability_status
    `)
    .eq('id', operatorId)
    .single();

  if (opErr || !operator) return null;

  // ── Jobs matching operator ────────────────────────────────
  const { data: jobs } = await supabase
    .from('hc_jobs')
    .select('*')
    .eq('status', 'open')
    .eq('country_code', operator.country_code)
    .limit(10);

  const jobCards: BriefingJobCard[] = (jobs ?? [])
    .map((job: any) => ({
      job_id: job.id,
      title: job.title ?? `${job.role_type} needed`,
      corridor: job.corridor_label ?? `${job.origin_city} → ${job.destination_city}`,
      pickup_date: job.depart_at,
      estimated_earnings: job.estimated_earnings,
      currency: job.currency ?? 'USD',
      distance_km: job.distance_km,
      required_credentials: job.required_credentials ?? [],
      fit_score: scoreJob(job, operator),
      urgency: job.depart_within_hours < 24 ? 'urgent' : job.depart_within_hours < 72 ? 'expiring' : 'normal',
      claim_url: `https://haulcommand.com/jobs/${job.id}`,
    }))
    .sort((a: BriefingJobCard, b: BriefingJobCard) => b.fit_score - a.fit_score)
    .slice(0, 5);

  // ── Credentials ────────────────────────────────────────────
  const { data: credentials } = await supabase
    .from('hc_credentials')
    .select('*')
    .eq('entity_id', operatorId);

  const credentialNudges: CredentialNudge[] = [];
  const now = Date.now();
  for (const cred of credentials ?? []) {
    if (!cred.expires_at) continue;
    const daysLeft = Math.ceil((new Date(cred.expires_at).getTime() - now) / 86_400_000);
    if (daysLeft < 60) {
      credentialNudges.push({
        credential_key: cred.credential_type,
        label: cred.display_name ?? cred.credential_type,
        expires_at: cred.expires_at,
        days_until_expiry: daysLeft,
        unlock_value: daysLeft < 0 ? 'Profile currently suspended for this credential' : `Renew to stay qualified for loads in ${operator.region_code}`,
        action_url: `/dashboard/operator/credentials/${cred.id}`,
        urgency: daysLeft < 0 ? 'critical' : daysLeft < 14 ? 'warning' : 'info',
      });
    }
  }

  // ── Profile rescue actions ────────────────────────────────
  const profileRescueActions: ProfileRescueAction[] = [];
  const listingScore = operator.listing_score ?? 0;
  if (listingScore < 80) {
    if (!operator.lat || !operator.lng) {
      profileRescueActions.push({
        action_type: 'add_location',
        label: 'Add your precise location',
        current_score: listingScore,
        score_impact: 15,
        action_url: '/dashboard/operator/profile#location',
      });
    }
    if (listingScore < 60) {
      profileRescueActions.push({
        action_type: 'add_photos',
        label: 'Add vehicle photos to your profile',
        current_score: listingScore,
        score_impact: 10,
        action_url: '/dashboard/operator/profile#photos',
      });
    }
  }

  const urgentCount = jobCards.filter((j) => j.urgency === 'urgent').length
    + credentialNudges.filter((n) => n.urgency === 'critical').length;

  const summary =
    jobCards.length > 0
      ? `${jobCards.length} load match${jobCards.length > 1 ? 'es' : ''} near you today` +
        (credentialNudges.length > 0 ? ` + ${credentialNudges.length} credential reminder${credentialNudges.length > 1 ? 's' : ''}` : '')
      : credentialNudges.length > 0
        ? `${credentialNudges.length} credential reminder${credentialNudges.length > 1 ? 's' : ''} waiting`
        : `Your corridor looks quiet today — profile stays live`;

  const partialBrief = {
    operator_id: operatorId,
    date: new Date().toISOString().split('T')[0],
    summary,
    urgent_count: urgentCount,
    job_cards: jobCards,
    credential_nudges: credentialNudges,
    profile_rescue_actions: profileRescueActions,
  };

  const { title: push_title, body: push_body } = buildPushCopy(partialBrief);

  const brief: OperatorBrief = { ...partialBrief, push_title, push_body };

  return brief;
}

/**
 * Persist brief to hc_briefings and dispatch push notification.
 */
export async function deliverOperatorBrief(
  brief: OperatorBrief,
  operatorUserId: string,
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Write to briefings table
  await supabase.from('hc_briefings').upsert({
    entity_id: brief.operator_id,
    briefing_type: 'operator_opportunity',
    date: brief.date,
    items_json: {
      job_cards: brief.job_cards,
      credential_nudges: brief.credential_nudges,
      profile_rescue_actions: brief.profile_rescue_actions,
    },
    summary_text: brief.summary,
    urgent_count: brief.urgent_count,
    job_cards_count: brief.job_cards.length,
    credential_nudges_count: brief.credential_nudges.length,
  }, { onConflict: 'entity_id,briefing_type,date' });

  // Queue push notification via Firebase
  if (brief.job_cards.length > 0 || brief.urgent_count > 0) {
    await supabase.from('hc_notifications').insert({
      user_id: operatorUserId,
      title: brief.push_title,
      body: brief.push_body,
      data_json: {
        type: 'operator_briefing',
        date: brief.date,
        urgent_count: brief.urgent_count,
        url: '/dashboard/operator',
      },
      channel: 'push',
      status: 'queued',
    });
  }
}
