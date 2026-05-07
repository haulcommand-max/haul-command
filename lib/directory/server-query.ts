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

const CATEGORY_FILTERS: Record<string, DirectoryCategoryFilter> = {
  "pilot-car": {
    entityFamily: "operator",
    entitySubtypes: [...PILOT_ESCORT_SUBTYPES],
    searchTerms: ["pilot car", "escort vehicle", "lead", "chase"],
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
    searchTerms: ["oversize", "pilot car", "escort vehicle"],
  },
  "height-pole": {
    entityFamily: "operator",
    entitySubtypes: [...PILOT_ESCORT_SUBTYPES],
    searchTerms: ["height pole", "high pole", "pilot car", "escort"],
  },
  "route-survey": {
    entityFamily: "operator",
    entitySubtypes: [...PILOT_ESCORT_SUBTYPES],
    searchTerms: ["route survey", "route surveyor", "pilot car"],
  },
  "mobile-mechanic": {
    entityFamily: "infrastructure",
    entitySubtypes: ["mobile_truck_repair", "repair_shop"],
    searchTerms: ["mobile mechanic", "mobile truck repair", "roadside repair"],
  },
  "freight-broker": {
    entityFamily: "broker",
    entitySubtypes: ["freight_broker"],
    searchTerms: ["freight broker", "broker"],
  },
  "permit-service": {
    entityFamily: "authority",
    entitySubtypes: ["pilot_car_permits"],
    searchTerms: ["permit", "permit service", "compliance"],
  },
  "truck-parking": {
    entityFamily: "infrastructure",
    entitySubtypes: ["truck_parking", "staging_yard", "industrial_yard"],
    searchTerms: ["truck parking", "staging yard", "laydown yard"],
  },
};

export function normalizeDirectoryCategory(category?: string | null): string {
  return String(category ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
}

export function normalizeDirectoryCountry(country?: string | null): string | null {
  if (country == null || country.trim() === "") return "US";
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

export function buildDirectoryLocationOrFilter(locationSearch: string): string | null {
  const value = locationSearch.trim();
  if (!value) return null;
  const escaped = value.replace(/[%_,]/g, (char) => `\\${char}`);
  return [
    `city_inferred.ilike.%${escaped}%`,
    `state_inferred.ilike.%${escaped}%`,
    `company.ilike.%${escaped}%`,
    `name.ilike.%${escaped}%`,
  ].join(",");
}
