import { CITY_SERVICE_DEFINITIONS, normalizeRoutePart } from "@/lib/seo/locale-city-service";

const LEGACY_US_PREFIX = "/us-";

export function resolveLegacyCityServiceRedirect(pathname: string) {
  const normalizedPath = normalizeRoutePart(pathname);

  if (!normalizedPath.startsWith("us-")) {
    return null;
  }

  const payload = normalizedPath.slice(3);
  const state = payload.slice(0, 2);
  const rest = payload.slice(3);

  if (!/^[a-z]{2}$/.test(state) || !rest) {
    return null;
  }

  const service = Object.keys(CITY_SERVICE_DEFINITIONS)
    .sort((a, b) => b.length - a.length)
    .find((candidate) => rest.endsWith(`-${candidate}`));

  if (!service) {
    return null;
  }

  const city = rest.slice(0, -service.length - 1);

  if (!city || city.length < 2) {
    return null;
  }

  return `/local/en-us/${state}/${city}/${service}`;
}

export function isLegacyUsCityServicePath(pathname: string) {
  return pathname.startsWith(LEGACY_US_PREFIX) && resolveLegacyCityServiceRedirect(pathname) !== null;
}
