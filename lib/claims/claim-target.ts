type ParamInput = URLSearchParams | FormData | Record<string, unknown> | null | undefined;

export type ClaimParamKey =
  | 'entity'
  | 'hcid'
  | 'operator'
  | 'eq'
  | 'listing'
  | 'place'
  | 'surface_id'
  | 'id'
  | 'slug'
  | 'market'
  | 'country'
  | 'region'
  | 'role'
  | 'corridor'
  | 'plan'
  | 'upgrade'
  | 'tool'
  | 'ref'
  | 'intent'
  | 'source';

export type NormalizedClaimParams = Partial<Record<ClaimParamKey, string>> & {
  raw: Partial<Record<ClaimParamKey | 'from', string>>;
};

export type ClaimResolutionCandidate = {
  table:
    | 'v_hc_directory_claim_requirements'
    | 'directory_entities'
    | 'operators'
    | 'hc_global_operators'
    | 'hc_places'
    | 'hc_corridor_public_v1';
  column: 'hc_id' | 'id' | 'slug';
  value: string;
  entityType: 'directory_entity' | 'operator' | 'global_operator' | 'place' | 'corridor';
  targetParam: ClaimParamKey;
};

export type ClaimTarget = {
  entityId: string;
  entityType: 'directory_entity' | 'operator' | 'global_operator' | 'place' | 'corridor';
  sourceTable: ClaimResolutionCandidate['table'];
  targetParam: ClaimParamKey;
  targetValue: string;
  name?: string;
  region?: string;
  countryCode?: string;
  isClaimed?: boolean;
  claimType?: string;
  acceptedClaimActor?: string;
  requiredClaimProof?: string[];
  raw: Record<string, unknown>;
};

const CLAIM_PARAM_KEYS: ClaimParamKey[] = [
  'entity',
  'hcid',
  'operator',
  'eq',
  'listing',
  'place',
  'surface_id',
  'id',
  'slug',
  'market',
  'country',
  'region',
  'role',
  'corridor',
  'plan',
  'upgrade',
  'tool',
  'ref',
  'intent',
  'source',
];

const CLAIM_PATH_KEYS: ClaimParamKey[] = [
  'entity',
  'hcid',
  'operator',
  'eq',
  'listing',
  'place',
  'surface_id',
  'id',
  'slug',
  'market',
  'country',
  'region',
  'role',
  'corridor',
  'plan',
  'upgrade',
  'tool',
  'ref',
  'intent',
  'source',
];

