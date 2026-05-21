import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("route-support infrastructure canonicalization", () => {
  it("seeds route-support categories without creating a competing directory", () => {
    const sql = readFileSync("supabase/migrations/20260521182000_route_support_category_registry.sql", "utf8");

    for (const key of [
      "truck_stops",
      "rest_areas",
      "route_support_weigh_stations",
      "route_support_truck_parking",
      "route_support_ports",
      "route_support_rail_intermodal",
      "route_support_border_crossings",
      "route_support_tunnels",
    ]) {
      expect(sql).toContain(key);
    }

    expect(sql).toContain("directory_entities remains the canonical public graph");
    expect(sql).toContain("truck_stops table remains a specialized source table");
    expect(sql).toContain("v_hc_route_support_category_audit");
    expect(sql).toContain("'border_crossing'");
    expect(sql).toContain("'tunnel_authority'");
  });

  it("serves infrastructure from the readiness view instead of the raw truck_stops table", () => {
    const route = readFileSync("app/api/infrastructure/route.ts", "utf8");

    expect(route).toContain("v_hc_public_infrastructure_readiness");
    expect(route).toContain("CATEGORY_SUBTYPES");
    expect(route).toContain("truck_stops remain specialized");
    expect(route).not.toContain(".from('truck_stops')");
    expect(route).not.toContain("category: 'staging_yard'");
  });
});
