import { getCountry } from "@/lib/config/country-registry";
import { AU_STATES, CA_PROVINCES, US_STATES } from "@/lib/geo/state-names";

export type DirectoryCategoryFilter = {
  entityFamily: string;
  entitySubtypes: string[];
  searchTerms: string[];
};

export type DirectoryFallbackFilterPlan = {
  countryCode: string | null;
  category: DirectoryCategoryFilter | null;
  surfaceViews: DirectorySurfaceView[];
  locationSearch: string;
  inferredCategory: string | null;
  isPureRoleQuery: boolean;
  order: Array<{ column: string; ascending: boolean }>;
  limit: number;
};

export type DirectoryMarketScope =
  | { type: "region"; code: string; name: string }
  | { type: "metro"; name: string }
  | { type: "city"; name: string };

export type DirectoryMarketFilterPlan = DirectoryFallbackFilterPlan & {
  marketName: string;
  scope: DirectoryMarketScope;
  locationOrFilter: string;
  noIndexWhenEmpty: boolean;
};

export type DirectorySurfaceView =
  | "v_directory_operators"
  | "v_directory_support_locations"
  | "v_directory_services"
  | "v_directory_brokers"
  | "v_directory_carriers"
  | "v_directory_infrastructure"
  | "v_directory_authorities";

const DEFAULT_SURFACE_VIEWS: DirectorySurfaceView[] = [
  "v_directory_operators",
  "v_directory_support_locations",
  "v_directory_services",
  "v_directory_brokers",
  "v_directory_carriers",
  "v_directory_infrastructure",
  "v_directory_authorities",
];

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

const CATEGORY_SURFACE_VIEWS: Record<string, DirectorySurfaceView[]> = {
  "pilot-car": ["v_directory_operators"],
  "escort-vehicle": ["v_directory_operators"],
  "lead-chase": ["v_directory_operators"],
  oversize: ["v_directory_operators"],
  "height-pole": ["v_directory_operators"],
  "route-survey": ["v_directory_operators", "v_directory_services"],
  "mobile-mechanic": ["v_directory_services", "v_directory_infrastructure"],
  "freight-broker": ["v_directory_brokers"],
  carrier: ["v_directory_carriers"],
  "heavy-haul-carrier": ["v_directory_carriers"],
  "permit-service": ["v_directory_authorities", "v_directory_services"],
  "truck-parking": ["v_directory_support_locations", "v_directory_infrastructure"],
};

const CATEGORY_ALIASES: Record<string, string> = {
  escort: "escort-vehicle",
  escorts: "escort-vehicle",
  "escort-vehicle-services": "escort-vehicle",
  "escort-service": "escort-vehicle",
  "escort-services": "escort-vehicle",
  "pilot-car": "pilot-car",
  "pilot-cars": "pilot-car",
  "pilot-car-operator": "pilot-car",
  "pilot-car-operators": "pilot-car",
  "pilot-car-services": "pilot-car",
  "pilot-cars-near-me": "pilot-car",
  "pilot-car-operators-near-me": "pilot-car",
  "high-pole": "height-pole",
  "high-pole-escort": "height-pole",
  "high-pole-escorts": "height-pole",
  "permit-support": "permit-service",
  "permit-services": "permit-service",
  "route-survey-provider": "route-survey",
  "route-survey-providers": "route-survey",
  "staging-yard": "truck-parking",
  "staging-yards": "truck-parking",
  "oversize-parking": "truck-parking",
};

const REGION_MAP_BY_COUNTRY: Record<string, Record<string, string>> = {
  US: US_STATES,
  CA: CA_PROVINCES,
  AU: AU_STATES,
};

