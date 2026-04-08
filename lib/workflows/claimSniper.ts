/**
 * lib/workflows/claimSniper.ts
 * Haul Command — Claim Sniper Workflow (Priority #1 ROI)
 *
 * Finds high-value unclaimed listings, scores candidates, builds
 * personalized claim packets, syncs to Twenty CRM, and queues outreach.
 *
 * Workflow: claim_sniper
 * Scoring:  (listing_score*0.35) + (market_demand*0.25) + (corridor_relevance*0.20) + (traffic_potential*0.10) + (missing_value*0.10)
 * Threshold: 80 = hot lead
 *
 * Called by: /api/cron/claim-sniper/route.ts (daily 07:00)
 *            /api/workflows/trigger/route.ts (manual admin trigger)
 */

import { createClient } from '@supabase/supabase-js';

export interface ClaimCandidate {
  entity_id: string;
  hc_id?: string;
  display_name: string;
  country_code: string;
  city_name?: string;
  region_code?: string;
  primary_role?: string;
  listing_score: number;
  market_demand_score: number;
  corridor_relevance_score: number;
  traffic_potential_score: number;
  missing_value_score: number;
  composite_score: number;
  claim_status: 'unclaimed' | 'claimed' | 'pending';
  contact_email?: string;
  contact_phone?: string;
  missing_fields: string[];
  outreach_count: number;
  last_outreach_at?: string;
}

export interface ClaimPacket {
  entity_id: string;
  candidate: ClaimCandidate;
  packet_text: string;
  missing_value_bullets: string[];
  claim_url: string;
  priority: 'hot' | 'warm' | 'cold';
  twenty_contact_payload: Record<string, unknown>;
  twenty_task_payload: Record<string, unknown>;
}

// ─── Scoring ──────────────────────────────────────────────
export function scoreCandinate(c: Partial<ClaimCandidate>): number {
  const ls = Math.min(100, c.listing_score ?? 50);
  const md = Math.min(100, c.market_demand_score ?? 30);
  const cr = Math.min(100, c.corridor_relevance_score ?? 20);
  const tp = Math.min(100, c.traffic_potential_score ?? 20);
  const mv = Math.min(100, c.missing_value_score ?? 50);
  return Math.round(
    ls * 0.35 + md * 0.25 + cr * 0.20 + tp * 0.10 + mv * 0.10
  );
}

function buildMissingValueBullets(candidate: ClaimCandidate): string[] {
  const bullets: string[] = [];
  if (!candidate.contact_email) bullets.push('No contact email — brokers cannot reach you directly');
  if (candidate.missing_fields.includes('photo')) bullets.push('No profile photos — operators with photos get 3× more views');
  if (candidate.missing_fields.includes('insurance')) bullets.push('Insurance not verified — reduces trust score by 40%');
  if (candidate.missing_fields.includes('certifications')) bullets.push('No certifications on file — blocks high-value load matching');
  if (candidate.missing_fields.includes('service_areas')) bullets.push('Service areas not defined — invisible on corridor search');
  if (candidate.listing_score < 60) bullets.push(`Listing health score: ${candidate.listing_score}/100 — claim to improve`);
  return bullets.slice(0, 5);
}

function buildPacketText(candidate: ClaimCandidate, bullets: string[]): string {
  const city = candidate.city_name ? `${candidate.city_name}, ` : '';
  const region = candidate.region_code ? `${candidate.region_code.toUpperCase()}, ` : '';
  const country = candidate.country_code.toUpperCase();
  const location = `${city}${region}${country}`;

  return `Hi ${candidate.display_name},

Your business listing on Haul Command covers ${location} — but it hasn't been claimed yet.

Brokers in your area search Haul Command for qualified ${candidate.primary_role ?? 'escort'} operators before posting loads. An unclaimed listing means you're invisible when it matters most.

Here's what claiming takes 2 minutes to fix:
${bullets.map(b => `• ${b}`).join('\n')}

Claiming is free. Once verified, your profile becomes searchable, your trust score activates, and you start appearing in load matching.

Claim your profile: https://haulcommand.com/claim/${candidate.entity_id}

— Haul Command`;
}

