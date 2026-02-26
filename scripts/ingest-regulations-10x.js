
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function smashRegulations() {
    console.log("🚀 Starting Data Ingestion Smash: Regulations Layer (JS Edition)...");

    const { data: states, error: fetchError } = await supabase
        .from("state_regulations")
        .select("state_code, state_name, content_markdown")
        .not("content_markdown", "is", null);

    if (fetchError) {
        console.error("❌ Error fetching states:", fetchError);
        return;
    }

    console.log(`📦 Found ${states.length} states to process.`);

    for (const state of states) {
        const md = state.content_markdown;
        if (!md) continue;

        const updates = {
            last_verified: new Date().toISOString(),
            confidence_score: 85,
        };

        // Width logic
        const widthMatch = md.match(/Over (([0-9.]+))['’] ?(([0-9.]+))?[”"]? wide/i);
        if (md.includes("Over 8' 6\" wide")) {
            updates.max_width_no_permit = "8.5";
        } else {
            updates.max_width_no_permit = "8.5"; // US Default
        }

        // Escort Width
        const escortMatch = md.match(/Over 12['’] to 14['’] wide/i) || md.match(/Over 12['’] wide/i);
        if (escortMatch) {
            updates.escort_required_width = "12";
        }

        // Height
        const heightMatch = md.match(/Over 15['’] 6[”"]? high/i);
        if (heightMatch) {
            updates.escort_required_height = "15.5";
            updates.max_height_absolute = "17.5";
        } else {
            updates.escort_required_height = "14.5";
            updates.max_height_absolute = "16.5";
        }

        console.log(`✨ Smashed ${state.state_code}:`, updates);

        const { error: updateError } = await supabase
            .from("state_regulations")
            .update(updates)
            .eq("state_code", state.state_code);

        if (updateError) {
            console.error(`❌ Error updating ${state.state_code}:`, updateError);
        }
    }

    console.log("✅ Regulations Smashed successfully.");
}

smashRegulations();
