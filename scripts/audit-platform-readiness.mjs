#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const REPO_ROOT = process.cwd();
const DEFAULT_REPORT = path.join(REPO_ROOT, "reports", "platform-readiness-addendum.json");

export const DUPLICATE_TABLE_PAIRS = [
  ["hc_adgrid_impression", "hc_adgrid_impressions"],
  ["hc_claim_request", "hc_claim_requests"],
  ["hc_event", "hc_events"],
  ["hc_escrow", "hc_escrows"],
  ["hc_project", "hc_projects"],
  ["hc_sitemap_url", "hc_sitemap_urls"],
  ["hc_stripe_account", "hc_stripe_accounts"],
  ["hc_country_config", "hc_country_configs"],
];

export const CANONICAL_SPLIT_FINDINGS = [
  {
    key: "operator_universe_layering",
    priority: "P0",
    canonicalRead: "read_av_operator_universe",
    warning: "Do not treat hc_global_operators as global; server-side reads should prefer mv_av_operator_universe through read_av_operator_universe and fall back to v_av_operator_universe.",
  },
  {
    key: "corridor_readiness_layering",
    priority: "P0",
    canonicalRead: "v_av_corridor_readiness_unified",
    warning: "Do not read AV corridor readiness from hc_corridor_spec or hc_corridors alone until the corridor canonical is resolved.",
  },
  {
    key: "seo_pages_split",
    priority: "P0",
    canonicalRead: "hc_seo_pages",
    warning: "seo_pages contains a small populated indexable set; grep app reads and migrate or preserve before dropping.",
  },
  {
    key: "adgrid_inventory_layering",
    priority: "P1",
    canonicalRead: "pending_triage",
    warning: "Live pg_stat evidence says adgrid_inventory has heavy update traffic while repo evidence shows limited direct reads; treat adgrid_inventory, hc_adgrid_inventory, and hc_adgrid_page_inventory as unresolved layers until live dependency and write-path review is complete.",
  },
];

export const SUPABASE_READINESS_FINDINGS = [
  {
    key: "operator_geocode_gap",
    priority: "P0",
    metric: "8027/8027 operators missing lat/lng in live Supabase snapshot",
    repoOwnedResponse: "Run a queue-aware geocoder against v_operator_geocode_queue; do not claim map/proximity readiness before rows are written.",
  },
  {
    key: "operator_enrichment_gap",
    priority: "P0",
    metric: "8027/8027 operators missing useful about/specialties/future_capability_tags signals",
    repoOwnedResponse: "Run website/profile enrichment before AV/drone inference; keep AV-ready filters empty until evidence exists.",
  },
  {
    key: "glossary_schema_gap",
    priority: "P0",
    metric: "10011/10011 glossary terms missing schema_json in live Supabase snapshot",
    repoOwnedResponse: "Backfill deterministic DefinedTerm/FAQPage schema_json from v_glossary_enrichment_queue and rerun quality checks.",
  },
  {
    key: "duplicate_table_pairs",
    priority: "P2",
    metric: "56 hc_/unprefixed pairs exist live; 8 singular/plural pairs are tracked locally for immediate app usage triage",
    repoOwnedResponse: "Scan code references, choose canonical table per pair, migrate data, then remove the loser in a reviewed migration.",
  },
];

const SCAN_DIRS = [
  "app",
  "components",
  "lib",
  "scripts",
  "supabase/functions",
  "supabase/migrations",
  "tests",
  "workers",
];

export const CANONICAL_READ_PATHS = [
  {
    key: "operator_layers",
    preferredRead: "read_av_operator_universe",
    directTables: ["hc_global_operators", "hc_operators", "directory_entities"],
  },
  {
    key: "corridor_layers",
    preferredRead: "v_av_corridor_readiness_unified",
    directTables: ["hc_corridor_spec", "hc_corridors"],
  },
  {
    key: "seo_layers",
    preferredRead: "hc_seo_pages",
    directTables: ["seo_pages", "hc_seo_pages"],
  },
  {
    key: "adgrid_inventory_layers",
    preferredRead: "pending_triage",
    directTables: ["adgrid_inventory", "hc_adgrid_inventory", "hc_adgrid_page_inventory"],
  },
];

const SKIP_DIRS = new Set([".git", ".next", "node_modules", "coverage", "reports", "tmp"]);
const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, out);
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

