export type DA97Competitor =
  | 'ods'
  | 'esc'
  | 'jj_keller'
  | 'pilot_car_loads'
  | 'oversize_io'
  | 'legacy_directory';

export type DA97GapStatus = 'open' | 'planned' | 'in_progress' | 'closed' | 'turned_into_moat';

export type DA97DirectoryPillar =
  | 'identity_graph'
  | 'claim_machine'
  | 'job_activation'
  | 'trust_proof'
  | 'regulation_evidence'
  | 'training_credential'
  | 'local_near_me'
  | 'glossary_aeo'
  | 'adgrid_revenue'
  | 'data_product';

export type DA97Gap = {
  id: string;
  competitor: DA97Competitor;
  competitorStrength: string;
  haulCommandCounter: string;
  pillar: DA97DirectoryPillar;
  minimum15xImprovement: string;
  moatCreated: string;
  requiredSurfaces: string[];
  requiredDataSignals: string[];
  requiredGuardrails: string[];
  revenuePath: string;
  status: DA97GapStatus;
};

export type DA97GapScore = {
  gapId: string;
  score: number;
  status: DA97GapStatus;
  missing: string[];
  nextAction: string;
};

export const DA97_DIRECTORY_GAPS: DA97Gap[] = [
  {
    id: 'ods-managed-network-to-operating-graph',
    competitor: 'ods',
    competitorStrength: 'Managed pilot-car network, project planning, route surveys, consolidated invoicing, and service confidence.',
    haulCommandCounter: 'Turn every provider into a claimable, searchable, ranked, job-activated node with availability, proof, report cards, and trip-packet participation.',
    pillar: 'job_activation',
    minimum15xImprovement: 'Every role profile must show how that role gets work, proves readiness, and participates in a load or route workflow.',
    moatCreated: 'A public heavy-haul support graph that service-only networks cannot expose without changing their whole model.',
    requiredSurfaces: ['/directory', '/directory/dossier/[id]', '/claim', '/loads', '/available-now', '/report-card/[operatorId]'],
    requiredDataSignals: ['claim_status', 'availability', 'service_area', 'completed_jobs', 'report_card_score', 'response_signal'],
    requiredGuardrails: ['No fake availability', 'No fake verified status', 'Paid placement cannot hide trust state'],
    revenuePath: 'Fast Lane, urgent-fill fees, broker priority, corridor priority, verified profile',
    status: 'in_progress',
  },
  {
    id: 'esc-training-authority-to-job-unlocks',
    competitor: 'esc',
    competitorStrength: 'Training authority, certification recognition, PEVO/WITPAC trust, and credential verification.',
    haulCommandCounter: 'Map credentials to roles, countries, corridors, job eligibility, profile badges, and training provider routing.',
    pillar: 'training_credential',
    minimum15xImprovement: 'Training pages must not stop at education; they must show what loads, roles, corridors, and profile trust the credential unlocks.',
    moatCreated: 'Credential-to-work graph that makes training economically measurable instead of only educational.',
    requiredSurfaces: ['/training', '/training/[slug]', '/roles/[role]', '/directory/dossier/[id]', '/tools/certification-reciprocity-checker'],
    requiredDataSignals: ['credential_key', 'issuer', 'country_code', 'renewal_period', 'profile_badge_effect', 'dispatch_eligibility_effect'],
    requiredGuardrails: ['Do not imply official accreditation without evidence', 'Show source and renewal confidence'],
    revenuePath: 'Training referrals, academy enrollment, verified credential upgrade, employer/fleet training packages',
    status: 'planned',
  },
  {
    id: 'jj-keller-compliance-to-source-backed-regulation',
    competitor: 'jj_keller',
    competitorStrength: 'Compliance authority, regulatory content, safety products, and enterprise trust.',
    haulCommandCounter: 'Build country and region regulation pages from official-source evidence with confidence, freshness, and correction workflows.',
    pillar: 'regulation_evidence',
    minimum15xImprovement: 'Any legal, permit, required, escort, police, sign, light, flag, or hours claim must point to source evidence and a freshness date.',
    moatCreated: 'Global regulation evidence layer attached to jobs, profiles, tools, glossary, PDFs, and government correction loops.',
    requiredSurfaces: ['/regulations', '/regulations/[country]', '/regulations/[country]/[region]', '/tools/permit-checker', '/glossary/[slug]'],
    requiredDataSignals: ['source_url', 'source_type', 'freshness_date', 'confidence_score', 'review_status', 'change_candidate'],
    requiredGuardrails: ['Safe legal wording', 'Confidence labels', 'Human or agent review before high-risk PDF publication'],
    revenuePath: 'Compliance packet exports, permit-service leads, enterprise API, regulation page sponsorship',
    status: 'in_progress',
  },
  {
    id: 'pilot-car-loads-to-takeability-matching',
    competitor: 'pilot_car_loads',
    competitorStrength: 'Simple load-board behavior, alerts, and direct broker/operator contact.',
    haulCommandCounter: 'Wrap load listings with takeability score, payer reliability, deadhead economics, escrow/Fast Pay, role fit, and autonomous matching.',
    pillar: 'job_activation',
    minimum15xImprovement: 'No load should just be a post; every load should explain whether it is worth taking and what proof is missing.',
    moatCreated: 'Load intelligence that turns old load boards into incomplete lists.',
    requiredSurfaces: ['/loads', '/load-board', '/api/loads/fit', '/tools/load-analyzer', '/dashboard/operator'],
    requiredDataSignals: ['rate', 'market_rate', 'deadhead_miles', 'payer_reliability', 'credential_match', 'equipment_match', 'escrow_available'],
    requiredGuardrails: ['Do not label a payer unsafe without evidence', 'Show limited-history language when data is incomplete'],
    revenuePath: 'Urgent-fill fees, Fast Lane alerts, escrow/Fast Pay, broker priority',
    status: 'in_progress',
  },
  {
    id: 'oversize-io-permit-tools-to-role-journeys',
    competitor: 'oversize_io',
    competitorStrength: 'Permit, quote, and cost tooling for oversize/overweight operations.',
    haulCommandCounter: 'Make permit/cost intelligence one module inside role journeys, trip packets, provider matching, and AdGrid intent.',
    pillar: 'regulation_evidence',
    minimum15xImprovement: 'Every calculator result must include primary answer, risk warning, next action, provider category, save-to-packet CTA, and AdGrid context.',
    moatCreated: 'Workflow capture beyond the calculator page.',
    requiredSurfaces: ['/tools', '/tools/permit-cost-calculator', '/tools/escort-calculator', '/tools/total-trip-cost-calculator', '/quote'],
    requiredDataSignals: ['role_key', 'country_code', 'dimensions', 'permit_status', 'escort_required', 'route_risk', 'next_action_clicked'],
    requiredGuardrails: ['No compliance certainty without source evidence', 'Data-limited countries get safe fallback actions'],
    revenuePath: 'Permit-service leads, Trip Packet export, route survey leads, AdGrid journey slots',
    status: 'planned',
  },
  {
    id: 'legacy-directory-to-claimable-trust-graph',
    competitor: 'legacy_directory',
    competitorStrength: 'Old directory SEO, phone-number discovery, and category familiarity.',
    haulCommandCounter: 'Turn static records into canonical entities with claim status, role confidence, service area, report cards, links, and job activation.',
    pillar: 'identity_graph',
    minimum15xImprovement: 'Every indexable profile must either be useful and claimable or clearly marked data-limited with a correction path.',
    moatCreated: 'Entity graph plus claim funnel plus local SEO footprint that a static directory cannot match.',
    requiredSurfaces: ['/directory', '/directory/[country]', '/directory/dossier/[id]', '/near-me', '/claim'],
    requiredDataSignals: ['canonical_entity_id', 'duplicate_risk', 'role_confidence', 'profile_completeness', 'claim_priority', 'source_confidence'],
    requiredGuardrails: ['Dedupe before publishing aggressively', 'Noindex weak seeded pages', 'Report incorrect listing path'],
    revenuePath: 'Road Ready, Fast Lane, verified profile, city/corridor sponsorship',
    status: 'in_progress',
  },
];

