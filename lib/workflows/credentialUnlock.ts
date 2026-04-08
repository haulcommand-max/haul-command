/**
 * lib/workflows/credentialUnlock.ts
 * Haul Command — Credential Unlock Engine (Priority #7)
 *
 * Scans operator credential state and produces:
 *   - Gap report: what certifications are missing vs. target markets
 *   - Unlock path: which jobs/markets each credential unlocks
 *   - Renewal alerts: credentials expiring within 60 days
 *   - Broker filter updates: refresh credential-ready pool
 *
 * Scoring: (job_value*0.35) + (market_demand*0.25) + (gap_size_inverse*0.20) + (operator_fit*0.20)
 */

import { createClient } from '@supabase/supabase-js';

export interface CredentialGap {
  credential_type: string;
  label: string;
  is_missing: boolean;
  expires_at?: string;
  days_until_expiry?: number;
  urgency: 'none' | 'info' | 'warning' | 'critical';
  unlock_value_score: number;
  jobs_unlocked: string[];
  markets_unlocked: string[];
  renewal_url?: string;
  info_url?: string;
}

export interface CredentialUnlockReport {
  operator_id: string;
  run_date: string;
  total_gaps: number;
  expiring_soon: number;
  top_gaps: CredentialGap[];
  estimated_additional_earnings_usd?: number;
}

// Master credential registry — what each credential unlocks
const CREDENTIAL_UNLOCK_MAP: Record<string, {
  label: string;
  unlocks_jobs: string[];
  unlocks_markets: string[];
  renewal_url?: string;
  info_url: string;
  avg_job_value_usd: number;
}> = {
  'pilot_car_certification': {
    label: 'Pilot Car Certification',
    unlocks_jobs: ['standard_escort', 'oversize_escort', 'multi_state_escort'],
    unlocks_markets: ['US', 'CA'],
    info_url: 'https://haulcommand.com/training/pilot-car-certification',
    avg_job_value_usd: 450,
  },
  'superload_certification': {
    label: 'Superload Escort Certification',
    unlocks_jobs: ['superload_escort', 'transformer_escort', 'windmill_blade_escort'],
    unlocks_markets: ['US-TX', 'US-WY', 'US-CO', 'US-OK'],
    info_url: 'https://haulcommand.com/training/superload-certification',
    avg_job_value_usd: 950,
  },
  'commercial_vehicle_inspection': {
    label: 'CVSA Commercial Vehicle Inspector',
    unlocks_jobs: ['compliance_inspection', 'pre_trip_inspection'],
    unlocks_markets: ['US', 'CA'],
    info_url: 'https://haulcommand.com/training/cvsa',
    avg_job_value_usd: 300,
  },
  'hmm_flagging': {
    label: 'HMM Flagging Certification (CA)',
    unlocks_jobs: ['california_escort', 'ca_caltrans_escort'],
    unlocks_markets: ['US-CA'],
    info_url: 'https://haulcommand.com/regulations/us/ca',
    avg_job_value_usd: 550,
  },
  'port_access_card': {
    label: 'Port Access / TWIC Card',
    unlocks_jobs: ['port_escort', 'marine_terminal_escort'],
    unlocks_markets: ['US-TX', 'US-LA', 'US-CA', 'US-WA'],
    info_url: 'https://haulcommand.com/training/port-access',
    avg_job_value_usd: 700,
  },
  'hazmat_escort': {
    label: 'Hazmat Escort Certification',
    unlocks_jobs: ['hazmat_escort', 'nuclear_escort', 'chemical_escort'],
    unlocks_markets: ['US'],
    info_url: 'https://haulcommand.com/training/hazmat',
    avg_job_value_usd: 1200,
  },
  'insurance_general_liability': {
    label: 'General Liability Insurance ($1M+)',
    unlocks_jobs: ['standard_escort', 'all_commercial_jobs'],
    unlocks_markets: ['US', 'CA', 'AU'],
    info_url: 'https://haulcommand.com/tools/insurance-compare',
    avg_job_value_usd: 450,
  },
  'au_pilot_vehicle_accreditation': {
    label: 'Queensland Pilot Vehicle Accreditation',
    unlocks_jobs: ['au_escort', 'qld_escort'],
    unlocks_markets: ['AU-QLD', 'AU-NSW'],
    info_url: 'https://haulcommand.com/regulations/au/qld',
    avg_job_value_usd: 380,
  },
};

