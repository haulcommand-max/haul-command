
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function refreshIntelligence() {
    console.log("🧠 Starting Load Intelligence Refresh...");

    const { data: loads, error: fetchError } = await supabase
        .from("load_intel")
        .select("load_id")
        .limit(100); // Process in batches

    if (fetchError) {
        console.error("❌ Error fetching loads:", fetchError);
        return;
    }

    console.log(`📦 Processing ${loads.length} loads.`);

    for (const load of loads) {
        const { error: refreshError } = await supabase
            .rpc("refresh_load_intelligence", { p_load_id: load.load_id });

        if (refreshError) {
            console.error(`❌ Error refreshing load ${load.load_id}:`, refreshError);
        } else {
            console.log(`✨ Intelligence Refreshed: ${load.load_id}`);
        }
    }

    console.log("✅ Load Intelligence Refresh complete.");
}

refreshIntelligence();
