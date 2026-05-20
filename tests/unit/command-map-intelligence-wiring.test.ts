import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildHardFillFeatureCollection,
  sanitizeHardFillReasons,
  type HardFillIntelRow,
} from "@/lib/maps/hard-fill-features";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("command map hard-fill intelligence wiring", () => {
  it("keeps the map wired to the source-backed hard-fill route", () => {
    const source = readRepoFile("components/map/CommandMapV2.tsx");

    expect(source).toContain("fetch('/api/map/hard-fills')");
  });

  it("keeps the hard-fill route source-backed and sanitized", () => {
    const routeSource = readRepoFile("app/api/map/hard-fills/route.ts");

    expect(routeSource).toContain('from("hard_fill_intelligence")');
    expect(routeSource).toContain('from("loads")');
    expect(routeSource).not.toMatch(/mock|demo|sample|static hard-fill/i);
    expect(routeSource).not.toMatch(/phone|push_token|user_id|profile_id|v_active_escort_supply/i);
  });

  it("converts hard-fill intelligence into non-PII GeoJSON points", () => {
    const intelRows: HardFillIntelRow[] = [
      {
        load_id: "load-1",
        computed_at: "2026-05-20T16:00:00.000Z",
        hard_fill_risk_score_01: 0.91,
        hard_fill_label: "Critical",
        top_reasons: [
          { reason: "No claimed escort coverage near origin" },
          "tight pickup window",
          { ignored: "not public" },
        ],
      },
    ];

    const collection = buildHardFillFeatureCollection(intelRows, [
      {
        id: "load-1",
        title: "Transformer move",
        origin_lat: 29.7604,
        origin_lng: -95.3698,
        origin_city: "Houston",
        origin_state: "TX",
        status: "open",
      },
    ]);

    expect(collection.source_status).toBe("source_backed");
    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].geometry.coordinates).toEqual([-95.3698, 29.7604]);
    expect(collection.features[0].properties).toMatchObject({
      load_id: "load-1",
      hard_fill_label: "Critical",
      hard_fill_risk_score_01: 0.91,
      city: "Houston",
      state: "TX",
      source_status: "source_backed",
    });
    expect(collection.features[0].properties).not.toHaveProperty("broker_id");
    expect(collection.features[0].properties).not.toHaveProperty("phone");
    expect(collection.features[0].properties.top_reasons).toEqual([
      "No claimed escort coverage near origin",
      "tight pickup window",
    ]);
  });

  it("drops rows without source-backed coordinates instead of fabricating map points", () => {
    const collection = buildHardFillFeatureCollection(
      [
        {
          load_id: "load-without-coordinates",
          computed_at: null,
          hard_fill_risk_score_01: 0.75,
          hard_fill_label: "High",
          top_reasons: ["missing route support"],
        },
      ],
      [
        {
          id: "load-without-coordinates",
          title: "Missing coords",
          origin_lat: null,
          origin_lng: null,
          origin_city: "Dallas",
          origin_state: "TX",
          status: "open",
        },
      ],
    );

    expect(collection).toEqual({
      type: "FeatureCollection",
      source_status: "source_backed_empty",
      features: [],
    });
  });

  it("limits and sanitizes source reason payloads", () => {
    const reasons = sanitizeHardFillReasons([
      { reason: "first" },
      { label: "second" },
      { message: "third" },
      { name: "fourth" },
    ]);

    expect(reasons).toEqual(["first", "second", "third"]);
  });
});