function scoreGap(
  credType: string,
  marketDemandScore: number,
  operatorFitScore: number,
): number {
  const registry = CREDENTIAL_UNLOCK_MAP[credType];
  if (!registry) return 0;
  const jobValue = Math.min(100, (registry.avg_job_value_usd / 1200) * 100);
  const gapSizeInverse = 80; // Missing = high inverse gap
  return Math.round(
    jobValue * 0.35 +
    marketDemandScore * 0.25 +
    gapSizeInverse * 0.20 +
    operatorFitScore * 0.20
  );
}

export async function runCredentialUnlockReport(
  operatorId: string,
): Promise<CredentialUnlockReport> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Load operator's existing credentials
  const { data: existingCreds } = await supabase
    .from('hc_credentials')
    .select('credential_type, expires_at, status, verified_at')
    .eq('entity_id', operatorId);

  const credMap = new Map<string, { expires_at?: string; status: string }>();
  for (const cred of existingCreds ?? []) {
    credMap.set(cred.credential_type, { expires_at: cred.expires_at, status: cred.status });
  }

  const gaps: CredentialGap[] = [];
  const now = Date.now();

  for (const [credType, registry] of Object.entries(CREDENTIAL_UNLOCK_MAP)) {
    const existing = credMap.get(credType);

    if (!existing) {
      // Missing credential
      gaps.push({
        credential_type: credType,
        label: registry.label,
        is_missing: true,
        urgency: 'info',
        unlock_value_score: scoreGap(credType, 60, 70),
        jobs_unlocked: registry.unlocks_jobs,
        markets_unlocked: registry.unlocks_markets,
        info_url: registry.info_url,
      });
    } else if (existing.expires_at) {
      // Expiring credential check
      const daysLeft = Math.ceil(
        (new Date(existing.expires_at).getTime() - now) / 86_400_000
      );
      if (daysLeft < 60) {
        gaps.push({
          credential_type: credType,
          label: registry.label,
          is_missing: false,
          expires_at: existing.expires_at,
          days_until_expiry: daysLeft,
          urgency: daysLeft < 0 ? 'critical' : daysLeft < 14 ? 'warning' : 'info',
          unlock_value_score: scoreGap(credType, 60, 70),
          jobs_unlocked: registry.unlocks_jobs,
          markets_unlocked: registry.unlocks_markets,
          renewal_url: registry.renewal_url,
          info_url: registry.info_url,
        });
      }
    }
  }

  // Sort by unlock_value_score desc, then urgency
  gaps.sort((a, b) => {
    const urgWeight = { critical: 1000, warning: 500, info: 0, none: 0 };
    return (b.unlock_value_score + (urgWeight[b.urgency] ?? 0)) -
      (a.unlock_value_score + (urgWeight[a.urgency] ?? 0));
  });

  const expiringCount = gaps.filter((g) => !g.is_missing && g.days_until_expiry !== undefined && g.days_until_expiry < 60).length;

  // Estimate additional earnings if top 3 gaps are filled
  const top3 = gaps.slice(0, 3);
  const additionalEarnings = top3.reduce((sum, gap) => {
    const reg = CREDENTIAL_UNLOCK_MAP[gap.credential_type];
    return sum + (reg?.avg_job_value_usd ?? 0) * 4; // 4 jobs/month estimate
  }, 0);

  // Write report to credential_events
  await supabase.from('hc_credential_events').insert({
    entity_id: operatorId,
    event_type: 'gap_report_generated',
    data_json: {
      total_gaps: gaps.length,
      expiring_soon: expiringCount,
      top_gaps: gaps.slice(0, 5),
      estimated_additional_earnings_usd: additionalEarnings,
    },
  });

  // Queue alerts for critical/warning items
  const urgent = gaps.filter((g) => g.urgency === 'critical' || g.urgency === 'warning');
  for (const gap of urgent) {
    await supabase.from('hc_notifications').insert({
      user_id: operatorId, // resolved to actual user_id by caller
      title: gap.urgency === 'critical'
        ? `🔴 ${gap.label} has expired`
        : `⚠️ ${gap.label} expires in ${gap.days_until_expiry} days`,
      body: `Renew to keep your ${gap.markets_unlocked.join(', ')} market access active.`,
      data_json: { type: 'credential_nudge', credential_type: gap.credential_type, url: gap.renewal_url ?? gap.info_url },
      channel: 'push',
      status: 'queued',
    });
  }

  return {
    operator_id: operatorId,
    run_date: new Date().toISOString().split('T')[0],
    total_gaps: gaps.length,
    expiring_soon: expiringCount,
    top_gaps: gaps.slice(0, 8),
    estimated_additional_earnings_usd: Math.round(additionalEarnings),
  };
}
