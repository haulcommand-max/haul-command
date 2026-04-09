import fs from "node:fs";
import { getChangedFiles } from "./get-changed-files";
import { buildCurrentBranchSnapshot } from "./build-branch-snapshot";
import { buildBaseBranchSnapshot } from "./load-main-branch-artifacts";
import { detectRegressionDebt } from "./detect-regression-debt";
import { buildDiffReport } from "./build-diff-report";
import { syncDiffFindings } from "./sync-diff-findings";

async function main() {
  const baseBranch = process.env.GSD_BASE_BRANCH || "origin/main";
  const projectId = process.env.GSD_PROJECT_ID || "";
  const prNumber = process.env.PR_NUMBER ? Number(process.env.PR_NUMBER) : null;
  const headSha = process.env.GITHUB_SHA || "HEAD";

  const changed = getChangedFiles(baseBranch);
  const baseSnapshot = buildBaseBranchSnapshot(baseBranch);
  const headSnapshot = buildCurrentBranchSnapshot();

  const result = detectRegressionDebt({
    baseSnapshot,
    headSnapshot,
    changedFiles: changed.changedFiles,
  });

  const report = buildDiffReport(result);

  fs.writeFileSync(
    ".planning/gsd-diff-report.json",
    JSON.stringify(
      {
        baseRef: baseBranch,
        mergeBase: changed.mergeBase,
        changedFiles: changed.changedFiles,
        ...result,
      },
      null,
      2
    ),
    "utf8"
  );

  fs.writeFileSync(".planning/gsd-diff-report.md", report.markdown, "utf8");

  const regressionQueue = [
    ...result.regressionDebt.deadEndsIntroduced.map((x: any) => ({ type: "dead_end", ...x })),
    ...result.regressionDebt.seoGapsIntroduced.map((x: any) => ({ type: "seo_gap", ...x })),
    ...result.regressionDebt.moneyGapsIntroduced.map((x: any) => ({ type: "money_gap", ...x })),
    ...result.regressionDebt.mobileGapsIntroduced.map((x: any) => ({ type: "mobile_gap", ...x })),
    ...result.regressionDebt.noDowngradeRisksIntroduced.map((x: any) => ({ type: "no_downgrade_risk", ...x })),
    ...result.regressionDebt.duplicateRisksIntroduced.map((x: any) => ({ type: "duplicate_risk", ...x })),
    ...result.regressionDebt.regressedScores.map((x: any) => ({ type: "score_regression", ...x })),
  ];

  fs.writeFileSync(
    ".planning/gsd-regression-queue.json",
    JSON.stringify(regressionQueue, null, 2),
    "utf8"
  );

  if (projectId) {
    await syncDiffFindings({
      projectId,
      report: result,
      baseRef: baseBranch,
      headSha,
      prNumber,
    });
  }

  const blockingCount = report.blockingCount;
  if (blockingCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
