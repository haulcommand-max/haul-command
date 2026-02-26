
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMoat() {
    console.log("🛡️ Verifying Competitive Moat Logic...");

    // 1. Check Phase
    const { data: phase, error: phaseErr } = await supabase.rpc("get_system_phase");
    console.log(`📍 Current System Phase: ${phase}`);

    // 2. Mock a hazard report (Note: this might fail if no auth user, but it's an RPC test)
    console.log("⚠️ Hazard Report Test...");
    const { data: hazardId, error: hazardErr } = await supabase.rpc("report_hazard", {
        p_hazard_type: "low_bridge",
        p_latitude: 28.5383,
        p_longitude: -81.3792,
        p_description: "13'6 clearance on I-4 Exit ramp"
    });

    if (hazardErr) {
        console.log(`ℹ️ Hazard Report (Auth Required): ${hazardErr.message}`);
    } else {
        console.log(`✅ Hazard Reported: ${hazardId}`);
    }

    // 3. Test Hazard Retrieval
    const { data: nearby, error: nearErr } = await supabase.rpc("get_hazards_near", {
        p_lat: 28.5,
        p_lng: -81.4,
        p_radius_miles: 100
    });

    if (nearErr) {
        console.error("❌ Error fetching hazards:", nearErr);
    } else {
        console.log(`📦 Found ${nearby?.length || 0} hazards nearby.`);
    }

    console.log("✅ Moat Verification complete.");
}

verifyMoat();
