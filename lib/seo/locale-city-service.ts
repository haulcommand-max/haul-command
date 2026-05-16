import { absoluteUrl } from "@/lib/site-url";

export type CityServiceRouteParams = {
  locale: string;
  region: string;
  city: string;
  service: string;
};

export type CityServiceDefinition = {
  slug: string;
  label: string;
  shortLabel: string;
  category: string;
  entitySubtypes: string[];
  searchTerms: string[];
};

export const CITY_SERVICE_DEFINITIONS: Record<string, CityServiceDefinition> = {
  "pilot-car": {
    slug: "pilot-car",
    label: "Pilot car services",
    shortLabel: "Pilot cars",
    category: "pilot-car",
    entitySubtypes: ["pilot_car_operator", "escort_operator", "pilot_driver", "pilot_car"],
    searchTerms: ["pilot car", "pilot", "escort"],
  },
  "escort-service": {
    slug: "escort-service",
    label: "Escort vehicle services",
    shortLabel: "Escort vehicles",
    category: "escort",
    entitySubtypes: ["escort_operator", "escort_vehicle", "pilot_car_operator", "pilot_car"],
    searchTerms: ["escort", "escort vehicle", "pilot car"],
  },
  "route-survey": {
    slug: "route-survey",
    label: "Route survey support",
    shortLabel: "Route survey",
    category: "route-survey",
    entitySubtypes: ["route_survey_provider", "route_surveyor", "high_pole_operator", "pilot_car_operator"],
    searchTerms: ["route survey", "high pole", "height pole"],
  },
  "permit-support": {
    slug: "permit-support",
    label: "Oversize permit support",
    shortLabel: "Permit support",
    category: "permits",
    entitySubtypes: ["permit_agent", "permit_service", "permit_support", "oversize_permit_service"],
    searchTerms: ["permit", "permits", "oversize permit"],
  },
};

export function normalizeRoutePart(value: string) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function titleizeRoutePart(value: string) {
  return normalizeRoutePart(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part.length <= 2 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function countryFromLocale(locale: string) {
  const normalized = normalizeRoutePart(locale);
  const parts = normalized.split("-");
  const country = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return (country || "us").slice(0, 2).toUpperCase();
}

export function getCityServiceDefinition(service: string): CityServiceDefinition {
  const slug = normalizeRoutePart(service);
  return CITY_SERVICE_DEFINITIONS[slug] ?? {
    slug,
    label: `${titleizeRoutePart(slug)} support`,
    shortLabel: titleizeRoutePart(slug),
    category: slug,
    entitySubtypes: [slug.replace(/-/g, "_")],
    searchTerms: [slug.replace(/-/g, " ")],
  };
}

export function buildLocaleCityServicePath(params: CityServiceRouteParams) {
  return `/${normalizeRoutePart(params.locale)}/${normalizeRoutePart(params.region)}/${normalizeRoutePart(params.city)}/${normalizeRoutePart(params.service)}`;
}

export function buildLocaleCityServiceCanonical(params: CityServiceRouteParams) {
  return absoluteUrl(buildLocaleCityServicePath(params));
}

export function cityServiceIndexabilityScore(input: {
  providerCount: number;
  hasServiceDefinition: boolean;
  hasRegion: boolean;
  hasCity: boolean;
  hasNoDeadEndActions: boolean;
  hasFaq: boolean;
  hasInternalLinks: boolean;
}) {
  return [
    input.providerCount >= 3,
    input.hasServiceDefinition,
    input.hasRegion,
    input.hasCity,
    input.hasNoDeadEndActions,
    input.hasFaq,
    input.hasInternalLinks,
  ].filter(Boolean).length;
}

export function shouldIndexCityServicePage(score: number) {
  return score >= 3;
}
