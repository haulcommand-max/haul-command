import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("directory role command center wiring", () => {
  it("exposes canonical role chips through a server API instead of hardcoded directory chips", () => {
    const route = read("app/api/roles/chips/route.ts");

    expect(route).toContain("getHomepageRoleChips");
    expect(route).toContain("Math.min(limitParam, 500)");
    expect(route).toContain("returnedCount");
  });

  it("hydrates directory role filters from the canonical role chip API", () => {
    const component = read("app/directory/_components/DirectorySearchList.tsx");

    expect(component).toContain("/api/roles/chips?limit=500");
    expect(component).toContain("Role Command Center");
    expect(component).toContain("roleChips.map");
    expect(component).not.toContain("\"Pilot Car (PEVO)\",");
    expect(component).not.toContain("\"Heavy Wrecker\"");
  });

  it("uses the shared suggestion API for directory autocomplete instead of simulated predictions", () => {
    const component = read("app/directory/_components/DirectorySearchList.tsx");
    const suggestRoute = read("app/api/search/suggest/route.ts");

    expect(component).toContain("/api/search/suggest?");
    expect(component).toContain("Search suggestions");
    expect(component).toContain("SearchSuggestion");
    expect(suggestRoute).toContain(".gte('confidence_score', 0)");
    expect(suggestRoute).not.toContain("['confidence_score', 'gte.0']");
  });

  it("routes every global omni search surface through canonical search suggestions", () => {
    const canonical = read("components/ui/GlobalOmniSearch.tsx");
    const appCopy = read("app/components/ui/GlobalOmniSearch.tsx");
    const suggestRoute = read("app/api/search/suggest/route.ts");

    expect(canonical).toContain("/api/search/suggest?");
    expect(canonical).toContain("fetchCanonicalSuggestions");
    expect(canonical).not.toContain("discovery-search-core");
    expect(canonical).not.toContain("simulateTypoTolerantPrediction");
    expect(canonical).not.toContain("escrot");
    expect(canonical).not.toContain("buckt");
    expect(canonical).not.toContain("Powered by TypeSense Intelligence");

    expect(appCopy).toContain('export { GlobalOmniSearch } from "@/components/ui/GlobalOmniSearch"');
    expect(appCopy).not.toContain("simulateTypoTolerantPrediction");

    expect(suggestRoute).toContain("hc_role_aliases");
    expect(suggestRoute).toContain("hc_role_country_vocab");
    expect(suggestRoute).toContain("language");
    expect(suggestRoute).toContain("country");
  });

  it("keeps the directory hero search on the directory results surface", () => {
    const configs = read("lib/topic-hero/configs.ts");

    expect(configs).toContain('routePattern: "/directory"');
    expect(configs).toContain('searchAction: "/directory"');
    expect(configs).toContain('searchPlaceholder: "Search role, market, corridor, or company"');
  });

  it("hydrates the legacy search utility from the q query parameter", () => {
    const page = read("app/(app)/search/page.tsx");

    expect(page).toContain("window.location.search");
    expect(page).toContain("urlParams.get('q')");
  });
});
