import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  join(
    process.cwd(),
    "app",
    "(public)",
    "tools",
    "escort-requirement-checker",
    "page.tsx",
  ),
  "utf8",
);

describe("escort requirement checker routing repair", () => {
  it("keeps requirement intent away from quote worksheet routes", () => {
    expect(pageSource).not.toContain('/tools/escort-calculator"');
    expect(pageSource).not.toContain('/tools/instant-quote"');
    expect(pageSource).not.toContain('/quote"');
    expect(pageSource).not.toContain("Planning Quote");
    expect(pageSource).not.toContain("Worksheet");
  });

  it("routes users to requirement and regulation surfaces with permit authority caveat", () => {
    expect(pageSource).toContain('href: "/escort-requirements"');
    expect(pageSource).toContain('href: "/tools/state-requirements"');
    expect(pageSource).toContain('href: "/regulations"');
    expect(pageSource).toContain("Local permit authority must verify final legal requirements");
  });
});
