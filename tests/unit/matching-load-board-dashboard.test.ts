import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("matching load board activation dashboard", () => {
  it("uses the canonical matching money spine instead of legacy job-only dashboards", () => {
    const page = read("app/admin/dashboards/matching-load-board/page.tsx");
    const readModel = read("lib/admin/matching-load-board/read-model.ts");
    expect(page).toContain("getMatchingLoadBoardReadModel");
    expect(page).toContain('dynamic = "force-dynamic"');
    expect(page).toContain("match_offers");
    expect(page).toContain("hc_load_matching_queue");
    expect(page).toContain("uncovered_load_alerts");
    expect(page).toContain("hc_pay_revenue");
    expect(page).toContain("Stale Work");
    expect(page).toContain("Uncovered Load Queue");
    expect(page).toContain("Unnotified Gaps");
    expect(page).toContain("Queue Response");
    expect(page).toContain("Real ops telemetry");

    for (const table of ["loads", "match_offers", "matches", "match_requests", "hc_load_matching_queue", "uncovered_load_alerts", "match_outcomes", "hc_pay_revenue"]) {
      expect(readModel).toContain(`"${table}"`);
    }
    expect(readModel).toContain("No canonical match_offers records are visible yet");
    expect(readModel).toContain("No accepted matches are visible yet");
    expect(readModel).toContain("No hc_load_matching_queue rows are visible");
    expect(readModel).toContain("No uncovered_load_alerts rows are visible");
    expect(readModel).toContain("queueResponseRate");
    expect(readModel).toContain("notificationPendingQueueRows");
    expect(readModel).not.toContain("match_reason");
    expect(readModel).not.toContain("candidate_entity_id");
    expect(readModel).toContain("No hc_pay_revenue attribution rows are visible for matching yet");
    expect(readModel).not.toContain('.from("jobs")');
  });
});
