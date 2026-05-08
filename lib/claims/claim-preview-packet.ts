export type ClaimRoleKey =
  | 'pilot_car_operator'
  | 'broker'
  | 'carrier'
  | 'permit_service'
  | 'route_surveyor'
  | 'equipment_supplier'
  | 'service_provider';

export type ClaimPreviewInput = {
  name?: string | null;
  roleKey?: string | null;
  city?: string | null;
  region?: string | null;
  countryCode?: string | null;
  isClaimed?: boolean | null;
  confidenceScore?: number | null;
  actualSearchAppearances?: number | null;
  actualProfileViews?: number | null;
  actualDemandMatches?: number | null;
};

export type ClaimPreviewMetric = {
  label: string;
  value: string;
  evidence: 'actual' | 'eligibility';
};

export type ClaimPreviewPacket = {
  roleKey: ClaimRoleKey;
  roleLabel: string;
  headline: string;
  summary: string;
  statusLabel: string;
  locationLabel: string;
  profileCompleteness: number;
  metrics: ClaimPreviewMetric[];
  missingTrustItems: string[];
  nextActions: string[];
  paidTrigger: string;
};

const ROLE_COPY: Record<ClaimRoleKey, {
  label: string;
  summary: string;
  missing: string[];
  nextActions: string[];
  paidTrigger: string;
}> = {
  pilot_car_operator: {
    label: 'Pilot car operator',
    summary: 'Claim to confirm coverage area, equipment, availability, and job-alert preferences.',
    missing: ['service area', 'equipment proof', 'availability', 'job-alert preferences'],
    nextActions: ['Claim free', 'Confirm service area', 'Turn on job alerts'],
    paidTrigger: 'Fast Lane becomes useful after the profile is complete and matching demand is visible.',
  },
  broker: {
    label: 'Broker or load buyer',
    summary: 'Claim to post coverage needs, show lanes, and route urgent loads to qualified support.',
    missing: ['lane focus', 'posting preferences', 'payment expectations', 'urgent-fill contact path'],
    nextActions: ['Claim free', 'Post coverage need', 'Set urgent-fill preferences'],
    paidTrigger: 'Broker Priority becomes useful when urgent coverage or repeated posting starts.',
  },
  carrier: {
    label: 'Heavy haul carrier',
    summary: 'Claim to connect loads with pilot cars, route support, permits, and trip-packet workflows.',
    missing: ['service lanes', 'load types', 'permit workflow', 'preferred support categories'],
    nextActions: ['Claim free', 'Define lanes', 'Create trip packet'],
    paidTrigger: 'Priority routing becomes useful when recurring route support demand is active.',
  },
  permit_service: {
    label: 'Permit service',
    summary: 'Claim to show jurisdictions, permit types, turnaround expectations, and quote routing.',
    missing: ['covered jurisdictions', 'permit types', 'turnaround time', 'quote intake path'],
    nextActions: ['Claim free', 'Add jurisdictions', 'Enable quote routing'],
    paidTrigger: 'Sponsored state and corridor placement becomes useful after coverage is verified.',
  },
  route_surveyor: {
    label: 'Route survey specialist',
    summary: 'Claim to show specialist capability for complex, high-risk, or high-clearance moves.',
    missing: ['survey capability', 'route equipment', 'coverage area', 'proof examples'],
    nextActions: ['Claim free', 'Add specialist proof', 'Enable premium lead routing'],
    paidTrigger: 'Specialist priority becomes useful when complex-load demand appears in covered corridors.',
  },
  equipment_supplier: {
    label: 'Equipment supplier or installer',
    summary: 'Claim to appear when operators need lights, signs, radios, flags, mounts, and RouteReady gear.',
    missing: ['product categories', 'installer coverage', 'shipping area', 'support contact'],
    nextActions: ['Claim free', 'Add gear categories', 'Enable RouteReady placement'],
    paidTrigger: 'Sponsored gear placement becomes useful once product/category coverage is complete.',
  },
  service_provider: {
    label: 'Heavy haul support provider',
    summary: 'Claim to confirm role, service area, proof items, and how buyers should contact you.',
    missing: ['primary role', 'service area', 'proof items', 'contact preferences'],
    nextActions: ['Claim free', 'Confirm role', 'Choose contact preferences'],
    paidTrigger: 'Paid priority becomes useful after the free profile creates measurable discovery or lead signals.',
  },
};

export function normalizeClaimRole(roleKey?: string | null): ClaimRoleKey {
  const key = (roleKey || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (key.includes('broker')) return 'broker';
  if (key.includes('carrier') || key.includes('hauler')) return 'carrier';
  if (key.includes('permit')) return 'permit_service';
  if (key.includes('survey')) return 'route_surveyor';
  if (key.includes('supplier') || key.includes('equipment') || key.includes('installer')) return 'equipment_supplier';
  if (key.includes('pilot') || key.includes('escort') || key.includes('operator')) return 'pilot_car_operator';
  return 'service_provider';
}

export function buildClaimPreviewPacket(input: ClaimPreviewInput): ClaimPreviewPacket {
  const roleKey = normalizeClaimRole(input.roleKey);
  const copy = ROLE_COPY[roleKey];
  const hasLocation = Boolean(input.city || input.region || input.countryCode);
  const hasConfidence = typeof input.confidenceScore === 'number' && input.confidenceScore > 0;
  const isClaimed = input.isClaimed === true;

  const profileCompleteness = clamp(
    18 +
      (input.name ? 15 : 0) +
      (hasLocation ? 20 : 0) +
      (input.roleKey ? 18 : 0) +
      (hasConfidence ? 12 : 0) +
      (isClaimed ? 25 : 0),
    10,
    100,
  );

  return {
    roleKey,
    roleLabel: copy.label,
    headline: isClaimed ? 'Profile already claimed' : 'Claim this profile to activate the job path',
    summary: copy.summary,
    statusLabel: isClaimed ? 'Claimed' : 'Unclaimed',
    locationLabel: [input.city, input.region, input.countryCode].filter(Boolean).join(', ') || 'Location needs confirmation',
    profileCompleteness,
    metrics: [
      metric('Search appearances', input.actualSearchAppearances, 'Eligible after indexing'),
      metric('Profile views', input.actualProfileViews, 'Tracked after visits'),
      metric('Demand matches', input.actualDemandMatches, 'Available after market signals'),
    ],
    missingTrustItems: copy.missing,
    nextActions: copy.nextActions,
    paidTrigger: copy.paidTrigger,
  };
}

function metric(label: string, actual: number | null | undefined, fallback: string): ClaimPreviewMetric {
  if (typeof actual === 'number' && actual >= 0) {
    return { label, value: String(actual), evidence: 'actual' };
  }
  return { label, value: fallback, evidence: 'eligibility' };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
