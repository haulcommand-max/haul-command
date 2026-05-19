import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const scanRoots = [
  "app/directory",
  "components/directory",
  "lib/directory",
  "components/ui/DirectorySearchBar.tsx",
  "components/hc-ask/HCAskStrip.tsx",
  "app/api/roles/chips",
  "app/api/search/suggest",
];

function collectFiles(path: string): string[] {
  const fullPath = join(root, path);
  const stat = statSync(fullPath);

  if (stat.isFile()) return [fullPath];

  return readdirSync(fullPath).flatMap((entry) => collectFiles(join(path, entry)));
}

describe("directory copy hygiene", () => {
  it("keeps public directory code free of mojibake and emoji decorations", () => {
    const files = scanRoots
      .flatMap(collectFiles)
      .filter((path) => path.endsWith(".ts") || path.endsWith(".tsx"));

    for (const path of files) {
      const source = readFileSync(path, "utf8");

      expect(source, path).not.toMatch(/[Ãâð�]/);
      expect(source, path).not.toMatch(/[\u2190-\u21ff]/);
      expect(source, path).not.toMatch(/[\u2500-\u257f]/);
      expect(source, path).not.toMatch(/[\u2600-\u27bf]/);
      expect(source, path).not.toMatch(/[\u{1f300}-\u{1faff}]/u);
    }
  });
});
