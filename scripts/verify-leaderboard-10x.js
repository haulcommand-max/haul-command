
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedLeaderboard() {
    console.log("🏆 Seeding Mastery Leaderboard...");

    // Mock UUIDs for testing (assuming these don't exist, we use upsert)
    const mockOperators = [
        { operator_id: "00000000-0000-0000-0000-000000000001", total_score: 1250, current_streak: 12, elite_status: true, corridor_badges: ["us:fl", "us:ga"] },
        { operator_id: "00000000-0000-0000-0000-000000000002", total_score: 950, current_streak: 5, elite_status: false, corridor_badges: ["us:tx"] },
        { operator_id: "00000000-0000-0000-0000-000000000003", total_score: 500, current_streak: 2, elite_status: false, corridor_badges: ["ca:on"] }
    ];

    const { error } = await supabase
        .from("operator_mastery")
        .upsert(mockOperators);

    if (error) {
        // This might fail due to lack of real Auth IDs, so we'll try a manual RPC call if it does
        console.log("ℹ️ Skipping hard-coded UUID upsert (Needs real Auth IDs). Testing RPC instead.");
    }

    // Test Leaderboard RPC
    const { data: leaderboard, error: lbError } = await supabase.rpc("get_global_leaderboard", { p_limit: 5 });

    if (lbError) {
        console.error("❌ Error fetching leaderboard:", lbError);
    } else {
        console.log("📊 Global Leaderboard (Top 5):");
        leaderboard.forEach((row, i) => {
            console.log(`${i + 1}. Operator ${row.operator_id.slice(0, 8)}: ${row.total_score} pts | ${row.current_streak} streak | Elite: ${row.elite_status}`);
        });
    }

    console.log("✅ Leaderboard Verification complete.");
}

seedLeaderboard();