export function normalizeDirectoryCategory(category?: string | null): string {
  const normalized = String(category ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  return CATEGORY_ALIASES[normalized] ?? normalized;
}

export function normalizeDirectoryCountry(country?: string | null): string | null {
  if (country == null || country.trim() === "") return null;
  const normalized = country.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

export function slugifyDirectoryMarket(value: string): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function directoryMarketNameFromSlug(slug: string): string {
  return String(slug ?? "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function resolveDirectoryCategoryFilter(category?: string | null): DirectoryCategoryFilter | null {
  const normalized = normalizeDirectoryCategory(category);
  return CATEGORY_FILTERS[normalized] ?? null;
}

export function resolveDirectorySurfaceViews(category?: string | null): DirectorySurfaceView[] {
  const normalized = normalizeDirectoryCategory(category);
  return CATEGORY_SURFACE_VIEWS[normalized] ?? DEFAULT_SURFACE_VIEWS;
}

function inferDirectoryCategoryFromQuery(q?: string | null): string | null {
  const slug = slugifyDirectoryMarket(String(q ?? ""));
  if (!slug) return null;

  const direct = normalizeDirectoryCategory(slug);
  if (CATEGORY_FILTERS[direct]) return direct;

  const spaced = ` ${slug.replace(/-/g, " ")} `;
  const roleSignals: Array<{ category: string; terms: string[] }> = [
    { category: "pilot-car", terms: [" pilot car ", " pilot cars ", " pilot operator ", " pilot operators "] },
    { category: "escort-vehicle", terms: [" escort ", " escorts ", " escort vehicle ", " escort vehicles "] },
    { category: "height-pole", terms: [" height pole ", " high pole "] },
    { category: "route-survey", terms: [" route survey ", " route surveyor ", " route surveyors "] },
    { category: "permit-service", terms: [" permit support ", " permit service ", " permit services ", " permitting "] },
    { category: "truck-parking", terms: [" truck parking ", " staging yard ", " staging yards ", " parking "] },
    { category: "mobile-mechanic", terms: [" mobile mechanic ", " mobile repair ", " roadside repair "] },
    { category: "freight-broker", terms: [" freight broker ", " freight brokers ", " broker ", " brokers "] },
  ];

  return roleSignals.find((signal) => signal.terms.some((term) => spaced.includes(term)))?.category ?? null;
}

export function buildDirectoryFallbackFilterPlan(params: {
  country?: string | null;
  category?: string | null;
  q?: string | null;
}): DirectoryFallbackFilterPlan {
  const explicitCategory = normalizeDirectoryCategory(params.category);
  const inferredCategory = explicitCategory || inferDirectoryCategoryFromQuery(params.q);
  const category = resolveDirectoryCategoryFilter(inferredCategory);
  const isPureRoleQuery = Boolean(!explicitCategory && inferredCategory);

  return {
    countryCode: normalizeDirectoryCountry(params.country),
    category,
    surfaceViews: resolveDirectorySurfaceViews(inferredCategory),
    locationSearch: isPureRoleQuery ? "" : String(params.q ?? "").trim(),
    inferredCategory,
    isPureRoleQuery,
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
    `city.ilike.%${escaped}%`,
    `state.ilike.%${escaped}%`,
    `name.ilike.%${escaped}%`,
    `primary_role.ilike.%${escaped}%`,
    `public_label.ilike.%${escaped}%`,
  ].join(",");
}

function escapePostgrestLike(value: string) {
  return value.replace(/[%_,]/g, (char) => `\\${char}`);
}

export function buildDirectoryMarketLocationOrFilter(scope: DirectoryMarketScope): string {
  if (scope.type === "region") {
    const escapedName = escapePostgrestLike(scope.name);
    return [
      `state_inferred.eq.${scope.code}`,
      `admin1_code.eq.${scope.code}`,
      `state.eq.${scope.code}`,
      `state_inferred.ilike.%${escapedName}%`,
      `admin1_code.ilike.%${escapedName}%`,
    ].join(",");
  }

  const escapedName = escapePostgrestLike(scope.name);
  return [
    `city_inferred.ilike.%${escapedName}%`,
    `city.ilike.%${escapedName}%`,
    `state_inferred.ilike.%${escapedName}%`,
    `admin1_code.ilike.%${escapedName}%`,
  ].join(",");
}

export function resolveDirectoryMarketScope(country?: string | null, slug?: string | null): DirectoryMarketScope {
  const countryCode = normalizeDirectoryCountry(country) ?? "US";
  const normalizedSlug = slugifyDirectoryMarket(String(slug ?? ""));
  const regions = REGION_MAP_BY_COUNTRY[countryCode] ?? {};

  for (const [code, name] of Object.entries(regions)) {
    if (normalizedSlug === code.toLowerCase() || normalizedSlug === slugifyDirectoryMarket(name)) {
      return { type: "region", code, name };
    }
  }

  const registryCountry = getCountry(countryCode);
  const registryMetro = registryCountry?.topMetros.find(
    (metro) => slugifyDirectoryMarket(metro) === normalizedSlug,
  );

  if (registryMetro) {
    return { type: "metro", name: registryMetro };
  }

  return { type: "city", name: directoryMarketNameFromSlug(String(slug ?? "")) };
}

export function buildDirectoryMarketFilterPlan(params: {
  country?: string | null;
  slug?: string | null;
  category?: string | null;
}): DirectoryMarketFilterPlan {
  const fallbackPlan = buildDirectoryFallbackFilterPlan({
    country: params.country,
    category: params.category,
    q: null,
  });
  const scope = resolveDirectoryMarketScope(params.country, params.slug);

  return {
    ...fallbackPlan,
    scope,
    marketName: scope.name,
    locationOrFilter: buildDirectoryMarketLocationOrFilter(scope),
    noIndexWhenEmpty: true,
  };
}
