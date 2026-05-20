#!/usr/bin/env node
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();

function read(relativePath) {
  const path = join(root, relativePath);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function countMatches(text, pattern) {
  return Array.from(text.matchAll(pattern)).length;
}

export function buildMediaGovernanceReport(baseDir = process.cwd()) {
  const file = (relativePath) => {
    const path = join(baseDir, relativePath);
    return existsSync(path) ? readFileSync(path, "utf8") : "";
  };

  const createRoute = file("app/api/video/create/route.ts");
  const statusRoute = file("app/api/video/check-status/route.ts");
  const fromUrlRoute = file("app/api/video/create-from-url/route.ts");
  const adminListRoute = file("app/api/video/admin-list/route.ts");
  const publishRoute = file("app/api/video/publish-youtube/route.ts");
  const migration = file("supabase/migrations/20260520093000_media_command_center_governance.sql");

  const errors = [];
  const warnings = [];

  const heygenGenerateCalls = countMatches(createRoute, /heygenRequest\(['"]\/v\d+\/video\/generate/g);
  const translationLanguages = (statusRoute.match(/const TRANSLATE_LANGUAGES = \[([^\]]*)\]/)?.[1] ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean).length;

  if (!createRoute.includes("requireInternalRequest(req)")) {
    errors.push("video_create_missing_internal_auth");
  }
  if (!fromUrlRoute.includes("requireInternalRequest(req)")) {
    errors.push("video_create_from_url_missing_internal_auth");
  }
  if (/elaiRequest\(|ELAI_API_KEY|apis\.elai\.io/.test(createRoute)) {
    errors.push("video_create_still_contains_elai_generation");
  }
  if (/elaiRequest\(|ELAI_API_KEY|apis\.elai\.io/.test(fromUrlRoute)) {
    errors.push("video_create_from_url_still_contains_elai_generation");
  }
  if (!fromUrlRoute.includes("Legacy Elai article-to-video generation is retired")) {
    errors.push("legacy_elai_create_from_url_not_explicitly_retired");
  }
  if (!adminListRoute.includes("requireAdminRequest()")) {
    errors.push("video_admin_list_missing_admin_auth");
  }
  if (!createRoute.includes("assertPaidProviderAllowed")) {
    errors.push("video_create_missing_cost_governor");
  }
  if (!createRoute.includes("paid avatar video blocked") && !createRoute.includes("Media Cost Governor")) {
    errors.push("video_create_missing_block_response");
  }
  if (!statusRoute.includes("translation_approved === true")) {
    errors.push("translation_fanout_missing_explicit_approval");
  }
  if (!statusRoute.includes("winnerSignal")) {
    errors.push("translation_fanout_missing_winner_signal_gate");
  }
  if (statusRoute.includes("job.provider === 'heygen' || HEYGEN_API_KEY")) {
    errors.push("status_polling_can_misroute_elai_jobs_to_heygen");
  }
  if (!publishRoute.includes("x-cron-secret") || !publishRoute.includes("x-admin-secret")) {
    errors.push("youtube_publish_missing_secret_gate");
  }
  if (!adminListRoute.includes("admin_approved")) {
    errors.push("video_admin_approval_not_visible");
  }

  for (const field of [
    "media_asset_ledger",
    "media_opportunities",
    "pr_journalist_relationships",
    "podcast_placements",
    "media_money_path",
    "cost_governor_decision",
    "translation_approved",
  ]) {
    if (!migration.includes(field)) errors.push(`migration_missing_${field}`);
  }

  if (heygenGenerateCalls > 2) warnings.push("heygen_generate_fanout_above_expected");
  if (translationLanguages > 0) warnings.push(`translation_languages_configured_${translationLanguages}`);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    metrics: {
      heygenGenerateCalls,
      translationLanguages,
      hasMediaLedger: migration.includes("media_asset_ledger"),
      hasCostGovernor: createRoute.includes("assertPaidProviderAllowed"),
    },
  };
}

function main() {
  const report = buildMediaGovernanceReport(root);
  const json = JSON.stringify(report, null, 2);

  if (process.argv.includes("--write")) {
    const reportDir = join(root, "reports");
    mkdirSync(reportDir, { recursive: true });
    writeFileSync(join(reportDir, "media-governance.json"), `${json}\n`);
  }

  console.log(json);
  if (!report.ok) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
