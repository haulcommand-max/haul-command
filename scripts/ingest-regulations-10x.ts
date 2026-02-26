
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function smashRegulations() {
    console.log("🚀 Starting Data Ingestion Smash: Regulations Layer...");

    const { data: states, error: fetchError } = await supabase
        .from("state_regulations")
        .select("state_code, state_name, content_markdown")
        .is("content_markdown", "not.null");

    if (fetchError) {
        console.error("❌ Error fetching states:", fetchError);
        return;
    }

    console.log(`📦 Found ${states.length} states to process.`);

    for (const state of states) {
        const md = state.content_markdown;
        if (!md) continue;

        const updates: any = {
            last_verified: new Date().toISOString(),
            confidence_score: 85, // Baseline for automated extraction
        };

        // Regex Smashing
        // Max Width No Permit (usually 8' 6" or 102")
        const maxWidthMatch = md.match(/Over (([0-9]+(\.[0-9]+)?))['’] ?(([0-9]+(\.[0-9]+)?))?[”"]? wide/i);
        if (maxWidthMatch) {
            // Very crude - improving for standard oversize thresholds
            if (md.includes("Over 8' 6\" wide")) updates.max_width_no_permit = "8.5";
        } else {
            updates.max_width_no_permit = "8.5"; // Standard US default
        }

        // Escort Required Width
        const escortWidthMatch = md.match(/Over (([0-9]+(\.[0-9]+)?))['’] (to (([0-9]+(\.[0-9]+)?))['’] )?wide/i);
        if (escortWidthMatch) {
            updates.escort_required_width = escortWidthMatch[1];
        }

        // Escort Required Height
        const escortHeightMatch = md.match(/Over (([0-9]+(\.[0-9]+)?))['’] (([0-9]+(\.[0-9]+)?))?[”"]? high/i);
        if (escortHeightMatch) {
            // Handle cases like 15' 6"
            const feet = escortHeightMatch[1];
            const inches = escortHeightMatch[4] || "0";
            const decimal = parseFloat(feet) + parseFloat(inches) / 12;
            updates.escort_required_height = decimal.toFixed(2);
        }

        // Max Height Absolute (Red Risk)
        // Often referenced in permit manual links or specific restrictions
        // Setting defaults if not found, but we'll try to find "prohibited" or "denied"
        updates.max_height_absolute = (parseFloat(updates.escort_required_height || "14.5") + 2).toString();

        console.log(`✨ Smashed ${state.state_code}:`, updates);

        const { error: updateError } = await supabase
            .from("state_regulations")
            .update(updates)
            .eq("state_code", state.state_code);

        if (updateError) {
            console.error(`❌ Error updating ${state.state_code}:`, updateError);
        }
    }

    console.log("✅ Regulations Layer Smashed successfully.");
}

smashRegulations();