function readParam(input: ParamInput, key: string): string | undefined {
  if (!input) return undefined;

  if (input instanceof URLSearchParams || input instanceof FormData) {
    const value = input.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  const value = input[key];
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.find((item) => typeof item === 'string');
  return undefined;
}

function cleanParam(value: string | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function firstParam(params: NormalizedClaimParams, keys: ClaimParamKey[]): { key: ClaimParamKey; value: string } | null {
  for (const key of keys) {
    const value = params[key];
    if (value) return { key, value };
  }
  return null;
}

export function normalizeClaimParams(input: ParamInput): NormalizedClaimParams {
  const raw: NormalizedClaimParams['raw'] = {};
  const params: NormalizedClaimParams = { raw };

  for (const key of CLAIM_PARAM_KEYS) {
    const value = cleanParam(readParam(input, key));
    if (value) {
      params[key] = value;
      raw[key] = value;
    }
  }

  const from = cleanParam(readParam(input, 'from'));
  if (from) raw.from = from;
  if (!params.source && from) params.source = from;

  return params;
}

export function buildClaimPath(params: NormalizedClaimParams): string {
  const search = new URLSearchParams();

  for (const key of CLAIM_PATH_KEYS) {
    const value = params[key];
    if (value) search.set(key, value);
  }

  const query = search.toString();
  return query ? `/claim?${query}` : '/claim';
}

export function buildClaimResolutionCandidates(params: NormalizedClaimParams): ClaimResolutionCandidate[] {
  const candidates: ClaimResolutionCandidate[] = [];
  const seen = new Set<string>();

  const add = (candidate: ClaimResolutionCandidate | null) => {
    if (!candidate) return;
    const key = `${candidate.table}:${candidate.column}:${candidate.value}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(candidate);
  };

  const directoryEntityId = firstParam(params, ['entity', 'listing', 'surface_id', 'id']);
  add(directoryEntityId ? {
    table: 'v_hc_directory_claim_requirements',
    column: 'id',
    value: directoryEntityId.value,
    entityType: 'directory_entity',
    targetParam: directoryEntityId.key,
  } : null);
  add(directoryEntityId ? {
    table: 'directory_entities',
    column: 'id',
    value: directoryEntityId.value,
    entityType: 'directory_entity',
    targetParam: directoryEntityId.key,
  } : null);

  if (params.hcid) {
    add({ table: 'directory_entities', column: 'hc_id', value: params.hcid, entityType: 'directory_entity', targetParam: 'hcid' });
    add({ table: 'operators', column: 'hc_id', value: params.hcid, entityType: 'operator', targetParam: 'hcid' });
  }

  const flexibleOperator = firstParam(params, ['operator', 'eq', 'listing', 'surface_id', 'id']);
  if (flexibleOperator?.value && /^hc[-_]/i.test(flexibleOperator.value)) {
    add({ table: 'operators', column: 'hc_id', value: flexibleOperator.value, entityType: 'operator', targetParam: flexibleOperator.key });
  }

  const operatorId = firstParam(params, ['operator', 'eq', 'listing', 'surface_id', 'id']);
  add(operatorId ? { table: 'operators', column: 'id', value: operatorId.value, entityType: 'operator', targetParam: operatorId.key } : null);

  const globalOperatorId = firstParam(params, ['operator', 'eq', 'listing', 'surface_id', 'id']);
  add(globalOperatorId ? { table: 'hc_global_operators', column: 'id', value: globalOperatorId.value, entityType: 'global_operator', targetParam: globalOperatorId.key } : null);

  const globalOperatorSlug = firstParam(params, ['slug', 'operator', 'listing']);
  add(globalOperatorSlug ? { table: 'hc_global_operators', column: 'slug', value: globalOperatorSlug.value, entityType: 'global_operator', targetParam: globalOperatorSlug.key } : null);

  const placeId = firstParam(params, ['place', 'listing', 'surface_id', 'id']);
  add(placeId ? { table: 'hc_places', column: 'id', value: placeId.value, entityType: 'place', targetParam: placeId.key } : null);

  const placeSlug = firstParam(params, ['slug', 'place', 'listing']);
  add(placeSlug ? { table: 'hc_places', column: 'slug', value: placeSlug.value, entityType: 'place', targetParam: placeSlug.key } : null);

  if (params.corridor) {
    add({ table: 'hc_corridor_public_v1', column: 'id', value: params.corridor, entityType: 'corridor', targetParam: 'corridor' });
    add({ table: 'hc_corridor_public_v1', column: 'slug', value: params.corridor, entityType: 'corridor', targetParam: 'corridor' });
  }

  return candidates;
}

function targetFromRow(candidate: ClaimResolutionCandidate, row: Record<string, unknown>): ClaimTarget | null {
  const entityId = typeof row.id === 'string' ? row.id : undefined;
  if (!entityId) return null;

  return {
    entityId,
    entityType: candidate.entityType,
    sourceTable: candidate.table,
    targetParam: candidate.targetParam,
    targetValue: candidate.value,
    name: pickString(row, ['company_name', 'business_name', 'canonical_name', 'display_name', 'company', 'legal_name', 'name', 'full_name', 'title']),
    region: pickString(row, ['state', 'state_code', 'region_code', 'region', 'admin_area']),
    countryCode: pickString(row, ['country_code', 'country']),
    isClaimed: pickBoolean(row, ['is_claimed', 'claimed']) ?? claimStatusIsClaimed(row.claim_status ?? row.owner_claim_status),
    claimType: pickString(row, ['claim_type']),
    acceptedClaimActor: pickString(row, ['accepted_claim_actor']),
    requiredClaimProof: pickStringArray(row.required_claim_proof),
    raw: row,
  };
}

function pickString(row: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function pickBoolean(row: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'boolean') return value;
  }
  return undefined;
}

function pickStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
  return strings.length > 0 ? strings : undefined;
}

function claimStatusIsClaimed(value: unknown): boolean | undefined {
  if (typeof value !== 'string') return undefined;
  return value.toLowerCase() === 'claimed';
}

async function maybeResolveCandidate(supabase: any, candidate: ClaimResolutionCandidate): Promise<ClaimTarget | null> {
  try {
    const { data, error } = await supabase
      .from(candidate.table)
      .select('*')
      .eq(candidate.column, candidate.value)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return targetFromRow(candidate, data);
  } catch {
    return null;
  }
}

export async function resolveClaimTarget(supabase: any, params: NormalizedClaimParams): Promise<ClaimTarget | null> {
  for (const candidate of buildClaimResolutionCandidates(params)) {
    const target = await maybeResolveCandidate(supabase, candidate);
    if (target) return target;
  }

  return null;
}
