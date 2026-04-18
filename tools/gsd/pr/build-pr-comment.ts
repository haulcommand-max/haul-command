import { ClassifiedFailures } from "./classify-failures";
import { RetrofitTaskPayload } from "./build-retrofit-tasks";

export function buildPrComment(params: {
  marker: string;
  prNumber: number;
  sha: string;
  failures: ClassifiedFailures;
  retrofitTasks: RetrofitTaskPayload[];
  insertedRetrofitCount?: number;
  diffReport?: any | null;
}) {
  const status = params.failures.hasBlockingIssues ? "FAIL" : "PASS";

  const lines: string[] = [
    params.marker,
    `# Haul Command GSD PR Review — ${status}`,
    "",
    `**PR:** #${params.prNumber}`,
    `**Commit:** \`${params.sha.slice(0, 12)}\``,
    `**Blocking issues:** ${params.failures.hasBlockingIssues ? "Yes" : "No"}`,
    `**Total findings:** ${params.failures.totalFailures}`,
    "",
  ];

  if (params.diffReport) {
    lines.push("## Diff-Aware Summary");
    lines.push(`- Introduced dead-end pages: ${params.diffReport.regressionDebt.deadEndsIntroduced.length}`);
    lines.push(`- Introduced SEO gaps: ${params.diffReport.regressionDebt.seoGapsIntroduced.length}`);
    lines.push(`- Introduced money gaps: ${params.diffReport.regressionDebt.moneyGapsIntroduced.length}`);
    lines.push(`- Introduced mobile gaps: ${params.diffReport.regressionDebt.mobileGapsIntroduced.length}`);
    lines.push(`- Introduced no-downgrade risks: ${params.diffReport.regressionDebt.noDowngradeRisksIntroduced.length}`);
    lines.push(`- Introduced duplicate risks: ${params.diffReport.regressionDebt.duplicateRisksIntroduced.length}`);
    lines.push(`- Score regressions: ${params.diffReport.regressionDebt.regressedScores.length}`);
    lines.push("");
    lines.push(`- Pre-existing dead-end debt unchanged: ${params.diffReport.baselineDebt.deadEndsExisting.length}`);
    lines.push(`- Pre-existing SEO debt unchanged: ${params.diffReport.baselineDebt.seoGapsExisting.length}`);
    lines.push(`- Pre-existing money debt unchanged: ${params.diffReport.baselineDebt.moneyGapsExisting.length}`);
    lines.push(`- Improvements shipped: ${params.diffReport.improvements.improvedScores.length}`);
    lines.push("");
  }

  if (params.failures.blockingReasons.length > 0) {
    lines.push("## Blocking Reasons");
    for (const reason of params.failures.blockingReasons) {
      lines.push(`- ${reason}`);
    }
    lines.push("");
  }

  if (params.failures.buckets.length > 0) {
    lines.push("## Findings by Bucket");
    for (const bucket of params.failures.buckets) {
      lines.push(`### ${bucket.label} (${bucket.count})`);
      lines.push(`Severity: **${bucket.severity.toUpperCase()}**`);
      lines.push("");

      for (const item of bucket.items.slice(0, 12)) {
        const label = item.surfaceKey || item.label || item.sourcePath || "unknown";
        const reason = item.reason || "No reason provided.";
        const hint = item.hint ? ` Hint: ${item.hint}` : "";
        lines.push(`- \`${label}\` — ${reason}${hint}`);
      }

      if (bucket.items.length > 12) {
        lines.push(`- ...and ${bucket.items.length - 12} more`);
      }

      lines.push("");
    }
  }

  lines.push("## Auto-Generated Retrofit Queue");
  lines.push(`Generated tasks: **${params.retrofitTasks.length}**`);
  if (typeof params.insertedRetrofitCount === "number") {
    lines.push(`Inserted into Supabase: **${params.insertedRetrofitCount}**`);
  }
  lines.push("");

  for (const task of params.retrofitTasks.slice(0, 15)) {
    lines.push(`- **${task.title}**`);
    lines.push(`  - Gap: ${task.standardGap}`);
    lines.push(`  - Priority: ${task.priority}`);
    if (task.sourcePath) lines.push(`  - Source: \`${task.sourcePath}\``);
  }

  if (params.retrofitTasks.length > 15) {
    lines.push(`- ...and ${params.retrofitTasks.length - 15} more retrofit tasks`);
  }

  lines.push("");
  lines.push("## Required Action");
  if (params.diffReport) {
    lines.push("- Fix debt introduced by this PR first.");
    lines.push("- Do not confuse unchanged baseline debt with new regressions.");
    lines.push("- Re-run diff analysis and GSD gates after fixes.");
  } else if (params.failures.hasBlockingIssues) {
    lines.push("- Fix the failing surfaces.");
    lines.push("- Re-run the GSD mapper and CI gates.");
    lines.push("- Confirm the retrofit queue is addressed or intentionally deferred.");
  } else {
    lines.push("- No blocking issues detected.");
    lines.push("- Review generated retrofit tasks for non-blocking improvements.");
  }

  lines.push("");
  lines.push("_This comment is managed automatically by the Haul Command GSD PR feedback system._");

  return lines.join("\n");
}
