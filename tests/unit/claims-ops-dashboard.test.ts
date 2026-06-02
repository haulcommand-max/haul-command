import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Claims Ops dashboard contract", () => {
  it("wires a dynamic Supabase-backed claims operations dashboard without exposing PII payloads", () => {
    const page = read("app/admin/dashboards/claims-ops/page.tsx");
    const readModel = read("lib/admin/claims-ops/read-model.ts");
    const hub = read("app/admin/dashboards/page.tsx");
    const proxy = read("proxy.ts");

    expect(page).toContain("getClaimsOpsReadModel");
    expect(page).toContain('dynamic = "force-dynamic"');
    expect(page).toContain("Claims Ops");
    expect(page).toContain("Safety Guardrails");
    expect(page).toContain("Admin access for /admin/* is enforced in proxy.ts");
    expect(page).not.toContain("'use client'");
    expect(page).not.toContain("Math.random");

    expect(proxy).toContain("pathname === '/admin'");
    expect(proxy).toContain("profile.role !== 'system_admin'");

    for (const table of [
      "surfaces",
      "claims",
      "claim_kpi_summary",
      "hc_claim_requests",
      "listing_claims",
      "hc_claim_sessions",
      "hc_claim_pressure_state",
      "hc_claim_pressure_targets",
      "outreach_events",
      "claim_governor",
      "outreach_suppressions",
      "claim_audit_log",
    ]) {
      expect(readModel).toContain(`"${table}"`);
    }
    expect(readModel).toContain(".from(table)");

    expect(readModel).toContain("PII evidence intentionally excluded");
    expect(readModel).toContain("Contact values intentionally excluded");
    expect(readModel).toContain("Claimable surfaces exist, but canonical claims has no visible lifecycle rows");
    expect(readModel).toContain("is not readable by the Claims Ops read model");
    expect(readModel).not.toContain("contact_value");
    expect(readModel).not.toContain("verification_token");
    expect(readModel).not.toContain("actor,");

    expect(hub).toContain("Claims Ops");
    expect(hub).toContain("/admin/dashboards/claims-ops");
  });
});
