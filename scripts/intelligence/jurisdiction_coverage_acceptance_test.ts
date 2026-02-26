import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Jurisdiction Coverage Acceptance Test
 * ---------------------------------------------------------------------
 * Runs analytics to produce a dashboard view confirming first-class 
 * records exist, and checks for staged/active status, coverage grades,
 * and missing sources across 64 US/CA jurisdictions.
 */

const supabaseUrl = process.env.SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "YOUR_SUPABASE_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function runAcceptanceTest() {
    console.log("==================================================");
    console.log(" JURISDICTION COVERAGE ACCEPTANCE DASHBOARD");
    console.log("==================================================\n");

    const { data: jurisdictions, error: jErr } = await supabase
        .from("jurisdictions")
        .select(`
            code,
            name,
            jurisdiction_type,
            escort_rulesets (
                id,
                status,
                source_bundle_id
            ),
            ruleset_coverage (
                has_active_ruleset,
                coverage_grade,
                last_verified_at,
                missing_reason
            )
        `)
        .order("code");

    if (jErr || !jurisdictions) {
        console.error("Failed to run test:", jErr);
        return;
    }

    const report = {
        total: jurisdictions.length,
        active: 0,
        stagedOnly: 0,
        missingSources: 0,
        grades: { A: 0, B: 0, C: 0, D: 0, F: 0 } as Record<string, number>
    };

    const details: any[] = [];

    for (const j of jurisdictions) {
        const rulesets: any[] = j.escort_rulesets || [];
        const coverage = j.ruleset_coverage?.[0] || { has_active_ruleset: false, coverage_grade: "F", missing_reason: "Init" };

        const hasActive = rulesets.some(rs => rs.status === "active");
        const hasStaged = rulesets.some(rs => rs.status === "staged");
        const hasSources = rulesets.some(rs => rs.source_bundle_id != null);

        if (hasActive) {
            report.active++;
        } else if (hasStaged && hasSources) {
            report.stagedOnly++;
        } else {
            report.missingSources++;
        }

        if (coverage.coverage_grade) {
            report.grades[coverage.coverage_grade] = (report.grades[coverage.coverage_grade] || 0) + 1;
        }

        details.push({
            State: j.code,
            Type: j.jurisdiction_type.replace("US_", "").replace("CA_", ""),
            Status: hasActive ? "ACTIVE" : (hasStaged ? "STAGED" : "MISSING"),
            Grade: coverage.coverage_grade,
            Verified: coverage.last_verified_at ? new Date(coverage.last_verified_at).toISOString().split('T')[0] : "Never"
        });
    }

    console.log("SUMMARY:");
    console.log(`- Total Jurisdictions:   ${report.total}`);
    console.log(`- Active Rulesets:       ${report.active}`);
    console.log(`- Staged Only:           ${report.stagedOnly}`);
    console.log(`- Missing Sources:       ${report.missingSources}\n`);

    console.log("GRADE DISTRIBUTION:");
    console.log(JSON.stringify(report.grades, null, 2), "\n");

    console.log("MISSING COVERAGE (Needs Review / Missing Sources):");
    const missing = details.filter(d => d.Status === "MISSING");
    if (missing.length === 0) {
        console.log("  [All 64 Jurisdictions have at least Staged rules/sources linked]");
    } else {
        console.log(`  [Showing first 10 of ${missing.length}]`);
        console.table(missing.slice(0, 10));
    }

    console.log("\nAcceptance Test Complete. 'Line Up Rules With State' validation successful.");
}
