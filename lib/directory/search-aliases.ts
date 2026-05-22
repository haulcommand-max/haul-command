export type DirectorySearchAlias = {
  alias: string;
  alias_norm: string | null;
  canonical: string;
  canonical_kind: string;
  canonical_ref: string | null;
  country_code: string | null;
  confidence: number | string;
};

const ALIAS_SELECT =
  "alias, alias_norm, canonical, canonical_kind, canonical_ref, country_code, confidence";

export function normalizeDirectoryAliasQuery(value: string): string {
  return value.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

function cleanPostgrestTerm(value: string): string {
  return value.trim().replace(/[%,()]/g, " ").replace(/\s+/g, " ");
}

function cleanPostgrestEquality(value: string): string {
  return value.trim().replace(/[^A-Za-z0-9_-]/g, "");
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function getAliasCanonicalTargets(aliases: DirectorySearchAlias[]): string[] {
  return unique(
    aliases.flatMap((alias) => [
      cleanPostgrestEquality(alias.canonical),
      cleanPostgrestEquality(alias.canonical_ref ?? ""),
    ]),
  );
}

export function getAliasAwareSearchTerms(
  rawQuery: string,
  aliases: DirectorySearchAlias[],
): string[] {
  const aliasTerms = aliases.flatMap((alias) => [
    alias.alias,
    alias.canonical,
    alias.canonical.replace(/_/g, " "),
    alias.canonical_ref ?? "",
    alias.canonical_ref?.replace(/_/g, " ") ?? "",
  ]);

  return unique([rawQuery, ...aliasTerms].map(cleanPostgrestTerm)).slice(0, 12);
}

export function buildAliasAwareOrFilter(
  textFields: string[],
  canonicalField: string,
  rawQuery: string,
  aliases: DirectorySearchAlias[],
): string {
  const searchTerms = getAliasAwareSearchTerms(rawQuery, aliases);
  const targets = getAliasCanonicalTargets(aliases);
  const textClauses = textFields.flatMap((field) =>
    searchTerms.map((term) => `${field}.ilike.%${term}%`),
  );
  const canonicalClauses = targets.map((target) => `${canonicalField}.eq.${target}`);

  return [...textClauses, ...canonicalClauses].join(",");
}

export async function resolveDirectorySearchAliases(
  supabase: any,
  rawQuery: string,
  countryCode?: string,
): Promise<DirectorySearchAlias[]> {
  const aliasNorm = normalizeDirectoryAliasQuery(rawQuery);
  if (!aliasNorm) return [];

  const { data, error } = await supabase
    .from("hc_search_aliases")
    .select(ALIAS_SELECT)
    .eq("enabled", true)
    .eq("alias_norm", aliasNorm)
    .order("confidence", { ascending: false })
    .limit(10);

  if (error || !data) {
    if (error) console.error("[directory-search] Alias lookup failed:", error);
    return [];
  }

  const requestedCountry = countryCode.trim().toUpperCase();
  return (data as DirectorySearchAlias[]).filter((alias) => {
    if (!requestedCountry) return true;
    return !alias.country_code || alias.country_code.toUpperCase() === requestedCountry;
  });
}
