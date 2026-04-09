import { compareGapLists } from "./compare-gaps";
import { compareScores } from "./compare-scores";
import { compareDuplicates } from "./compare-duplicates";

export function detectRegressionDebt(params: {
  baseSnapshot: any;
  headSnapshot: any;
  changedFiles: string[];
}) {
  const changedSet = new Set(params.changedFiles);

  const scoreDeltas = compareScores(params.baseSnapshot.scores, params.headSnapshot.scores);

  const deadEnds = compareGapLists(params.baseSnapshot.deadEnds, params.headSnapshot.deadEnds);
  const seoGaps = compareGapLists(params.baseSnapshot.seoGaps, params.headSnapshot.seoGaps);
  const moneyGaps = compareGapLists(params.baseSnapshot.moneyGaps, params.headSnapshot.moneyGaps);
  const mobileGaps = compareGapLists(params.baseSnapshot.mobileGaps, params.headSnapshot.mobileGaps);
  const noDowngradeRisks = compareGapLists(params.baseSnapshot.noDowngradeRisks, params.headSnapshot.noDowngradeRisks);
  const duplicateRisks = compareDuplicates(params.baseSnapshot.duplicateRisks, params.headSnapshot.duplicateRisks);

  const introducedOnlyForChanged = (items: any[]) =>
    items.filter((item) => {
      const src = item.sourcePath || "";
      if (!src) return true;
      return changedSet.has(src);
    });

  const regressedScores = scoreDeltas.filter((delta) => {
    if (!delta.regression) return false;
    return changedSet.has(delta.surfaceKey) || changedSet.has((delta as any).sourcePath || "");
  });

  return {
    changedFiles: params.changedFiles,
    scoreDeltas,
    regressionDebt: {
      deadEndsIntroduced: introducedOnlyForChanged(deadEnds.introduced),
      seoGapsIntroduced: introducedOnlyForChanged(seoGaps.introduced),
      moneyGapsIntroduced: introducedOnlyForChanged(moneyGaps.introduced),
      mobileGapsIntroduced: introducedOnlyForChanged(mobileGaps.introduced),
      noDowngradeRisksIntroduced: introducedOnlyForChanged(noDowngradeRisks.introduced),
      duplicateRisksIntroduced: duplicateRisks.introduced,
      regressedScores,
    },
    baselineDebt: {
      deadEndsExisting: deadEnds.unchanged,
      seoGapsExisting: seoGaps.unchanged,
      moneyGapsExisting: moneyGaps.unchanged,
      mobileGapsExisting: mobileGaps.unchanged,
      noDowngradeRisksExisting: noDowngradeRisks.unchanged,
      duplicateRisksExisting: duplicateRisks.unchanged,
    },
    improvements: {
      deadEndsResolved: deadEnds.resolved,
      seoGapsResolved: seoGaps.resolved,
      moneyGapsResolved: moneyGaps.resolved,
      mobileGapsResolved: mobileGaps.resolved,
      noDowngradeRisksResolved: noDowngradeRisks.resolved,
      duplicateRisksResolved: duplicateRisks.resolved,
      improvedScores: scoreDeltas.filter((d) => !d.regression && ((d.overallDelta ?? 0) > 0 || (d.seoDelta ?? 0) > 0 || (d.moneyDelta ?? 0) > 0 || (d.uxDelta ?? 0) > 0)),
    },
  };
}
