import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("legacy load ingest observation contract", () => {
  it("keeps active alert dedupe while preserving repeated demand observations", () => {
    const route = read("app/api/loads/ingest/route.ts");

    expect(route).toContain("hc_ingestion_batches");
    expect(route).toContain("hc_market_observations");
    expect(route).toContain("hc_corridor_intelligence");
    expect(route).toContain(".from('hc_load_alerts')");
    expect(route).toContain("upsert(loadRecords, { onConflict: 'dedup_key', ignoreDuplicates: true })");

    expect(route.indexOf(".from('hc_market_observations')")).toBeLessThan(
      route.indexOf(".from('hc_load_alerts')"),
    );
    expect(route).toContain("observation_count: previousObservations + count");
    expect(route).toContain("unique_actor_count: previousActors +");
    expect(route).toContain("corridor_strength_score: Math.min(previousObservations + count, 100)");
  });
});
