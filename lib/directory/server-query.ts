export type DirectoryCategoryFilter = {
  entityFamily: string;
  entitySubtypes: string[];
  searchTerms: string[];
};

export type DirectoryFallbackFilterPlan = {
  countryCode: string | null;
  category: DirectoryCategoryFilter | null;
  locationSearch: string;
  order: Array<{ column: string; ascending: boolean }>;
  limit: number;
};

const PILOT_ESCORT_SUBTYPES = [
  "pilot_car_operator",
  "escort_operator",
  "pilot_driver",
  "pilot_car",
] as const;

const INFRASTRUCTURE_SUBTYPES = [
  "truck_parking",
  "truck_stop",
  "staging_yard",
  "industrial_yard",
  "mobile_truck_repair",
  "repair_shop",
  "weigh_station",
  "port_support",
] as const;

const CATEGORY_FILTERS: Record<string, DirectoryCategoryFilter> = {
  "pilot-car": {
    entityFamily: "operator",
    entitySubtypes: [...PILOT_ESCORT_SUBTYPES],
    searchTerms: ["pilot car", "escort vehicle", "lead", "chase"],
  },
  "escort": {
    entityFamily: "operator",
    entitySubtypes: [...PILOT_ESCORT_SUBTYPES],
    searchTerms: ["escort", "escort vehicle", "pilot car", "lead", "chase"],
  },
  "escort-vehicle": {
    entityFamily: "operator",
    entitySubtypes: [...PILOT_ESCORT_SUBTYPES],
    searchTerms: ["escort vehicle", "pilot car", "lead", "chase"],
  },
  "lead-chase": {
    entityFamily: "operator",
    entitySubtypes: [...PILOT_ESCORT_SUBTYPES],
    searchTerms: ["lead", "chase", "pilot car", "escort"],
  },
  oversize: {
    entityFamily: "operator",
    entitySubtypes: [...PILOT_ESCORT_SUBTYPES],
    searchTerms: ["oversize", "overweight", "pilot car", "escort vehicle"],
  },
  "high-pole": {
    entityFamily: "operator",
    entitySubtypes: [...PILOT_ESCORT_SUBTYPES],
    searchTerms: ["high pole", "height pole", "pilot car", "escort"],
  },
  "height-pole": {
    entityFamily: "operator",
    entitySubtypes: [...PILOT_ESCORT_SUBTYPES],
    searchTerms: ["height pole", "high pole", "pilot car", "escort"],
  },
  "route-survey": {
    entityFamily: "operator",
    entitySubtypes: [...PILOT_ESCORT_SUBTYPES],
    searchTerms: ["route survey", "route surveyor", "clearance survey", "pilot car"],
  },
  permit: {
    entityFamily: "authority",
    entitySubtypes: ["pilot_car_permits", "permit_service"],
    searchTerms: ["permit", "permit service", "compliance", "routing permit"],
  },
  "permit-service": {
    entityFamily: "authority",
    entitySubtypes: ["pilot_car_permits", "permit_service"],
    searchTerms: ["permit", "permit service", "compliance", "routing permit"],
  },
  "traffic-control": {
    entityFamily: "support",
    entitySubtypes: ["traffic_control", "flagger", "police_escort"],
    searchTerms: ["traffic control", "flagger", "police escort", "lane closure"],
  },
  staging: {
    entityFamily: "infrastructure",
    entitySubtypes: ["staging_yard", "industrial_yard", "laydown_yard"],
    searchTerms: ["staging", "staging yard", "laydown yard", "industrial yard"],
  },
  "truck-stop": {
    entityFamily: "infrastructure",
    entitySubtypes: [...INFRASTRUCTURE_SUBTYPES],
    searchTerms: ["truck stop", "fuel stop", "diesel", "oversize parking"],
  },
  "truck-parking": {
    entityFamily: "infrastructure",
    entitySubtypes: ["truck_parking", "staging_yard", "industrial_yard"],
    searchTerms: ["truck parking", "oversize parking", "staging yard", "laydown yard"],
  },
  parking: {
    entityFamily: "infrastructure",
    entitySubtypes: ["truck_parking", "staging_yard", "industrial_yard"],
    searchTerms: ["parking", "oversize parking", "truck parking", "staging"],
  },
  repair: {
    entityFamily: "infrastructure",
    entitySubtypes: ["mobile_truck_repair", "repair_shop"],
    searchTerms: ["repair", "mobile mechanic", "mobile truck repair", "roadside repair"],
  },
  "mobile-mechanic": {
    entityFamily: "infrastructure",
    entitySubtypes: ["mobile_truck_repair", "repair_shop"],
    searchTerms: ["mobile mechanic", "mobile truck repair", "roadside repair"],
  },
  port: {
    entityFamily: "infrastructure",
    entitySubtypes: ["port_support", "border_support", "customs_support"],
    searchTerms: ["port", "port support", "border", "customs", "terminal"],
  },
  "weigh-station": {
    entityFamily: "infrastructure",
    entitySubtypes: ["weigh_station", "scale", "inspection_station"],
    searchTerms: ["weigh station", "scale", "inspection station"],
  },
  "freight-broker": {
    entityFamily: "broker",
    entitySubtypes: ["freight_broker"],
    searchTerms: ["freight broker", "broker"],
  },
};

export function normalizeDirectoryCategory(category?: string | null): string {
  return String(category ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
}

export function normalizeDirectoryCountry(country?: string | null): string | null {
  if (country == null || country.trim() === "") return null;
  const normalized = country.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

export function resolveDirectoryCategoryFilter(category?: string | null): DirectoryCategoryFilter | null {
  const normalized = normalizeDirectoryCategory(category);
  return CATEGORY_FILTERS[normalized] ?? null;
}

export function buildDirectoryFallbackFilterPlan(params: {
  country?: string | null;
  category?: string | null;
  q?: string | null;
}): DirectoryFallbackFilterPlan {
  return {
    countryCode: normalizeDirectoryCountry(params.country),
    category: resolveDirectoryCategoryFilter(params.category),
    locationSearch: String(params.q ?? "").trim(),
    order: [
      { column: "rank_score", ascending: false },
      { column: "confidence_score", ascending: false },
      { column: "updated_at", ascending: false },
    ],
    limit: 50,
  };
}

function escapePostgrestLike(value: string): string {
  return value.replace(/[%_,]/g, (char) => `\\${char}`);
}

/**
 * Build a PostgREST OR filter that only references columns exposed by
 * v_directory_publishable. The view currently exposes city, state_inferred,
 * state_code, company, name, and primary_service_area; it does not expose
 * city_inferred, entity_family, or entity_subtype.
 */
export function buildDirectoryLocationOrFilter(
  locationSearch: string,
  categoryTerms: string[] = []
): string | null {
  const tokens = [locationSearch, ...categoryTerms]
    .map((term) => term.trim())
    .filter(Boolean);

  if (tokens.length === 0) return null;

  const filters = new Set<string>();
  for (const token of tokens.slice(0, 8)) {
    const escaped = escapePostgrestLike(token);
    filters.add(`city.ilike.%${escaped}%`);
    filters.add(`state_inferred.ilike.%${escaped}%`);
    filters.add(`state_code.ilike.%${escaped}%`);
    filters.add(`company.ilike.%${escaped}%`);
    filters.add(`name.ilike.%${escaped}%`);
    filters.add(`primary_service_area.ilike.%${escaped}%`);
  }

  return Array.from(filters).join(",");
}
