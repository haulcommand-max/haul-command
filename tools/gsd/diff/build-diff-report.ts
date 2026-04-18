export function buildDiffReport(result: any) {
  const blockingCount =
    result.regressionDebt.deadEndsIntroduced.length +
    result.regressionDebt.seoGapsIntroduced.length +
    result.regressionDebt.moneyGapsIntroduced.length +
    result.regressionDebt.mobileGapsIntroduced.length +
    result.regressionDebt.noDowngradeRisksIntroduced.length +
    result.regressionDebt.duplicateRisksIntroduced.length +
    result.regressionDebt.regressedScores.length;

  const md = [
    "# GSD Diff Analysis Report",
    "",
    `Changed files: ${result.changedFiles.length}`,
    `Blocking regression findings: ${blockingCount}`,
    "",
    "## Introduced Debt",
    `- Dead-end pages introduced: ${result.regressionDebt.deadEndsIntroduced.length}`,
    `- SEO gaps introduced: ${result.regressionDebt.seoGapsIntroduced.length}`,
    `- Money gaps introduced: ${result.regressionDebt.moneyGapsIntroduced.length}`,
    `- Mobile gaps introduced: ${result.regressionDebt.mobileGapsIntroduced.length}`,
    `- No-downgrade risks introduced: ${result.regressionDebt.noDowngradeRisksIntroduced.length}`,
    `- Duplicate risks introduced: ${result.regressionDebt.duplicateRisksIntroduced.length}`,
    `- Surfaces with score regression: ${result.regressionDebt.regressedScores.length}`,
    "",
    "## Pre-Existing Debt Left Unchanged",
    `- Dead-end pages: ${result.baselineDebt.deadEndsExisting.length}`,
    `- SEO gaps: ${result.baselineDebt.seoGapsExisting.length}`,
    `- Money gaps: ${result.baselineDebt.moneyGapsExisting.length}`,
    `- Mobile gaps: ${result.baselineDebt.mobileGapsExisting.length}`,
    `- No-downgrade risks: ${result.baselineDebt.noDowngradeRisksExisting.length}`,
    `- Duplicate risks: ${result.baselineDebt.duplicateRisksExisting.length}`,
    "",
    "## Improvements",
    `- Dead-end pages resolved: ${result.improvements.deadEndsResolved.length}`,
    `- SEO gaps resolved: ${result.improvements.seoGapsResolved.length}`,
    `- Money gaps resolved: ${result.improvements.moneyGapsResolved.length}`,
    `- Mobile gaps resolved: ${result.improvements.mobileGapsResolved.length}`,
    `- No-downgrade risks resolved: ${result.improvements.noDowngradeRisksResolved.length}`,
    `- Duplicate risks resolved: ${result.improvements.duplicateRisksResolved.length}`,
    `- Score improvements: ${result.improvements.improvedScores.length}`,
    "",
    "## Regressed Surfaces",
    ...result.regressionDebt.regressedScores.slice(0, 30).map((d: any) =>
      `- ${d.surfaceKey}: overall ${d.beforeOverall} → ${d.afterOverall}, seo ${d.beforeSeo} → ${d.afterSeo}, money ${d.beforeMoney} → ${d.afterMoney}, ux ${d.beforeUx} → ${d.afterUx}`
    ),
  ].join("\n");

  return {
    blockingCount,
    markdown: md,
  };
}
