import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("RouteIntel dashboard contract", () => {
  it("wires a dynamic Supabase-backed RouteIntel and GPS dashboard", () => {
    const page = read("app/admin/dashboards/routeintel/page.tsx");
    const readModel = read("lib/admin/routeintel/read-model.ts");

    expect(page).toContain("getRouteIntelDashboardReadModel");
    expect(page).toContain('dynamic = "force-dynamic"');
    expect(page).toContain("RouteIntel and GPS");
    expect(page).toContain("Source Tables");
    expect(page).not.toContain("'use client'");
    expect(page).not.toContain("Math.random");

    expect(readModel).toContain("buildRouteIntelBenchmark");
    expect(readModel).toContain('.from("gps_breadcrumbs")');
    expect(readModel).toContain('.from("hc_route_events")');
    expect(readModel).toContain('.from("crowd_road_signals")');
    expect(readModel).toContain('.from("hc_crowd_signal_votes")');
    expect(readModel).toContain('.from("enterprise_usage_events")');
    expect(readModel).toContain('.from("motive_connections")');
    expect(readModel).toContain('.from("motive_webhook_events")');
    expect(readModel).toContain('.from("hc_gps_devices")');
    expect(readModel).toContain('.from("hc_gps_latest_position")');
    expect(readModel).toContain("RouteIntel is not ready for broad paid proof claims");
    expect(readModel).toContain("No Motive or Traccar device spine");
    expect(readModel).toContain("paidProvider.computeCostUnits");
  });
});
