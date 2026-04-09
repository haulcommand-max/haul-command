import path from "node:path";
import { gsdConfig } from "../../../gsd.config";
import { fileContentAtRef, mergeBase, refExists, runGit } from "../shared/git";
import { FileRecord } from "../shared/types";
import { parseNextRoutes } from "../ast/parse-next-routes";
import { parseComponents } from "../ast/parse-components";
import { parseApiRoutes } from "../ast/parse-api-routes";
import { detectDuplicates } from "../ast/detect-duplicates";
import { detectDeadEnds } from "../ast/detect-dead-ends";
import { detectSeoGaps } from "../ast/detect-seo-gaps";
import { detectMonetizationGaps } from "../ast/detect-monetization-gaps";
import { detectMobileGaps } from "../ast/detect-mobile-gaps";
import { detectNoDowngradeRisks } from "../ast/detect-no-downgrade-risks";
import { scoreSurfaces } from "../ast/score-surfaces";

function listTrackedFilesAtRef(ref: string): string[] {
  const output = runGit(`git ls-tree -r --name-only ${ref}`);
  return output ? output.split("\n").map((x) => x.trim()).filter(Boolean) : [];
}

export function buildBaseBranchSnapshot(baseBranch = "origin/main") {
  if (!refExists(baseBranch)) {
    throw new Error(`Base branch ref not found: ${baseBranch}`);
  }

  const base = mergeBase(baseBranch, "HEAD");
  const allFiles = listTrackedFilesAtRef(base);

  const fileRecords: FileRecord[] = allFiles
    .filter((filePath) => {
      const ext = path.extname(filePath);
      return gsdConfig.includeExtensions.includes(ext);
    })
    .filter((filePath) => {
      return !gsdConfig.ignoreDirs.some((dir) => filePath.includes(`/${dir}/`) || filePath.startsWith(`${dir}/`));
    })
    .map((filePath) => {
      const content = fileContentAtRef(base, filePath);
      if (content === null) return null;

      return {
        path: filePath,
        ext: path.extname(filePath),
        content,
      };
    })
    .filter(Boolean) as FileRecord[];

  const surfaces = [
    ...parseNextRoutes(fileRecords),
    ...parseComponents(fileRecords),
    ...parseApiRoutes(fileRecords),
  ];

  const duplicateRisks = detectDuplicates(fileRecords);
  const deadEnds = detectDeadEnds(fileRecords);
  const seoGaps = detectSeoGaps(fileRecords);
  const moneyGaps = detectMonetizationGaps(fileRecords);
  const mobileGaps = detectMobileGaps(fileRecords);
  const noDowngradeRisks = detectNoDowngradeRisks(fileRecords);

  const scores = scoreSurfaces({
    surfaces,
    deadEnds,
    seoGaps,
    moneyGaps,
    mobileGaps,
    noDowngradeRisks,
  });

  return {
    baseRef: baseBranch,
    scannedAt: new Date().toISOString(),
    surfaces,
    duplicateRisks,
    deadEnds,
    seoGaps,
    moneyGaps,
    mobileGaps,
    noDowngradeRisks,
    scores,
  };
}
