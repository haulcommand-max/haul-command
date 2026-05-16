import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("enterprise autonomous page", () => {
  it("uses unified AV read views and policy disclaimer instead of named partner claims", () => {
    const source = read("app/enterprise/autonomous/page.tsx");

    expect(source).toContain("read_av_operator_universe");
    expect(source).toContain("mv_av_operator_universe");
    expect(source).toContain("v_av_operator_universe");
    expect(source).toContain("v_av_corridor_readiness_unified");
    expect(source).toContain("av.disclaimer.required_on_all_public_surfaces");
    expect(source).toContain("No named-partner shortcut");
    expect(source).not.toMatch(/\b(Aurora|Kodiak|Waymo|TuSimple|Waabi|Gatik|Torc)\b/);
  });
});
