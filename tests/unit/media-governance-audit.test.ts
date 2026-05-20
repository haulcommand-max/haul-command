import { describe, expect, it } from "vitest";
import { buildMediaGovernanceReport } from "../../scripts/audit-media-governance.mjs";

describe("media governance static audit", () => {
  it("keeps paid video generation behind auth, cost governor, and approval gates", () => {
    const report = buildMediaGovernanceReport(process.cwd());

    expect(report.ok).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.metrics.hasCostGovernor).toBe(true);
    expect(report.metrics.hasMediaLedger).toBe(true);
    expect(report.metrics.heygenGenerateCalls).toBeLessThanOrEqual(2);
    expect(report.warnings).toContain("translation_languages_configured_9");
  });
});
