#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const DEFAULT_BASE_URL = process.env.TOOLS_AUDIT_BASE_URL || "http://127.0.0.1:3000";
const DEFAULT_PAGE_TIMEOUT_MS = 12000;
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

function boolArg(name, fallback) {
  const value = argValue(name, String(fallback));
  return !["0", "false", "no"].includes(String(value).toLowerCase());
}

function numberArg(name, fallback, { allowInfinity = false, min = 0 } = {}) {
  const raw = argValue(name, fallback);
  if (allowInfinity && raw === "") return Infinity;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min) {
    throw new Error(`Invalid --${name} value: ${raw}`);
  }
  return value;
}

function buildSummary({ baseUrl, totalCards, offset, limit, records, consoleMessages, partial }) {
  return {
    baseUrl,
    auditedAt: new Date().toISOString(),
    totalCards,
    offset,
    limit: Number.isFinite(limit) ? limit : null,
    auditedCards: records.length,
    openToolLinks: records.filter((r) => r.href).length,
    pass: records.filter((r) => r.classification.includes("PASS")).length,
    fail: records.filter((r) => r.classification.some((c) => c.startsWith("FAIL"))).length,
    blockedNotOpen: records.filter((r) => r.classification.includes("BLOCKED_NOT_OPEN")).length,
    followOnLinksChecked: records.reduce((sum, r) => sum + r.followOnLinks.length, 0),
    followOnLinkFailures: records.reduce((sum, r) => sum + r.followOnLinkFailures.length, 0),
    partial,
    hubConsoleMessages: consoleMessages,
  };
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

async function writeArtifacts(outDir, summary, records, json) {
  await writeFile(path.join(outDir, "tools-click-audit.json"), JSON.stringify(json, null, 2));

  const csvHeader = [
    "family","title","slug","extractionMode","registryStatus","statusBadge","href","ctaLabel","httpStatus","finalUrl","h1","canonical","robots","schemaTypes","classification","followOnLinkFailures","screenshot",
  ];
  const csvRows = records.map((r) => csvHeader.map((key) => csvEscape(Array.isArray(r[key]) ? r[key].join("|") : r[key])).join(","));
  await writeFile(path.join(outDir, "tools-click-audit.csv"), [csvHeader.join(","), ...csvRows].join("\n"));

  const lines = [
    "# Tools Click Audit",
    "",
    `- Base URL: ${summary.baseUrl}`,
    `- Audited at: ${summary.auditedAt}`,
    `- Cards found: ${summary.totalCards}`,
    `- Offset: ${summary.offset}`,
    `- Limit: ${summary.limit ?? "all"}`,
    `- Cards audited: ${summary.auditedCards}`,
    `- Open Tool links: ${summary.openToolLinks}`,
    `- PASS: ${summary.pass}`,
    `- FAIL: ${summary.fail}`,
    `- Blocked / not open: ${summary.blockedNotOpen}`,
    `- Follow-on links checked: ${summary.followOnLinksChecked}`,
    `- Follow-on link failures: ${summary.followOnLinkFailures}`,
    `- Partial run: ${summary.partial ? "yes" : "no"}`,
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

  const followOnRows = records.flatMap((r) =>
    r.followOnLinks.map((link) => {
      const result = r.followOnLinkResults.find((item) => item.href === link.href);
      const failure = r.followOnLinkFailures.find((item) => item.href === link.href);
      return [
        r.slug,
        r.title,
        r.href,
        link.text,
        link.href,
        result?.status ?? failure?.status ?? "",
        result?.finalUrl ?? "",
        failure ? "FAIL" : "PASS",
      ].map(csvEscape).join(",");
    })
  );
  await writeFile(
    path.join(outDir, "tools-follow-on-links.csv"),
    ["tool_slug,tool_title,tool_href,link_text,link_href,status,final_url,result", ...followOnRows].join("\n")
  );
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
  if (record.href && record.intentMismatch) failures.push("FAIL_WRONG_INTENT");
  if (record.href && record.h1Count !== 1) failures.push("FAIL_H1");
  if (record.href && record.placeholderText.length) failures.push("FAIL_PLACEHOLDER");
  if (record.href && record.mojibake) failures.push("FAIL_ENCODING");
  if (record.href && !record.canonical) failures.push("FAIL_NO_CANONICAL");
  if (record.href && record.schemaTypes.length === 0) failures.push("FAIL_NO_SCHEMA");
  if (record.href && !record.hasInteractiveSurface) failures.push("FAIL_STATIC_NOT_TOOL");
  if (record.href && record.internalLinkFailures.length) failures.push("FAIL_INTERNAL_LINKS");
  if (record.href && record.followOnLinkFailures.length) failures.push("FAIL_FOLLOW_ON_LINKS");
  return failures.length ? failures : ["PASS"];
}

function wordsFromText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word.length >= 4 && !["tool", "tools", "haul", "command"].includes(word));
}

