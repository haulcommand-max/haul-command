export type CoverageSearchFilters = {
  country: string | null;
  state: string | null;
  role: string | null;
  limit: number;
  offset: number;
};

export type CoverageSearchResult = {
  hc_operator_id: string;
  display_name: string;
  trust_score: number;
  distance_miles: number | null;
  urgent_eligible: boolean;
  verified_credentials: string[];
  location: string | null;
  country_code: string | null;
  role: string | null;
  is_claimed: boolean;
};

type CoverageSearchBody = {
  country?: unknown;
  country_code?: unknown;
  state?: unknown;
  region?: unknown;
  admin1_code?: unknown;
  role?: unknown;
  q?: unknown;
  limit?: unknown;
  offset?: unknown;
};

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string, options?: Record<string, unknown>) => any;
  };
};

function normalizeCode(value: unknown) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function normalizeText(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

export function buildCoverageSearchFilters(body: CoverageSearchBody): CoverageSearchFilters {
  return {
    country: normalizeCode(body.country_code ?? body.country),
    state: normalizeCode(body.state ?? body.region ?? body.admin1_code),
    role: normalizeText(body.role ?? body.q),
    limit: clampInteger(body.limit, 10, 1, 50),
    offset: clampInteger(body.offset, 0, 0, 500),
  };
}

export function mapCoverageRows(rows: any[]): CoverageSearchResult[] {
  return rows.map((row) => {
    const city = normalizeText(row.city ?? row.city_inferred ?? row.home_base_city);
    const state = normalizeCode(row.admin1_code ?? row.state_code ?? row.state_inferred ?? row.region_code);
    const score = Number(row.confidence_score ?? row.rank_score ?? row.trust_score ?? 0);

    return {
      hc_operator_id: String(row.id ?? row.entity_id ?? row.contact_id),
      display_name: String(row.name ?? row.company_name ?? row.company ?? row.display_name ?? "Source-backed operator"),
      trust_score: Number.isFinite(score) ? Math.round(score) : 0,
      distance_miles: null,
      urgent_eligible: false,
      verified_credentials: [],
      location: city || state ? [city, state].filter(Boolean).join(", ") : null,
      country_code: normalizeCode(row.country_code ?? row.country) ?? null,
      role: normalizeText(row.role_primary ?? row.primary_role ?? row.entity_type ?? row.entity_subtype),
      is_claimed: row.is_claimed === true || row.claim_status === "claimed",
    };
  });
}

export async function searchCoverageOperators(client: SupabaseLike, filters: CoverageSearchFilters) {
  let query = client
    .from("hc_global_operators")
    .select("id, entity_id, name, city, admin1_code, country_code, is_claimed, role_primary, confidence_score, rank_score, claim_status", { count: "exact" })
    .not("admin1_code", "is", null)
    .not("city", "is", null);

  if (filters.country) query = query.eq("country_code", filters.country);
  if (filters.state) query = query.eq("admin1_code", filters.state);
  if (filters.role) {
    const escaped = filters.role.replace(/[%_,]/g, (char) => `\\${char}`);
    query = query.or(`name.ilike.%${escaped}%,role_primary.ilike.%${escaped}%,city.ilike.%${escaped}%,admin1_code.ilike.%${escaped}%`);
  }

  const start = filters.offset;
  const end = filters.offset + filters.limit - 1;
  const { data, count, error } = await query
    .order("confidence_score", { ascending: false, nullsFirst: false })
    .range(start, end);

  if (error) throw new Error(error.message);

  return {
    data: mapCoverageRows(data ?? []),
    total: count ?? data?.length ?? 0,
  };
}