export function scoreDA97Gap(gap: DA97Gap): DA97GapScore {
  const missing: string[] = [];
  if (gap.requiredSurfaces.length < 3) missing.push('Needs at least three connected product surfaces.');
  if (gap.requiredDataSignals.length < 5) missing.push('Needs richer data signals to become measurable.');
  if (gap.requiredGuardrails.length < 2) missing.push('Needs stronger trust and legal guardrails.');
  if (!gap.revenuePath.trim()) missing.push('Needs a revenue path.');
  if (!gap.moatCreated.trim()) missing.push('Needs an explicit moat.');
  if (!gap.minimum15xImprovement.trim()) missing.push('Needs a 15X improvement statement.');

  const base =
    Math.min(30, gap.requiredSurfaces.length * 5) +
    Math.min(30, gap.requiredDataSignals.length * 4) +
    Math.min(20, gap.requiredGuardrails.length * 7) +
    (gap.revenuePath ? 10 : 0) +
    (gap.moatCreated ? 10 : 0);

  const completenessFloor = missing.length === 0 ? 90 : 0;

  return {
    gapId: gap.id,
    score: Math.min(100, Math.max(base, completenessFloor)),
    status: missing.length === 0 && gap.status === 'closed' ? 'closed' : gap.status,
    missing,
    nextAction: getNextAction(gap, missing),
  };
}

export function getDA97GapDashboard(gaps: DA97Gap[] = DA97_DIRECTORY_GAPS) {
  const scores = gaps.map(scoreDA97Gap);
  const openOrPlanned = scores.filter((score) => score.status === 'open' || score.status === 'planned');
  const inProgress = scores.filter((score) => score.status === 'in_progress');
  const moatReady = scores.filter((score) => score.score >= 90 && score.missing.length === 0);

  return {
    total: gaps.length,
    averageScore: Math.round(scores.reduce((sum, score) => sum + score.score, 0) / Math.max(scores.length, 1)),
    openOrPlanned: openOrPlanned.length,
    inProgress: inProgress.length,
    moatReady: moatReady.length,
    scores,
  };
}

function getNextAction(gap: DA97Gap, missing: string[]): string {
  if (missing.length > 0) return missing[0];
  if (gap.status === 'planned') return `Start ${gap.id} by wiring ${gap.requiredSurfaces[0]} to ${gap.requiredDataSignals[0]}.`;
  if (gap.status === 'in_progress') return `Close ${gap.id} by proving the signals on live surfaces and adding dashboard visibility.`;
  if (gap.status === 'closed') return `Promote ${gap.id} into a public proof page and keep monitoring freshness.`;
  if (gap.status === 'turned_into_moat') return `Defend ${gap.id} with refresh cadence, internal links, and revenue attribution.`;
  return `Assign an owner and turn ${gap.id} into a product sprint.`;
}
