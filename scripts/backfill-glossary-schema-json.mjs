#!/usr/bin/env node
import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";

export function buildDefinedTermSchema(row) {
  const slug = row.slug || row.term_slug;
  const name = row.canonical_term || row.term || row.name || slug;
  const description = row.short_definition || row.plain_english || row.definition || `Heavy-haul definition for ${name}.`;
  const url = `https://www.haulcommand.com/glossary/${slug}`;
  const aliases = Array.isArray(row.aliases) ? row.aliases : [];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DefinedTerm",
        "@id": url,
        name,
        description,
        url,
        termCode: slug,
        alternateName: aliases,
        inDefinedTermSet: {
          "@type": "DefinedTermSet",
          name: "Haul Command Heavy Haul Glossary",
          url: "https://www.haulcommand.com/glossary",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.haulcommand.com" },
          { "@type": "ListItem", position: 2, name: "Glossary", item: "https://www.haulcommand.com/glossary" },
          { "@type": "ListItem", position: 3, name, item: url },
        ],
      },
    ],
  };
}

export function buildWhyItMatters(row) {
  const name = row.canonical_term || row.term || row.name || "this term";
  if (row.why_it_matters && String(row.why_it_matters).trim().length > 40) {
    return row.why_it_matters;
  }
  return `${name} matters because heavy-haul teams use the term to align routing, permits, escorts, equipment, insurance, and compliance decisions before a load moves.`;
}

function parseArgs(argv) {
  const valueAfter = (flag, fallback = null) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : fallback);
  return {
    dryRun: argv.includes("--dry-run") || !argv.includes("--apply"),
    limit: Number(valueAfter("--limit", "50")),
    targetTable: valueAfter("--target-table", "glossary_terms"),
    queueView: valueAfter("--queue-view", "v_glossary_enrichment_queue"),
  };
}

async function loadEnv() {
  try {
    const dotenv = await import("dotenv");
    dotenv.config({ path: ".env.local" });
    dotenv.config();
  } catch {
    // dotenv is optional for tests/imports.
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadEnv();

  const { Client } = await import("pg");
  const connectionString =
    process.env.SUPABASE_DB_POOLER_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("Missing SUPABASE_DB_POOLER_URL, SUPABASE_DATABASE_URL, or DATABASE_URL.");
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const { rows } = await client.query(
    `select * from public.${args.queueView} limit $1`,
    [Number.isFinite(args.limit) && args.limit > 0 ? args.limit : 50],
  );

  let updated = 0;
  for (const row of rows) {
    const slug = row.slug || row.term_slug;
    if (!slug) continue;

    const schema = buildDefinedTermSchema(row);
    const why = buildWhyItMatters(row);

    if (!args.dryRun) {
      await client.query(
        `update public.${args.targetTable}
           set schema_json = coalesce(nullif(schema_json, '{}'::jsonb), $1::jsonb),
               why_it_matters = coalesce(nullif(why_it_matters, ''), $2),
               enriched_at = coalesce(enriched_at, now())
         where slug = $3`,
        [JSON.stringify(schema), why, slug],
      );
    }
    updated += 1;
  }

  await client.end();
  console.log(JSON.stringify({ ok: true, dryRun: args.dryRun, scanned: rows.length, prepared: updated }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
