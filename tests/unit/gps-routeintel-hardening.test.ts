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
    expect(route).toContain("GPSProofEngine.recordBreadcrumb");
    expect(route).toContain("user.id,");
    expect(route).not.toContain("b.operator_id,");
    expect(route).not.toContain("err: any");
  });
});
