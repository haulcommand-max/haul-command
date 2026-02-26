import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Jurisdiction Rules Linker
 * ---------------------------------------------------------------------
 * Ingests a pool of rule links, normalizes them, and assigns them to
 * exactamente ONE jurisdiction source bundle (or universal fallback).
 * 
 * Heuristics:
 * - Prefer explicit state/province abbreviations in URL or title.
 * - Prefer official domains (*.gov, state DOT, legislation).
 * - Ambiguous links get mapped to US_UNIVERSAL / CA_UNIVERSAL and
 *   flagged for human review.
 */

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "YOUR_SUPABASE_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

// Interfaces
interface RawRuleLink {
    url: string;
    title: string;
    publisher: string;
}

interface Jurisdiction {
    id: string;
    code: string;
    country: string;
    jurisdiction_type: string;
}

// Dummy pool of links (In a real system, this would be read from a file or DB)
export const RAW_LINKS_POOL: RawRuleLink[] = [
    { url: "https://www.fdot.gov/traffic/oversize-overweight", title: "FDOT Oversize/Overweight Rules", publisher: "Florida DOT" },
    { url: "https://www.txdmv.gov/motor-carriers", title: "Texas DMV Permit Rules", publisher: "TxDMV" },
    { url: "https://www.ontario.ca/page/oversize-overweight-permits", title: "Ontario MTO Rules", publisher: "Ministry of Transportation" },
    { url: "https://www.widenloadshipping.com/state-rules", title: "Escort Requirements by State", publisher: "WidenLoad Broker" },
    { url: "https://dot.ca.gov/programs/traffic-operations/transportation-permits", title: "Caltrans Transportation Permits", publisher: "California DOT" }
];

// Helper: Determine reliability tier based on URL & Publisher
function determineReliability(link: RawRuleLink): "primary" | "secondary" | "community" {
    const url = link.url.toLowerCase();
    const pub = link.publisher.toLowerCase();

    if (
        url.includes(".gov") || url.includes(".ca/") || url.includes("dot.") ||
        pub.includes("dot") || pub.includes("ministry") || pub.includes("dmv")
    ) {
        return "primary";
    }

    if (pub.includes("guide") || pub.includes("broker") || url.includes("oversize.io")) {
        return "secondary";
    }

    return "community";
}

// Helper: Map link to a jurisdiction code based on heuristics
function mapLinkToJurisdiction(link: RawRuleLink, jurisdictions: Jurisdiction[]): string {
    const searchString = `${link.url} ${link.title} ${link.publisher}`.toLowerCase();

    // Specific explicit heuristics
    if (searchString.includes("fdot") || searchString.includes("florida")) return "FL";
    if (searchString.includes("txdmv") || searchString.includes("texas")) return "TX";
    if (searchString.includes("caltrans") || searchString.includes("california")) return "CA"; // Careful with Canada
    if (searchString.includes("ontario") || searchString.includes("mto")) return "ON";

    // Loop all to see if we hit a name
    for (const jur of jurisdictions) {
        if (jur.jurisdiction_type === "UNIVERSAL") continue;
        if (searchString.includes(jur.name.toLowerCase())) {
            return jur.code;
        }
    }

    // Fallbacks based on TLD or hints
    if (searchString.includes(".ca") || searchString.includes("canada")) return "CA_UNIVERSAL";
    return "US_UNIVERSAL";
}

async function generateStableCitationKey(url: string, jurisdictionCode: string): Promise<string> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(url));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return `${jurisdictionCode}_${hashHex.substring(0, 8).toUpperCase()}`;
}

export async function runLinkNormalizationJob() {
    console.log("Starting Jurisdiction Rules Linker Job...");

    // 1. Fetch all jurisdictions
    const { data: jurisdictions, error: jurErr } = await supabase
        .from("jurisdictions")
        .select("id, code, country, jurisdiction_type")
        .eq("is_active", true);

    if (jurErr || !jurisdictions) {
        console.error("Failed to fetch jurisdictions:", jurErr);
        return;
    }

    // 2. Process each raw link
    for (const link of RAW_LINKS_POOL) {
        const mappedCode = mapLinkToJurisdiction(link, jurisdictions);
        const reliability = determineReliability(link);
        const citationKey = await generateStableCitationKey(link.url, mappedCode);

        // 3. Check if target ruleset for this jurisdiction exists, if not, create staged
        let { data: rulesets } = await supabase
            .from("escort_rulesets")
            .select("id, source_bundle_id")
            .eq("jurisdiction_code", mappedCode)
            .limit(1);

        let sourceBundleId: string;

        if (!rulesets || rulesets.length === 0) {
            // Create a fake UUID for the bundle
            sourceBundleId = crypto.randomUUID();
            const { error: rulesetErr } = await supabase
                .from("escort_rulesets")
                .insert([{
                    jurisdiction_code: mappedCode,
                    version: "1.0.0",
                    status: "staged",
                    source_bundle_id: sourceBundleId,
                    notes: "Auto-generated from linker job"
                }]);

            if (rulesetErr) {
                console.error(`Failed to stage ruleset for ${mappedCode}:`, rulesetErr);
                continue;
            }
        } else {
            sourceBundleId = rulesets[0].source_bundle_id;
        }

        // 4. Insert into escort_rule_sources
        const { error: srcErr } = await supabase
            .from("escort_rule_sources")
            .upsert({
                source_bundle_id: sourceBundleId,
                title: link.title,
                url: link.url,
                publisher: link.publisher,
                retrieved_at: new Date().toISOString(),
                reliability_tier: reliability,
                citation_key: citationKey
            }, { onConflict: "citation_key" });

        if (srcErr) {
            console.error(`Error inserting source ${citationKey}:`, srcErr);
        } else {
            console.log(`[+] Mapped ${link.url} -> ${mappedCode} [${reliability.toUpperCase()}] (${citationKey})`);
        }
    }

    console.log("Jurisdiction Rules Linker Job Complete.");
}

// To run directly: if (import.meta.main) runLinkNormalizationJob();