// ─── Main workflow runner ─────────────────────────────────
export async function runClaimSniper(options: {
  marketScope?: string;
  minScore?: number;
  maxCandidates?: number;
  dryRun?: boolean;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { minScore = 55, maxCandidates = 50, dryRun = false, marketScope } = options;

  // ── Step 1: Scan candidates ──────────────────────────────
  let query = supabase
    .from('hc_entities')
    .select(`
      id,
      hc_id,
      display_name,
      country_code,
      region_code,
      city_name,
      claim_status,
      contact_email,
      contact_phone,
      primary_role_type,
      listing_score,
      composite_score
    `)
    .eq('claim_status', 'unclaimed')
    .not('listing_score', 'is', null)
    .gte('listing_score', 30)
    .limit(maxCandidates);

  if (marketScope) {
    query = query.eq('country_code', marketScope.toUpperCase());
  }

  const { data: rawCandidates, error: scanErr } = await query;
  if (scanErr) throw new Error(`[claimSniper] scan error: ${scanErr.message}`);
  if (!rawCandidates?.length) return { processed: 0, packets: [] };

  // ── Step 2: Check outreach suppression ───────────────────
  const entityIds = rawCandidates.map((e: any) => e.id);
  const { data: outreachLogs } = await supabase
    .from('hc_outreach_log')
    .select('entity_id, touch_count, last_replied_at, sent_at')
    .in('entity_id', entityIds)
    .eq('workflow_key', 'claim_sniper')
    .order('sent_at', { ascending: false });

  const outreachMap = new Map<string, { touch_count: number; last_sent_at: string }>();
  for (const log of outreachLogs ?? []) {
    if (!outreachMap.has(log.entity_id)) {
      outreachMap.set(log.entity_id, { touch_count: log.touch_count, last_sent_at: log.sent_at });
    }
  }

  // ── Step 3: Score + filter ────────────────────────────────
  const packets: ClaimPacket[] = [];
  const SUPPRESSION_DAYS = 7;
  const MAX_TOUCHES = 4;

  for (const raw of rawCandidates) {
    const outreach = outreachMap.get(raw.id);

    // Suppression checks
    if (outreach) {
      if (outreach.touch_count >= MAX_TOUCHES) continue;
      const daysSinceLast = (Date.now() - new Date(outreach.last_sent_at).getTime()) / 86_400_000;
      if (daysSinceLast < SUPPRESSION_DAYS) continue;
    }

    // Build candidate
    const candidate: ClaimCandidate = {
      entity_id: raw.id,
      hc_id: raw.hc_id,
      display_name: raw.display_name ?? 'Operator',
      country_code: raw.country_code ?? 'US',
      city_name: raw.city_name,
      region_code: raw.region_code,
      primary_role: raw.primary_role_type,
      listing_score: raw.listing_score ?? 50,
      market_demand_score: 60, // TODO: wire to real market demand table
      corridor_relevance_score: 50,
      traffic_potential_score: 40,
      missing_value_score: raw.listing_score < 60 ? 80 : 40,
      composite_score: 0,
      claim_status: 'unclaimed',
      contact_email: raw.contact_email,
      contact_phone: raw.contact_phone,
      missing_fields: [], // TODO: deserialize from listing_states
      outreach_count: outreach?.touch_count ?? 0,
    };

    candidate.composite_score = scoreCandinate(candidate);
    if (candidate.composite_score < minScore) continue;

    const missing = buildMissingValueBullets(candidate);
    const packetText = buildPacketText(candidate, missing);

    const packet: ClaimPacket = {
      entity_id: raw.id,
      candidate,
      packet_text: packetText,
      missing_value_bullets: missing,
      claim_url: `https://haulcommand.com/claim/${raw.id}`,
      priority: candidate.composite_score >= 80 ? 'hot' : candidate.composite_score >= 65 ? 'warm' : 'cold',
      twenty_contact_payload: {
        name: candidate.display_name,
        city: candidate.city_name,
        country: candidate.country_code,
        phone: candidate.contact_phone,
        domainName: candidate.contact_email?.split('@')[1],
        linkedinLink: { url: null },
      },
      twenty_task_payload: {
        title: `Claim Sniper: ${candidate.display_name} (${candidate.country_code})`,
        body: packetText,
        dueAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
        status: 'TODO',
      },
    };

    packets.push(packet);
  }

  // Sort by composite score descending
  packets.sort((a, b) => b.candidate.composite_score - a.candidate.composite_score);

  if (dryRun) {
    return { processed: packets.length, packets, dryRun: true };
  }

  // ── Step 4: Write outreach queue items ────────────────────
  if (packets.length > 0) {
    await supabase.from('hc_workflow_queues').insert(
      packets.map((p) => ({
        workflow_run_id: null, // set by caller
        queue_name: 'claim.create_packet',
        worker_key: 'claim-worker',
        entity_id: p.entity_id,
        payload_json: {
          packet_text: p.packet_text,
          claim_url: p.claim_url,
          priority: p.priority,
          composite_score: p.candidate.composite_score,
          twenty_contact_payload: p.twenty_contact_payload,
          twenty_task_payload: p.twenty_task_payload,
        },
        priority: p.priority === 'hot' ? 90 : p.priority === 'warm' ? 70 : 50,
      }))
    );
  }

  return {
    processed: packets.length,
    hot: packets.filter((p) => p.priority === 'hot').length,
    warm: packets.filter((p) => p.priority === 'warm').length,
    cold: packets.filter((p) => p.priority === 'cold').length,
    packets: packets.slice(0, 10), // return sample
  };
}
