/**
 * HAUL COMMAND — OSM INGESTION RUNNER
 *
 * Run this from project root:
 *   npx tsx src/lib/ingestion/run-osm-ingestion.ts
 *
 * Or target specific countries/categories:
 *   COUNTRY=US CATEGORIES=port,truck_stop npx tsx src/lib/ingestion/run-osm-ingestion.ts
 *
 * Requires:
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { runCountryIngestion, type RunParams } from "./osm-ingestion-worker";

// ─────────────────────────────────────────────────────────────────────
// DEFAULT RUN PLAN: Seed 3 countries × key categories
// ─────────────────────────────────────────────────────────────────────

type CategoryKey = RunParams["category_key"];

const DEFAULT_PLAN: { country: string; categories: CategoryKey[] }[] = [
    {
        country: "US",
        categories: ["port", "truck_stop", "truck_parking", "weigh_station", "rest_area"],
    },
    {
        country: "CA",
        categories: ["port", "truck_stop", "truck_parking"],
    },
    {
        country: "AU",
        categories: ["port", "truck_stop", "industrial_zone"],
    },
];

async function main() {
    const targetCountry = process.env.COUNTRY?.toUpperCase();
    const targetCategories = process.env.CATEGORIES?.split(",").map((c) => c.trim()) as
        | CategoryKey[]
        | undefined;

    const plan = targetCountry
        ? [
            {
                country: targetCountry,
                categories: targetCategories ?? ["port", "truck_stop"],
            },
        ]
        : DEFAULT_PLAN;

    console.log("═══════════════════════════════════════════════════════");
    console.log("  HAUL COMMAND — OSM INGESTION");
    console.log(`  Plan: ${plan.map((p) => `${p.country}(${p.categories.join(",")})`).join(" | ")}`);
    console.log("═══════════════════════════════════════════════════════\n");

    const allResults = [];

    for (const { country, categories } of plan) {
        console.log(`\n▶ Starting ${country} — ${categories.length} categories\n`);
        const results = await runCountryIngestion(country, categories);
        allResults.push(...results);
    }

    // Summary
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  INGESTION SUMMARY");
    console.log("═══════════════════════════════════════════════════════");

    let totalPlaces = 0;
    let totalPublished = 0;

    for (const r of allResults) {
        const icon = r.status === "success" ? "✅" : "❌";
        console.log(
            `  ${icon} ${r.run_key}: ${r.status}` +
            (r.status === "success"
                ? ` — upserted=${(r as any).total_upserted} published=${(r as any).published}`
                : ` — ${(r as any).error}`)
        );
        if (r.status === "success") {
            totalPlaces += (r as any).total_upserted ?? 0;
            totalPublished += (r as any).published ?? 0;
        }
    }

    console.log(`\n  TOTAL: ${totalPlaces} places upserted, ${totalPublished} published`);
    console.log("═══════════════════════════════════════════════════════\n");
}

main().catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
});
