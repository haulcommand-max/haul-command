import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const PUBLIC_AD_BUY_FILES = [
  "app/(public)/advertise/buy/page.tsx",
  "app/(public)/advertise/buy/CheckoutButton.tsx",
];

describe("advertise buy copy hygiene", () => {
  it("keeps the sponsor buying surface free of mojibake and emoji decorations", () => {
    for (const path of PUBLIC_AD_BUY_FILES) {
      const source = readFileSync(join(root, path), "utf8");

      expect(source, path).not.toMatch(/[\u00c0-\u00ff]/);
      expect(source, path).not.toMatch(/\ufffd/);
      expect(source, path).not.toMatch(/[\u{1f300}-\u{1faff}]/u);
    }
  });

  it("keeps the page focused on buyer value, proof separation, and market context", () => {
    const source = readFileSync(join(root, "app/(public)/advertise/buy/page.tsx"), "utf8");

    expect(source).toContain("Sponsor heavy-haul directory demand");
    expect(source).toContain("Paid placement is labeled");
    expect(source).toContain("Claim status, verification, ratings, and source confidence stay separate");
    expect(source).toContain("Florida is the first active monetization market");
  });
});
