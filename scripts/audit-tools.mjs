#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const DEFAULT_BASE_URL = process.env.TOOLS_AUDIT_BASE_URL || "http://127.0.0.1:3000";
const PLACEHOLDER_PATTERNS = [
  /Route not provided/i,
  /Page does not exist/i,
  /Not Found/i,
  /currently in development/i,
  /provisioned/i,
  /coming soon/i,
];
const MOJIBAKE_PATTERN = /ð|â‡|â€™|â€œ|â€�|ï¿½/;

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function schemaTypes(raw) {
  const values = Array.isArray(raw) ? raw : [raw];
  const types = new Set();
  for (const item of values) {
    if (!item || typeof item !== "object") continue;
    const type = item["@type"];
    if (Array.isArray(type)) type.forEach((t) => types.add(String(t)));
    else if (type) types.add(String(type));
    if (item.mainEntity) {
      for (const nested of schemaTypes(item.mainEntity)) types.add(nested);
    }
  }
  return [...types];
}

function classify(record) {
  const failures = [];
  if (!record.href) return ["BLOCKED_NOT_OPEN"];
  if (record.href && record.httpStatus !== 200) failures.push(record.httpStatus === 404 ? "FAIL_404" : "FAIL_HTTP");
  if (record.href && record.h1Count !== 1) failures.push("FAIL_H1");
  if (record.href && record.placeholderText.length) failures.push("FAIL_PLACEHOLDER");
  if (record.href && record.mojibake) failures.push("FAIL_ENCODING");
  if (record.href && !record.canonical) failures.push("FAIL_NO_CANONICAL");
  if (record.href && record.schemaTypes.length === 0) failures.push("FAIL_NO_SCHEMA");
  if (record.href && !record.hasInteractiveSurface) failures.push("FAIL_STATIC_NOT_TOOL");
  if (record.href && record.internalLinkFailures.length) failures.push("FAIL_INTERNAL_LINKS");
  return failures.length ? failures : ["PASS"];
}