function hasIntentMismatch(record) {
  if (!record.href || !record.title) return false;
  const slug = record.slug || record.href.split("/").filter(Boolean).pop() || "";
  const titleWords = wordsFromText(record.title);
  const slugWords = wordsFromText(slug.replace(/-/g, " "));
  if (titleWords.length === 0 || slugWords.length === 0) return false;

  const slugSet = new Set(slugWords);
  const overlap = titleWords.filter((word) => slugSet.has(word)).length;
  const obviousMismatch =
    /requirement|requirements/i.test(record.title) &&
    /calculator|quote|cost|rate/i.test(slug) &&
    !/requirement|requirements/i.test(slug);

  return obviousMismatch || overlap === 0;
}

function isSuspiciousFollowOnRedirect(originalHref, finalUrl, baseUrl) {
  if (!finalUrl) return false;
  const original = new URL(originalHref, baseUrl);
  const final = new URL(finalUrl, baseUrl);
  const originalPath = original.pathname.replace(/\/$/, "") || "/";
  const finalPath = final.pathname.replace(/\/$/, "") || "/";
  if (final.origin !== original.origin) return true;
  if (finalPath === originalPath) return false;
  return ["/", "/login", "/auth/login", "/auth/register", "/not-found"].includes(finalPath);
}

async function collectToolCards(page) {
  const gatedCards = await page.$$eval("[data-tool-card='true']", (nodes) =>
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
        extractionMode: "gated",
      };
    })
  );

  const legacyCards = await page.$$eval("a[href]", (links) => {
    function slugFromHref(href) {
      const match = href.match(/\/tools\/([^/?#]+)/);
      return match ? match[1] : "";
    }

    function findCard(link) {
      let node = link.parentElement;
      for (let depth = 0; node && depth < 8; depth += 1, node = node.parentElement) {
        if (node.querySelector("h3,h2") && node.innerText.includes(link.innerText.trim())) return node;
      }
      return link.parentElement || link;
    }

    const seen = new Set();
    return links
      .filter((link) => /open tool/i.test(link.textContent || ""))
      .map((link) => {
        const rawHref = link.getAttribute("href") || "";
        const href = rawHref.replace(/^https?:\/\/[^/]+/i, "");
        if (!/^\/tools\/[^?#/]+\/?$/.test(href)) return null;
        const key = href;
        if (seen.has(key)) return null;
        seen.add(key);

        const card = findCard(link);
        const titleNode = card.querySelector("h3,h2");
        const textParts = (card.innerText || "")
          .split("\n")
          .map((part) => part.trim())
          .filter(Boolean);
        const title = titleNode?.textContent?.trim() || textParts.find((part) => !/available|open tool|market coverage/i.test(part)) || slugFromHref(href);
        const description = textParts.find((part) => part !== title && !/available|open tool|market coverage/i.test(part)) || "";
        const statusBadge = textParts.find((part) => /available|beta|coming soon|development/i.test(part)) || "";

        return {
          slug: slugFromHref(href),
          family: "",
          registryStatus: "",
          routeStatus: "",
          qaStatus: "",
          contentStatus: "",
          indexingStatus: "",
          title,
          description,
          statusBadge,
          href,
          ctaLabel: link.textContent?.trim() || "Open Tool",
          extractionMode: "legacy-link",
        };
      })
      .filter(Boolean);
  });

  const merged = [...gatedCards];
  const seen = new Set(merged.map((card) => card.href || card.slug).filter(Boolean));
  for (const card of legacyCards) {
    const key = card.href || card.slug;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    merged.push(card);
  }
  return merged;
}

async function main() {
  const baseUrl = argValue("base-url", DEFAULT_BASE_URL).replace(/\/$/, "");
  const outDir = path.resolve(argValue("out-dir", "artifacts"));
  const offset = numberArg("offset", "0", { min: 0 });
  const limit = numberArg("limit", "", { allowInfinity: true, min: 1 });
  const followOnLimit = numberArg("follow-on-limit", "25", { min: 0 });
  const internalLinkLimit = numberArg("internal-link-limit", "10", { min: 0 });
  const pageTimeoutMs = numberArg("page-timeout-ms", String(DEFAULT_PAGE_TIMEOUT_MS), { min: 1000 });
  const captureScreenshots = boolArg("capture-screenshots", true);
  const failOnErrors = boolArg("fail-on-errors", true);

  await mkdir(outDir, { recursive: true });
  await mkdir(path.join(outDir, "tools-audit-screenshots"), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  page.setDefaultTimeout(pageTimeoutMs);
  page.setDefaultNavigationTimeout(pageTimeoutMs);
  await page.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (["image", "media", "font"].includes(type)) return route.abort();
    return route.continue();
  }).catch(() => {});
  const consoleMessages = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    }
  });

  const hubResponse = await page.goto(`${baseUrl}/tools`, { waitUntil: "domcontentloaded", timeout: pageTimeoutMs });
  if (!hubResponse || !hubResponse.ok()) {
    throw new Error(`/tools failed: ${hubResponse?.status() ?? "no response"}`);
  }

  const cards = await collectToolCards(page);

  if (cards.length === 0) {
    throw new Error("No tool cards found on /tools. The registry query may be empty or the hub failed to render cards.");
  }

  const records = [];
  const selectedCards = cards.slice(offset, Number.isFinite(limit) ? offset + limit : undefined);
  if (selectedCards.length === 0) {
    throw new Error(`No cards selected for offset=${offset} limit=${Number.isFinite(limit) ? limit : "all"} totalCards=${cards.length}`);
  }
  for (const card of selectedCards) {
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
      intentMismatch: false,
      visibleToolModule: false,
      inputCount: 0,
      outputHintCount: 0,
      hasInteractiveSurface: false,
      internalLinks: [],
      internalLinkFailures: [],
      followOnLinks: [],
      followOnLinkResults: [],
      followOnLinkFailures: [],
      ctaLinks: [],
      consoleErrors: [],
      screenshot: "",
      classification: [],
    };

    if (card.href) {
      const targetUrl = new URL(card.href, baseUrl).toString();
      const toolPage = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
      toolPage.setDefaultTimeout(pageTimeoutMs);
      toolPage.setDefaultNavigationTimeout(pageTimeoutMs);
      await toolPage.route("**/*", (route) => {
        const type = route.request().resourceType();
        if (["image", "media", "font"].includes(type)) return route.abort();
        return route.continue();
      }).catch(() => {});
      const pageConsole = [];
      toolPage.on("console", (msg) => {
        if (["error", "warning"].includes(msg.type())) pageConsole.push({ type: msg.type(), text: msg.text() });
      });

      const response = await toolPage.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: pageTimeoutMs }).catch((error) => {
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
      record.mojibake = MOJIBAKE_PATTERN.test(`${record.title} ${record.description} ${record.h1} ${bodyText}`);
      record.intentMismatch = hasIntentMismatch(record);
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
          .slice(0, Number.POSITIVE_INFINITY))]
      ).catch(() => []);
      record.internalLinks = internalLinks.slice(0, internalLinkLimit);

      for (const href of record.internalLinks) {
        const linkResponse = await toolPage.request.get(new URL(href, baseUrl).toString()).catch(() => null);
        if (!linkResponse || linkResponse.status() >= 400) {
          record.internalLinkFailures.push({ href, status: linkResponse?.status() ?? null });
        }
      }

      const followOnLinks = await toolPage.$$eval("a[href]", (links) =>
        links
          .map((link) => ({ text: link.textContent?.trim() || "", href: link.getAttribute("href") || "" }))
          .filter((link) =>
            link.href.startsWith("/") &&
            !link.href.startsWith("//") &&
            !/^\/tools\/[^?#/]+\/?$/.test(link.href) &&
            /claim|post|find|request|quote|contact|training|directory|load|regulation|glossary|profile|calculator|checker|requirements/i.test(`${link.text} ${link.href}`)
          )
          .slice(0, Number.POSITIVE_INFINITY)
      ).catch(() => []);
      record.followOnLinks = followOnLinks.slice(0, followOnLimit);

      for (const link of record.followOnLinks) {
        const linkResponse = await toolPage.request.get(new URL(link.href, baseUrl).toString()).catch(() => null);
        const finalUrl = linkResponse?.url() ?? "";
        const status = linkResponse?.status() ?? null;
        const suspiciousRedirect = linkResponse ? isSuspiciousFollowOnRedirect(link.href, finalUrl, baseUrl) : false;
        record.followOnLinkResults.push({
          text: link.text,
          href: link.href,
          status,
          finalUrl,
          redirected: suspiciousRedirect,
        });
        if (!linkResponse || status >= 400 || suspiciousRedirect) {
          record.followOnLinkFailures.push({
            text: link.text,
            href: link.href,
            status,
            finalUrl,
            reason: suspiciousRedirect ? "unexpected_redirect" : "http_error",
          });
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

      if (captureScreenshots && (record.httpStatus !== 200 || record.placeholderText.length || record.mojibake)) {
        const shot = path.join(outDir, "tools-audit-screenshots", `${card.slug || "tool"}.png`);
        await toolPage.screenshot({ path: shot, fullPage: false }).catch(() => {});
        record.screenshot = shot;
      }

      await toolPage.close();
    }

    record.classification = classify(record);
    records.push(record);

    const partialSummary = buildSummary({
      baseUrl,
      totalCards: cards.length,
      offset,
      limit,
      records,
      consoleMessages,
      partial: true,
    });
    await writeArtifacts(outDir, partialSummary, records, { summary: partialSummary, records });
  }

  await browser.close();

  const summary = buildSummary({
    baseUrl,
    totalCards: cards.length,
    offset,
    limit,
    records,
    consoleMessages,
    partial: false,
  });

  const json = { summary, records };
  await writeArtifacts(outDir, summary, records, json);

  if (failOnErrors && summary.fail > 0) {
    console.error(`tools audit failed: ${summary.fail}/${summary.auditedCards} cards need repair`);
    process.exit(1);
  }

  console.log(`tools audit passed: ${summary.pass}/${summary.auditedCards}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
