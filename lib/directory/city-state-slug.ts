import { AU_STATES, CA_PROVINCES, US_STATES } from "@/lib/geo/state-names";
import { slugifyDirectoryMarket } from "@/lib/directory/server-query";

const REGION_CODES_BY_COUNTRY: Record<string, Set<string>> = {
  US: new Set(Object.keys(US_STATES)),
  CA: new Set(Object.keys(CA_PROVINCES)),
  AU: new Set(Object.keys(AU_STATES)),
};

export type CityStateSlug = {
  city: string;
  citySlug: string;
  regionCode: string;
  countryCode: string;
  displayName: string;
};

function titleCaseSlug(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseCityStateSlug(slug: string, countryCode = "US"): CityStateSlug | null {
  const normalizedCountry = countryCode.trim().toUpperCase();
  const normalizedSlug = slugifyDirectoryMarket(slug);
  const parts = normalizedSlug.split("-").filter(Boolean);
  if (parts.length < 2) return null;

  const regionCode = parts.at(-1)?.toUpperCase() ?? "";
  const knownRegions = REGION_CODES_BY_COUNTRY[normalizedCountry];
  if (!knownRegions?.has(regionCode)) return null;

  const citySlug = parts.slice(0, -1).join("-");
  if (!citySlug) return null;

  const city = titleCaseSlug(citySlug);
  return {
    city,
    citySlug,
    regionCode,
    countryCode: normalizedCountry,
    displayName: `${city}, ${regionCode}`,
  };
}
