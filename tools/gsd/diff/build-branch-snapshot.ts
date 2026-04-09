import { scanFiles } from "../ast/scan-files";
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

export function buildCurrentBranchSnapshot() {
  const files = scanFiles();

  const surfaces = [
    ...parseNextRoutes(files),
    ...parseComponents(files),
    ...parseApiRoutes(files),
  ];

  const duplicateRisks = detectDuplicates(files);
  const deadEnds = detectDeadEnds(files);
  const seoGaps = detectSeoGaps(files);
  const moneyGaps = detectMonetizationGaps(files);
  const mobileGaps = detectMobileGaps(files);
  const noDowngradeRisks = detectNoDowngradeRisks(files);

  const scores = scoreSurfaces({
    surfaces,
    deadEnds,
    seoGaps,
    moneyGaps,
    mobileGaps,
    noDowngradeRisks,
  });

  return {
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
