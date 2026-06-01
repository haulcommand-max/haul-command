import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("load emergency fill money spine", () => {
  it("retires the duplicate load-scoped emergency fill route behind checkout", () => {
    const route = read("app/api/loads/emergency-fill/route.ts");

    expect(route).toContain("requires_checkout");
    expect(route).toContain("canonical_route: '/api/emergency-fill'");
    expect(route).toContain("checkout_route: '/api/stripe/emergency-fill'");
    expect(route).not.toContain("getSupabaseAdmin");
    expect(route).not.toContain("Novu");
    expect(route).not.toContain(".from('emergency_fills')");
    expect(route).not.toContain("success: true");
  });
});
