import { US_STATES } from "@/lib/geo/state-names";
import type { DirectoryFilterState } from "@/components/ui/DirectorySearchBar";

export interface DirectorySearchSignalInput {
  query?: string | null;
  filters?: Partial<DirectoryFilterState> | null;
  resultCount?: number | null;
  source?: string | null;
  visitorId?: string | null;
}

export interface DirectorySearchSignal {
  raw_query: string;
  parsed_role: string | null;
  parsed_country: string | null;
  parsed_state: string | null;
  parsed_city: string | null;
  result_count: number;
  no_results: boolean;
  filters: Record<string, unknown>;
  source: string;
  visitor_id: string | null;
}

const ROLE_TERMS: Array<[string, string[]]> = [
  ["high_pole_escort", ["high pole", "height pole", "height survey"]],
  ["route_surveyor", ["route survey", "route surveyor", "bridge survey", "clearance survey"]],
  ["permit_service", ["permit", "permits", "permitting", "permit service"]],
  ["traffic_control", ["traffic control", "police escort", "law enforcement escort"]],
  ["pilot_car_operator", ["pilot car", "pilot cars", "escort vehicle", "escort", "pevo", "lead car", "chase car"]],
  ["staging_yard", ["staging", "yard", "laydown", "parking"]],
  ["mobile_repair", ["repair", "mechanic", "mobile diesel", "roadside"]],
  ["heavy_haul_carrier", ["heavy haul carrier", "heavy hauler", "carrier"]],
  ["broker", ["broker", "dispatcher", "freight broker"]],
];

const STATE_NAME_TO_CODE = Object.fromEntries(
  Object.entries(US_STATES).map(([code, name]) => [name.toLowerCase(), code]),
);

function normalizeQuery(value: string | null | undefined): string {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeCountry(value: string | null | undefined): string | null {
  const normalized = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function inferRole(query: string, category?: string | null): string | null {
  const normalizedCategory = String(category || "").trim().toLowerCase();
  if (normalizedCategory) return normalizedCategory.replace(/-/g, "_");

  const haystack = query.toLowerCase();
  for (const [role, terms] of ROLE_TERMS) {
    if (terms.some((term) => haystack.includes(term))) return role;
  }
  return null;
}

function inferState(query: string, state?: string | null): string | null {
  const explicit = String(state || "").trim().toUpperCase();
  if (US_STATES[explicit]) return explicit;
  if (/^[A-Z]{2,3}$/.test(explicit)) return explicit;

  const haystack = query.toLowerCase();
  for (const [name, code] of Object.entries(STATE_NAME_TO_CODE)) {
    if (new RegExp(`\\b${name.replace(/\s+/g, "\\s+")}\\b`, "i").test(haystack)) return code;
  }

  const codeMatch = haystack.match(/\b([a-z]{2})\b/);
  if (codeMatch && US_STATES[codeMatch[1].toUpperCase()]) return codeMatch[1].toUpperCase();
  return null;
}

function inferCity(query: string, parsedState: string | null): string | null {
  const withoutState = parsedState
    ? query.replace(new RegExp(`\\b${parsedState}\\b`, "i"), "").replace(new RegExp(`\\b${US_STATES[parsedState]}\\b`, "i"), "")
    : query;
  const cleaned = withoutState
    .replace(/\b(pilot cars?|escort vehicles?|escorts?|high pole|height pole|route survey(?:or)?|permits?|permitting|near me|in|for|support|heavy haul|oversize|overweight)\b/gi, " ")
    .replace(/[^a-zA-Z\s-]/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (!cleaned || cleaned.length < 3 || cleaned.split(" ").length > 4) return null;
  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function buildDirectorySearchSignal(input: DirectorySearchSignalInput): DirectorySearchSignal {
  const filters = { ...(input.filters || {}) } as Partial<DirectoryFilterState>;
  const rawQuery = normalizeQuery(input.query || filters.query || filters.category || "");
  const parsedState = inferState(rawQuery, filters.state);
  const resultCount = Math.max(0, Number(input.resultCount ?? 0) || 0);

  return {
    raw_query: rawQuery,
    parsed_role: inferRole(rawQuery, filters.category),
    parsed_country: normalizeCountry(filters.country),
    parsed_state: parsedState,
    parsed_city: inferCity(rawQuery, parsedState),
    result_count: resultCount,
    no_results: resultCount === 0,
    filters,
    source: input.source || "directory",
    visitor_id: input.visitorId || null,
  };
}
