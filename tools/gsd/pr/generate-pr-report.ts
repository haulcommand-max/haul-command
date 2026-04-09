import fs from "node:fs";
import { requireEnv, optionalEnv } from "../shared/env";
import { parseGsdOutput } from "./parse-gsd-output";
import { classifyFailures } from "./classify-failures";
import { buildRetrofitTasks } from "./build-retrofit-tasks";
import { syncRetrofitTasks } from "./sync-retrofit-tasks";
import { buildPrComment } from "./build-pr-comment";
import { upsertManagedPrComment } from "./github-comment";
import { publishGsdCheckSummary } from "./github-check-summary";

async function main() {
  const prNumber = Number(requireEnv("PR_NUMBER"));
  const headSha = requireEnv("GITHUB_SHA");
  const projectId = requireEnv("GSD_PROJECT_ID");
  const marker = optionalEnv(
    "GSD_PR_COMMENT_MARKER",
    "<!-- haul-command-gsd-pr-comment -->"
  );

  const data = parseGsdOutput();
  const failures = classifyFailures(data);
  const retrofitTasks = buildRetrofitTasks(data);

  let diffReport: any | null = null;
  if (fs.existsSync(".planning/gsd-diff-report.json")) {
    diffReport = JSON.parse(fs.readFileSync(".planning/gsd-diff-report.json", "utf8"));
  }

  fs.writeFileSync(
    ".planning/gsd-retrofit-queue.json",
    JSON.stringify(retrofitTasks, null, 2),
    "utf8"
  );

  const syncResult = await syncRetrofitTasks({
    projectId,
    tasks: retrofitTasks,
  });

  const commentBody = buildPrComment({
    marker,
    prNumber,
    sha: headSha,
    failures,
    retrofitTasks,
    insertedRetrofitCount: syncResult.inserted,
    diffReport,
  });

  fs.writeFileSync(".planning/gsd-pr-comment.md", commentBody, "utf8");
  fs.writeFileSync(
    ".planning/gsd-pr-report.json",
    JSON.stringify(
      {
        prNumber,
        sha: headSha,
        failures,
        retrofitTaskCount: retrofitTasks.length,
        insertedRetrofitCount: syncResult.inserted,
        diffReport,
      },
      null,
      2
    ),
    "utf8"
  );

  await upsertManagedPrComment({
    prNumber,
    body: commentBody,
  });

  await publishGsdCheckSummary({
    headSha,
    failures,
  });

  if (failures.hasBlockingIssues) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