async function main() {
  const baseUrl = argValue("base-url", DEFAULT_BASE_URL).replace(/\/$/, "");
  const outDir = path.resolve(argValue("out-dir", "artifacts"));
  const limitRaw = argValue("limit", "");
  const limit = limitRaw ? Number(limitRaw) : Infinity;

  await mkdir(outDir, { recursive: true });
  await mkdir(path.join(outDir, "tools-audit-screenshots"), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const consoleMessages = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    }
  });

  const hubResponse = await page.goto(`${baseUrl}/tools`, { waitUntil: "networkidle" });
  if (!hubResponse || !hubResponse.ok()) {
    throw new Error(`/tools failed: ${hubResponse?.status() ?? "no response"}`);
  }

  const cards = await page.$$eval("[data-tool-card='true']", (nodes) =>
    nodes.map((node) => {
      const open = node.querySelector("[data-tool-cta='open']");
      const blocked = node.querySelector("[data-tool-cta='blocked']");
      return {
        slug: node.getAttribute("data-tool-slug") || "",
        family: node.getAttribute("data-tool-family") || "",
        registryStatus: node.getAttribute("data-tool-status") || "",
        routeStatus: node.getAttribute("data-tool-route-status") || "",
        qaStatus: node.getAttribute("data-tool-qa-status") || "",
        contentStatus: node.getAttribute("data-tool-content-status") || "",
        indexingStatus: node.getAttribute("data-tool-indexing-status") || "",
        title: node.querySelector("h3")?.textContent?.trim() || "",
        description: node.querySelector("p")?.textContent?.trim() || "",
        statusBadge: node.querySelector("span")?.textContent?.trim() || "",
        href: open?.getAttribute("href") || "",
        ctaLabel: (open || blocked)?.textContent?.trim() || "",
      };
    })
  );

  if (cards.length === 0) {
    throw new Error("No tool cards found on /tools. The registry query may be empty or the hub failed to render cards.");
  }

  const records = [];
  for (const card of cards.slice(0, limit)) {
    const record = {
      ...card,
      httpStatus: null,
      finalUrl: "",
      pageTitle: "",
      h1: "",
      h1Count: 0,
      metaDescription: "",
      canonical: "",
      robots: "",
      schemaTypes: [],
      placeholderText: [],
      mojibake: false,
      visibleToolModule: false,
      inputCount: 0,
      outputHintCount: 0,
      hasInteractiveSurface: false,
      internalLinks: [],
      internalLinkFailures: [],
      ctaLinks: [],
      consoleErrors: [],
      screenshot: "",
      classification: [],
    };

    if (card.href) {
      const targetUrl = new URL(card.href, baseUrl).toString();
      const toolPage = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
      const pageConsole = [];
      toolPage.on("console", (msg) => {
        if (["error", "warning"].includes(msg.type())) pageConsole.push({ type: msg.type(), text: msg.text() });
      });

      const response = await toolPage.goto(targetUrl, { waitUntil: "networkidle" }).catch((error) => {
        pageConsole.push({ type: "error", text: error.message });
        return null;
      });

      record.httpStatus = response?.status() ?? null;
      record.finalUrl = toolPage.url();
      record.pageTitle = await toolPage.title().catch(() => "");
      record.h1Count = await toolPage.locator("h1").count().catch(() => 0);
      record.h1 = record.h1Count ? (await toolPage.locator("h1").first().innerText().catch(() => "")) : "";
      record.metaDescription = await toolPage.locator("meta[name='description']").getAttribute("content").catch(() => "") || "";
      record.canonical = await toolPage.locator("link[rel='canonical']").getAttribute("href").catch(() => "") || "";
      record.robots = await toolPage.locator("meta[name='robots']").getAttribute("content").catch(() => "") || "";
      const bodyText = await toolPage.locator("body").innerText().catch(() => "");
      record.placeholderText = PLACEHOLDER_PATTERNS.filter((pattern) => pattern.test(bodyText)).map((pattern) => pattern.source);
      record.mojibake = MOJIBAKE_PATTERN.test(bodyText);
      record.inputCount = await toolPage.locator("input, select, textarea, button").count().catch(() => 0);
      record.outputHintCount = await toolPage.locator("text=/result|estimate|output|checklist|recommendation|requirement|summary/i").count().catch(() => 0);
      record.visibleToolModule = record.inputCount > 0 && record.outputHintCount > 0;
      record.hasInteractiveSurface = record.visibleToolModule || /calculator|checker|estimator|worksheet|guide|checklist/i.test(bodyText);
      record.ctaLinks = await toolPage.$$eval("a[href]", (links) =>
        links
          .map((link) => ({ text: link.textContent?.trim() || "", href: link.getAttribute("href") || "" }))
          .filter((link) => /claim|post|find|request|quote|contact|training|directory|load/i.test(link.text))
          .slice(0, 20)
      ).catch(() => []);

      const internalLinks = await toolPage.$$eval("a[href]", (links) =>
        [...new Set(links
          .map((link) => link.getAttribute("href") || "")
          .filter((href) => href.startsWith("/") && !href.startsWith("//"))
          .slice(0, 25))]
      ).catch(() => []);
      record.internalLinks = internalLinks;

      for (const href of internalLinks) {
        const linkResponse = await toolPage.request.get(new URL(href, baseUrl).toString()).catch(() => null);
        if (!linkResponse || linkResponse.status() >= 400) {
          record.internalLinkFailures.push({ href, status: linkResponse?.status() ?? null });
        }
      }

      const schemaRaw = await toolPage.$$eval("script[type='application/ld+json']", (scripts) =>
        scripts.map((script) => script.textContent || "")
      ).catch(() => []);
      for (const raw of schemaRaw) {
        try {
          for (const type of schemaTypes(JSON.parse(raw))) record.schemaTypes.push(type);
        } catch {
          record.schemaTypes.push("INVALID_JSON_LD");
        }
      }
      record.schemaTypes = [...new Set(record.schemaTypes)];
      record.consoleErrors = pageConsole;

      if (record.httpStatus !== 200 || record.placeholderText.length || record.mojibake) {
        const shot = path.join(outDir, "tools-audit-screenshots", `${card.slug || "tool"}.png`);
        await toolPage.screenshot({ path: shot, fullPage: false }).catch(() => {});
        record.screenshot = shot;
      }

      await toolPage.close();
    }

    record.classification = classify(record);
    records.push(record);
  }

  await browser.close();

  const summary = {
    baseUrl,
    auditedAt: new Date().toISOString(),
    totalCards: cards.length,
    auditedCards: records.length,
    openToolLinks: records.filter((r) => r.href).length,
    pass: records.filter((r) => r.classification.includes("PASS")).length,
    fail: records.filter((r) => r.classification.some((c) => c.startsWith("FAIL"))).length,
    blockedNotOpen: records.filter((r) => r.classification.includes("BLOCKED_NOT_OPEN")).length,
    hubConsoleMessages: consoleMessages,
  };

  const json = { summary, records };
  await writeFile(path.join(outDir, "tools-click-audit.json"), JSON.stringify(json, null, 2));

  const csvHeader = [
    "family","title","slug","registryStatus","statusBadge","href","ctaLabel","httpStatus","finalUrl","h1","canonical","robots","schemaTypes","classification","screenshot",
  ];
  const csvRows = records.map((r) => csvHeader.map((key) => csvEscape(Array.isArray(r[key]) ? r[key].join("|") : r[key])).join(","));
  await writeFile(path.join(outDir, "tools-click-audit.csv"), [csvHeader.join(","), ...csvRows].join("\n"));

  const lines = [
    "# Tools Click Audit",
    "",
    `- Base URL: ${baseUrl}`,
    `- Audited at: ${summary.auditedAt}`,
    `- Cards found: ${summary.totalCards}`,
    `- Cards audited: ${summary.auditedCards}`,
    `- Open Tool links: ${summary.openToolLinks}`,
    `- PASS: ${summary.pass}`,
    `- FAIL: ${summary.fail}`,
    `- Blocked / not open: ${summary.blockedNotOpen}`,
    "",
    "## Failures",
    "",
    ...records
      .filter((r) => r.classification.some((c) => c.startsWith("FAIL")))
      .map((r) => `- ${r.title || r.slug}: ${r.classification.join(", ")} (${r.href || "no open href"})`),
    "",
    "## Passed",
    "",
    ...records
      .filter((r) => r.classification.includes("PASS"))
      .map((r) => `- ${r.title || r.slug}: ${r.finalUrl}`),
  ];
  await writeFile(path.join(outDir, "tools-click-audit.md"), lines.join("\n"));

  const sitemapCandidates = records
    .filter((r) => r.classification.includes("PASS") && !/noindex/i.test(r.robots))
    .map((r) => [r.slug, r.href, r.canonical || r.finalUrl].map(csvEscape).join(","));
  await writeFile(path.join(outDir, "tools-sitemap-candidates.csv"), ["slug,href,canonical", ...sitemapCandidates].join("\n"));

  const noindexCandidates = records
    .filter((r) => !r.classification.includes("PASS") || /noindex/i.test(r.robots))
    .map((r) => [r.slug, r.href, r.classification.join("|")].map(csvEscape).join(","));
  await writeFile(path.join(outDir, "tools-noindex-candidates.csv"), ["slug,href,reason", ...noindexCandidates].join("\n"));

  const mergeRetireCandidates = records
    .filter((r) => r.classification.some((c) => ["FAIL_WRONG_INTENT", "FAIL_STATIC_NOT_TOOL", "FAIL_404", "BLOCKED_NOT_OPEN"].includes(c)))
    .map((r) => [r.slug, r.href, r.classification.join("|")].map(csvEscape).join(","));
  await writeFile(path.join(outDir, "tools-merge-retire-candidates.csv"), ["slug,href,reason", ...mergeRetireCandidates].join("\n"));

  if (summary.fail > 0) {
    console.error(`tools audit failed: ${summary.fail}/${summary.auditedCards} cards need repair`);
    process.exit(1);
  }

  console.log(`tools audit passed: ${summary.pass}/${summary.auditedCards}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