function countTableRefs(source, tableName) {
  const pattern = new RegExp(`(?<![a-zA-Z0-9_])${tableName}(?![a-zA-Z0-9_])`, "g");
  return source.match(pattern)?.length ?? 0;
}

export function buildDuplicateTableUsageReport(repoRoot = REPO_ROOT, options = {}) {
  const scanDirs = options.scanDirs ?? SCAN_DIRS;
  const files = scanDirs.flatMap((dir) => walkFiles(path.join(repoRoot, dir)));

  return DUPLICATE_TABLE_PAIRS.map(([singular, plural]) => {
    const refs = [];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const singularCount = countTableRefs(source, singular);
      const pluralCount = countTableRefs(source, plural);
      if (singularCount || pluralCount) {
        refs.push({
          file: path.relative(repoRoot, file).replaceAll("\\", "/"),
          singularCount,
          pluralCount,
        });
      }
    }

    const totals = refs.reduce(
      (acc, ref) => ({
        singular: acc.singular + ref.singularCount,
        plural: acc.plural + ref.pluralCount,
      }),
      { singular: 0, plural: 0 },
    );

    return {
      singular,
      plural,
      totals,
      referencedFiles: refs.length,
      likelyCanonical: totals.plural > totals.singular ? plural : totals.singular > totals.plural ? singular : null,
      action:
        totals.singular === 0 && totals.plural === 0
          ? "No repo references found; verify live dependencies before dropping either table."
          : "Review references and live row counts before writing a merge/drop migration.",
      refs: refs.slice(0, 30),
    };
  });
}

export function buildCanonicalReadPathReport(repoRoot = REPO_ROOT, options = {}) {
  const scanDirs = options.scanDirs ?? SCAN_DIRS;
  const files = scanDirs.flatMap((dir) => walkFiles(path.join(repoRoot, dir)));

  return CANONICAL_READ_PATHS.map((group) => {
    const tableRefs = Object.fromEntries(group.directTables.map((table) => [table, { total: 0, files: [] }]));

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const table of group.directTables) {
        const count = countTableRefs(source, table);
        if (count > 0) {
          tableRefs[table].total += count;
          tableRefs[table].files.push(path.relative(repoRoot, file).replaceAll("\\", "/"));
        }
      }
    }

    return {
      key: group.key,
      preferredRead: group.preferredRead,
      directRefs: tableRefs,
      action:
        group.preferredRead === "pending_triage"
          ? "Keep all layer tables. Reconcile repo references, live pg_stat write heat, row counts, RLS, and dependent views before any drop/merge migration."
          : group.preferredRead === "read_av_operator_universe"
            ? "For read-heavy AV operator paths, call the private helper so mv_av_operator_universe is preferred and v_av_operator_universe remains the fallback."
            : "For read-heavy AV/readiness/search/reporting paths, prefer the unified view and keep direct table writes explicit.",
    };
  });
}

export function buildPlatformReadinessAddendum(repoRoot = REPO_ROOT) {
  return {
    generatedAt: new Date().toISOString(),
    source: "repo scan plus user-supplied live Supabase readiness snapshot",
    findings: SUPABASE_READINESS_FINDINGS,
    canonicalSplitFindings: CANONICAL_SPLIT_FINDINGS,
    duplicateTableUsage: buildDuplicateTableUsageReport(repoRoot),
    canonicalReadPathUsage: buildCanonicalReadPathReport(repoRoot),
    nextCommands: [
      "npm run audit:platform-readiness",
      "npm run backfill:glossary-schema -- --dry-run --limit 25",
      "npm run geocode:operator-queue -- --dry-run --limit 25",
    ],
  };
}

function parseArgs(argv) {
  return {
    write: argv.includes("--write"),
    output: argv.includes("--output") ? argv[argv.indexOf("--output") + 1] : DEFAULT_REPORT,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = parseArgs(process.argv.slice(2));
  const report = buildPlatformReadinessAddendum(REPO_ROOT);
  const json = `${JSON.stringify(report, null, 2)}\n`;

  if (args.write) {
    mkdirSync(path.dirname(args.output), { recursive: true });
    writeFileSync(args.output, json);
    console.log(`Wrote ${path.relative(REPO_ROOT, args.output)}`);
  } else {
    process.stdout.write(json);
  }
}
