import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  isToolIndexable,
  isToolSchemaEligible,
  isToolVerifiedOpen,
  toolCtaLabel,
} from "@/lib/tools/tool-qa";
import { STATIC_TOOL_CONCEPTS } from "@/lib/tools/static-tool-concepts";

describe("tool registry QA gate", () => {
  it("blocks Open Tool when a registry row only has a page URL", () => {
    const row = {
      page_url: "/tools/cb-radio-channel-guide",
      route_status: null,
      qa_status: "pending",
      content_status: "pending",
      indexing_status: "coming_soon",
    };

    expect(isToolVerifiedOpen(row)).toBe(false);
    expect(isToolSchemaEligible(row)).toBe(false);
    expect(isToolIndexable(row)).toBe(false);
    expect(toolCtaLabel(row)).toBe("In Development");
  });

  it("allows Open Tool only after route, QA, and content all pass", () => {
    const row = {
      page_url: "/tools/escort-count-calculator",
      route_status: 200,
      qa_status: "pass",
      content_status: "valid",
      indexing_status: "indexable_flagship",
    };

    expect(isToolVerifiedOpen(row)).toBe(true);
    expect(isToolSchemaEligible(row)).toBe(true);
    expect(isToolIndexable(row)).toBe(true);
    expect(toolCtaLabel(row)).toBe("Open Tool");
  });

  it("keeps noindex interactive tools out of sitemap and public ItemList schema", () => {
    const row = {
      page_url: "/tools/internal-planning-worksheet",
      route_status: "200",
      qa_status: "pass",
      content_status: "valid",
      indexing_status: "noindex_interactive",
    };

    expect(isToolVerifiedOpen(row)).toBe(true);
    expect(isToolSchemaEligible(row)).toBe(false);
    expect(isToolIndexable(row)).toBe(false);
  });

  it("adds the Supabase registry fields needed by the gate", () => {
    const sql = readFileSync("supabase/migrations/20260520210000_tool_registry_qa_gate.sql", "utf8");

    expect(sql).toContain("add column if not exists route_status integer");
    expect(sql).toContain("to_regclass('public.hc_tool_registry') is null");
    expect(sql).toContain("add column if not exists qa_status text not null default 'pending'");
    expect(sql).toContain("add column if not exists content_status text not null default 'pending'");
    expect(sql).toContain("add column if not exists indexing_status text not null default 'coming_soon'");
    expect(sql).toContain("add column if not exists coverage_verified boolean not null default false");
    expect(sql).toContain("conrelid = 'public.hc_tool_registry'::regclass");
    expect(sql).toContain("qa_status in ('pending','pass','fail','manual_review','blocked')");
    expect(sql).toContain("content_status in ('pending','valid','placeholder','wrong_intent','thin','broken','blocked')");
    expect(sql).toContain("idx_hc_tool_registry_qa_open_gate");
  });

  it("keeps the public hub from using page_url as the Open Tool proof", () => {
    const page = readFileSync("app/(public)/tools/page.tsx", "utf8");

    expect(page).toContain("isToolVerifiedOpen(tool)");
    expect(page).toContain("data-tool-card=\"true\"");
    expect(page).toContain("data-tool-cta=\"open\"");
    expect(page).toContain("Registered Concepts");
    expect(page).not.toContain("{tool.page_url ? (");
    expect(page).not.toContain("Available & Beta");
    expect(page).not.toContain("live globally");

    const sitemap = readFileSync("app/sitemap.xml/route.ts", "utf8");
    expect(sitemap).toContain("!String(p.url_path || '').startsWith('/tools/')");
  });

  it("ships a crawler audit script that writes the required repair ledgers", () => {
    const script = readFileSync("scripts/audit-tools.mjs", "utf8");
    const workflow = readFileSync(".github/workflows/tools-qa-gate.yml", "utf8");
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));

    expect(pkg.scripts["audit:tools"]).toBe("node scripts/audit-tools.mjs");
    expect(script).toContain("tools-click-audit.json");
    expect(script).toContain("tools-click-audit.csv");
    expect(script).toContain("tools-click-audit.md");
    expect(script).toContain("tools-sitemap-candidates.csv");
    expect(script).toContain("tools-noindex-candidates.csv");
    expect(script).toContain("tools-merge-retire-candidates.csv");
    expect(script).toContain("tools-follow-on-links.csv");
    expect(script).toContain("BLOCKED_NOT_OPEN");
    expect(script).toContain("collectToolCards");
    expect(script).toContain("legacy-link");
    expect(script).toContain("numberArg");
    expect(script).toContain('numberArg("offset"');
    expect(script).toContain("No cards selected for offset=");
    expect(script).toContain("isSuspiciousFollowOnRedirect");
    expect(script).toContain("hasIntentMismatch");
    expect(script).toContain("FAIL_WRONG_INTENT");
    expect(script).toContain("unexpected_redirect");
    expect(script).toContain("FAIL_FOLLOW_ON_LINKS");
    expect(workflow).toContain("npm run build");
    expect(workflow).toContain("npm run audit:tools -- --base-url=http://127.0.0.1:3005");
  });

  it("keeps a local auditable fallback registry without opening unverified tools", () => {
    expect(STATIC_TOOL_CONCEPTS.length).toBeGreaterThan(30);
    expect(STATIC_TOOL_CONCEPTS.some((tool) => tool.slug === "cb-radio-channel-guide")).toBe(true);
    expect(STATIC_TOOL_CONCEPTS.some((tool) => tool.slug === "escort-requirement-checker")).toBe(true);
    expect(STATIC_TOOL_CONCEPTS.some((tool) => tool.slug === "escort-count-calculator")).toBe(true);
    expect(STATIC_TOOL_CONCEPTS.every((tool) => tool.status === "coming_soon")).toBe(true);
    expect(STATIC_TOOL_CONCEPTS.every((tool) => isToolVerifiedOpen(tool) === false)).toBe(true);
  });

  it("noindexes confirmed placeholder tool pages", () => {
    const placeholderPages = [
      "app/(public)/tools/compliance-sentinel/page.tsx",
      "app/(public)/tools/bridge-weight/page.tsx",
      "app/(public)/tools/crc-recorder/page.tsx",
      "app/(public)/tools/railroad-profiler/page.tsx",
      "app/(public)/tools/terminology/page.tsx",
      "app/(public)/tools/cost-calculator/page.tsx",
    ];

    for (const file of placeholderPages) {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("robots: { index: false, follow: false }");
    }
  });
});
