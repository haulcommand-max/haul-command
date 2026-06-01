import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("GPS and RouteIntel hardening", () => {
  it("binds GPS breadcrumb proof writes to authenticated assigned operators", () => {
    const route = read("app/api/gps/breadcrumbs/batch/route.ts");

    expect(route).toContain("supabase.auth.getUser()");
    expect(route).toContain("Unauthorized");
    expect(route).toContain("MAX_BATCH_SIZE");
    expect(route).toContain("operator_id must match the authenticated user");
    expect(route).toContain(".eq('assigned_operator_id', user.id)");
    expect(route).toContain("job is not assigned to the authenticated operator");
    expect(route).toContain("normalizeAccuracy");
    expect(route).toContain("isValidLatLng");
    expect(route).toContain("lat/lng must be within valid GPS ranges");
    expect(route).toContain("accuracy_m or accuracy are required");
    expect(route).toContain("must be between 0 and 50 meters");
    expect(route).toContain("GPSProofEngine.recordBreadcrumb");
    expect(route).toContain("user.id,");
    expect(route).not.toContain("b.operator_id,");
    expect(route).not.toContain("err: any");
  });

  it("keeps GPS proof writes aligned to the gps_breadcrumbs schema", () => {
    const engine = read("lib/escrow/gps-engine.ts");
    const proof = read("lib/proofs/gps-proof-generator.ts");
    const offline = read("lib/offline/gps-breadcrumbs.ts");

    expect(engine).toContain(".from('gps_breadcrumbs').insert");
    expect(engine).toContain("accuracy: accuracyM");
    expect(engine).toContain("recorded_at: recordedAt || new Date().toISOString()");
    expect(engine).toContain("source: source || 'phone_gps'");
    expect(engine).not.toContain("accuracy_m: accuracyM");

    expect(proof).toContain(".select('lat, lng, accuracy, recorded_at')");
    expect(proof).not.toContain("accuracy_m, recorded_at");

    expect(offline).toContain("accuracy_m: c.accuracy");
  });
});
