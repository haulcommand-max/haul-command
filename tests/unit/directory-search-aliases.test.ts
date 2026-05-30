import { describe, expect, it } from "vitest";
import {
  buildAliasAwareOrFilter,
  getAliasAwareSearchTerms,
  getAliasCanonicalTargets,
  normalizeDirectoryAliasQuery,
  resolveDirectorySearchAliases,
  type DirectorySearchAlias,
} from "@/lib/directory/search-aliases";

const restAreaAlias: DirectorySearchAlias = {
  alias: "rest area",
  alias_norm: "rest area",
  canonical: "rest_area",
  canonical_kind: "role",
  canonical_ref: null,
  country_code: null,
  confidence: "1.00",
};

describe("directory search aliases", () => {
  it("normalizes user wording the same way hc_search_aliases stores aliases", () => {
    expect(normalizeDirectoryAliasQuery("  Rest-Area  ")).toBe("rest area");
    expect(normalizeDirectoryAliasQuery("truck_stop")).toBe("truck stop");
  });

  it("adds canonical role/category terms without losing the user query", () => {
    expect(getAliasAwareSearchTerms("rest area", [restAreaAlias])).toEqual([
      "rest%area",
      "rest_area",
    ]);
    expect(getAliasCanonicalTargets([restAreaAlias])).toEqual(["rest_area"]);
  });

  it("builds a PostgREST OR filter that searches text and canonical category fields", () => {
    expect(
      buildAliasAwareOrFilter(["name", "locality"], "surface_category_key", "rest area", [
        restAreaAlias,
      ]),
    ).toBe(
      "name.ilike.%rest%area%,name.ilike.%rest_area%,locality.ilike.%rest%area%,locality.ilike.%rest_area%,surface_category_key.eq.rest_area",
    );
  });

  it("allows alias resolution without a country filter", async () => {
    const aliases = [restAreaAlias];
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({ data: aliases, error: null }),
              }),
            }),
          }),
        }),
      }),
    };

    await expect(resolveDirectorySearchAliases(supabase, "rest area")).resolves.toEqual(aliases);
  });
});
