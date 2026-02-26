
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCCE() {
    console.log("🧪 Testing Corridor Confidence Engine...");

    const corridor = "TX-FL";
    const userId = "d1111111-1111-1111-1111-111111111111"; // Tony Stallone

    // 1. Report Clear Route
    console.log("📡 Reporting 'route_clear'...");
    const { error: r1Error } = await supabase.from("corridor_reports").insert({
        user_id: userId,
        corridor_id: corridor,
        report_type: "route_clear",
        severity: 1
    });
    if (r1Error) console.error("❌ Error reporting clear:", r1Error.message);

    // 2. Report Delay (Negative Signal)
    console.log("⚠️ Reporting 'delay' from another user...");
    const { error: r2Error } = await supabase.from("corridor_reports").insert({
        user_id: "d2222222-2222-2222-2222-222222222222", // Sarah Miller
        corridor_id: corridor,
        report_type: "delay",
        severity: 3
    });
    if (r2Error) console.error("❌ Error reporting delay:", r2Error.message);

    // 3. Check Confidence Score
    const { data: confidence, error: cError } = await supabase
        .from("corridor_confidence")
        .select("*")
        .eq("corridor_id", corridor)
        .single();

    if (cError) {
        console.error("❌ Error fetching confidence:", cError);
    } else {
        console.log("📈 Current Confidence Score:", confidence.confidence_score);
        console.log("📊 Breakdowns:", {
            freshness: confidence.data_freshness_score,
            density: confidence.source_density_score,
            crowd: confidence.crowd_signal_score,
            penalty: confidence.incident_penalty_score
        });
    }
}

testCCE();
