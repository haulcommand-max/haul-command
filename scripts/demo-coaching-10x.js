
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function demoBrokerCoaching() {
    console.log("💼 Demo: Broker Coaching (Fair Range Engine)...");

    const testCases = [
        { label: "Low Baller", price: 1.5, type: "pevo_lead_chase" },
        { label: "Fair Price", price: 2.2, type: "pevo_lead_chase" },
        { label: "Strong Offer", price: 3.5, type: "pevo_lead_chase" }
    ];

    for (const t of testCases) {
        console.log(`\n🔍 Evaluating ${t.label} ($${t.price}/mile for ${t.type}):`);
        const { data: hint, error } = await supabase.rpc("get_posting_rate_hint", {
            p_country: "us",
            p_region: "southeast",
            p_service_type: t.type,
            p_posted_rate_per_mile: t.price
        });

        if (error) {
            console.error(`❌ Error logic:`, error);
        } else {
            console.log(`   💎 Signal: ${hint.bucket.toUpperCase()}`);
            console.log(`   📢 Message: ${hint.message}`);
            console.log(`   📈 Prob: ${hint.rate_position_01.toFixed(2)} position in market range [$${hint.market_low}-$${hint.market_high}]`);
        }
    }

    console.log("\n✅ Broker Coaching Demo complete.");
}

demoBrokerCoaching();
