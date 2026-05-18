type DirectoryMarketHrefInput = {
  country: string;
  slug: string;
};

type DirectoryCategoryHrefContext = {
  country?: string | null;
  region?: string | null;
};

function normalizeCountry(country: string) {
  return country.trim().toLowerCase();
}

function normalizeSlug(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function appendDirectoryContext(path: string, context?: DirectoryCategoryHrefContext) {
  const params = new URLSearchParams();
  const country = context?.country?.trim().toUpperCase();
  const region = context?.region?.trim().toUpperCase();

  if (country) params.set("country", country);
  if (region) params.set("region", region);

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function buildDirectoryCountryHref(country: string) {
  return `/directory/${normalizeCountry(country)}`;
}

export function buildDirectoryMarketHref(input: DirectoryMarketHrefInput) {
  return `${buildDirectoryCountryHref(input.country)}/${normalizeSlug(input.slug)}`;
}

export function buildDirectoryCategoryHref(slug: string, context?: DirectoryCategoryHrefContext) {
  return appendDirectoryContext(`/directory/category/${normalizeSlug(slug)}`, context);
}

export function buildDirectoryDossierHref(id: string) {
  return `/directory/dossier/${encodeURIComponent(id.trim())}`;
}
